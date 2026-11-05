'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ExternalLink, Gift, Inbox, Loader2, Phone, Search, Trash2, X } from 'lucide-react';
import { LEAD_STATUSES, LEAD_TYPES } from '@/lib/constants';
import { formatKm, formatRupees } from '@/lib/pricing';
import { deleteLead, updateLead } from '@/app/admin/actions';
import { WhatsAppIcon } from '@/components/BrandIcons';
import { Toast } from '@/components/admin/client';
import { Badge, btn } from '@/components/admin/ui';

export type LeadRow = {
  id: number;
  type: string;
  name: string;
  phone: string;
  carId: number | null;
  carLabel: string;
  carSlug: string | null;
  referralCode: string | null;
  referrer: { name: string; phone: string; reward: number } | null;
  details: Record<string, string>;
  images: string[];
  status: string;
  notes: string;
  rewardPaid: boolean;
  createdAt: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const typeLabel = (t: string) => LEAD_TYPES.find((x) => x.value === t)?.label ?? t;
const prettyKey = (k: string) => k.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, (c) => c.toUpperCase());
const prettyValue = (k: string, v: string) => {
  if (/price/i.test(k) && /^\d+$/.test(v)) return formatRupees(Number(v));
  if (/^(kilometres|km)$/i.test(k) && /^\d+$/.test(v)) return formatKm(Number(v));
  return v;
};

export default function LeadsBoard({ leads, initial }: { leads: LeadRow[]; initial: { status: string; type: string; car: number | null; open: number | null } }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial.status);
  const [type, setType] = useState(initial.type);
  const [carFilter, setCarFilter] = useState(initial.car);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<number | null>(initial.open);
  const [notes, setNotes] = useState('');
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const open = leads.find((l) => l.id === openId) ?? null;
  useEffect(() => setNotes(open?.notes ?? ''), [open?.id, open?.notes]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (status === 'all' || l.status === status) &&
        (type === 'all' || l.type === type) &&
        (!carFilter || l.carId === carFilter) &&
        (!term || `${l.name} ${l.phone} ${l.carLabel} ${l.referralCode ?? ''}`.toLowerCase().includes(term)),
    );
  }, [leads, status, type, carFilter, q]);

  const patch = (id: number, p: Parameters<typeof updateLead>[1], msg = 'Lead updated') =>
    start(async () => {
      await updateLead(id, p);
      setToast(msg);
      router.refresh();
    });

  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s.value, leads.filter((l) => l.status === s.value).length]));

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
      {toast && <Toast message={toast} />}
      <div className="rd-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-1">
            {[{ value: 'all', label: 'All', n: leads.length }, ...LEAD_STATUSES.map((s) => ({ ...s, n: counts[s.value] }))].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setStatus(t.value)}
                className={`h-8 rounded-full px-3 text-[13px] font-medium transition ${status === t.value ? 'bg-ink text-white' : 'text-muted-foreground hover:bg-muted hover:text-ink'}`}
              >
                {t.label} <span className="opacity-60">{t.n}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, car, code…" className="rd-input pl-9" />
            </div>
            <select value={type} onChange={(e) => setType(e.target.value)} className="rd-select w-44">
              <option value="all">All types</option>
              {LEAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {carFilter && (
              <button type="button" onClick={() => setCarFilter(null)} className="flex h-10 items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-3 text-[13px] font-medium text-brand">
                One car only <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {filtered.map((l) => {
            const st = LEAD_STATUSES.find((s) => s.value === l.status)!;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(l.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-page/60 ${openId === l.id ? 'bg-brand-soft/40' : ''}`}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${l.status === 'new' ? 'bg-brand text-white' : 'bg-muted text-ink'}`}>
                    {l.name[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      {l.name}
                      <span className="text-[12px] font-normal text-muted-foreground">{l.phone}</span>
                    </span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {typeLabel(l.type)}
                      {l.carLabel && ` · ${l.carLabel}`}
                      {l.referralCode && ` · 🎟 ${l.referralCode}`}
                      {l.images.length > 0 && ` · 📷 ${l.images.length}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className={st.cls}>{st.label}</Badge>
                    <span className="text-[11px] text-muted-foreground">{fmt(l.createdAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!filtered.length && (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <Inbox className="size-8" />
            <p className="text-[14px]">No leads match.</p>
          </div>
        )}
      </div>

      {open ? (
        <aside className="rd-card fixed inset-0 z-50 flex flex-col overflow-auto rounded-none xl:sticky xl:top-6 xl:z-auto xl:max-h-[calc(100vh-3rem)] xl:rounded-[calc(var(--radius)*1.4)]">
          <div className="flex items-start justify-between gap-2 border-b border-border p-5">
            <div>
              <p className="text-[12px] font-semibold tracking-wider text-brand uppercase">{typeLabel(open.type)}</p>
              <h2 className="text-[20px] font-semibold text-ink">{open.name}</h2>
              <p className="text-[13px] text-muted-foreground">Received {fmt(open.createdAt)}</p>
            </div>
            <button type="button" onClick={() => setOpenId(null)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:+91${open.phone}`} className={btn.primary}>
                <Phone className="size-4" /> {open.phone}
              </a>
              <a
                href={`https://wa.me/91${open.phone}?text=${encodeURIComponent(`Hello ${open.name}, this is REDRIVE INDIA regarding your enquiry${open.carLabel ? ` about the ${open.carLabel.split(' — ')[0]}` : ''}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-[14px] font-semibold text-white"
              >
                <WhatsAppIcon /> WhatsApp
              </a>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-medium text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={pending}
                    onClick={() => patch(open.id, { status: s.value }, `Marked ${s.label.toLowerCase()}`)}
                    className={`h-8 rounded-full border px-3 text-[13px] font-semibold transition ${open.status === s.value ? s.cls : 'border-border bg-white text-muted-foreground hover:text-ink'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {open.carLabel && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-[12px] text-muted-foreground">Car</p>
                <p className="text-[14px] font-semibold text-ink">{open.carLabel}</p>
                {open.carSlug && (
                  <a href={`/cars/${open.carSlug}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand">
                    View listing <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            )}

            {Object.keys(open.details).length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-page p-3 text-[14px]">
                {Object.entries(open.details).map(([k, v]) => (
                  <div key={k} className={v.length > 30 ? 'col-span-2' : ''}>
                    <dt className="text-[12px] text-muted-foreground">{prettyKey(k)}</dt>
                    <dd className="font-medium break-words whitespace-pre-line text-ink">{prettyValue(k, v)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {open.images.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <Camera className="size-3.5" /> Customer photos ({open.images.length}) — click to open full size
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {open.images.map((src, i) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer" className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {open.referralCode && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[14px]">
                <p className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <Gift className="size-4" /> Referral code {open.referralCode}
                </p>
                {open.referrer && (open.referrer.name || open.referrer.phone) && (
                  <p className="mt-1 text-emerald-900">
                    Referred by {open.referrer.name || '—'} {open.referrer.phone && `(${open.referrer.phone})`}
                    {open.referrer.reward > 0 && ` · reward ${formatRupees(open.referrer.reward)}`}
                  </p>
                )}
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-emerald-900">
                  <input type="checkbox" checked={open.rewardPaid} onChange={(e) => patch(open.id, { rewardPaid: e.target.checked }, e.target.checked ? 'Reward marked paid' : 'Reward marked unpaid')} className="size-4 accent-emerald-600" />
                  Referrer reward paid
                </label>
              </div>
            )}

            <div>
              <label htmlFor="lead-notes" className="mb-1 block text-[12px] font-medium text-muted-foreground">
                Internal notes
              </label>
              <textarea id="lead-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="rd-input h-auto py-2" placeholder="Called on Monday, coming Saturday for test drive…" />
              <button type="button" disabled={pending || notes === open.notes} onClick={() => patch(open.id, { notes }, 'Notes saved')} className={`${btn.dark} mt-2`}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save notes
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Delete lead from ${open.name}?`)) return;
                start(async () => {
                  await deleteLead(open.id);
                  setOpenId(null);
                  setToast('Lead deleted');
                  router.refresh();
                });
              }}
              className={`${btn.danger} self-start`}
            >
              <Trash2 className="size-3.5" /> Delete lead
            </button>
          </div>
        </aside>
      ) : (
        <div className="hidden rounded-xl border-2 border-dashed border-border p-10 text-center text-[14px] text-muted-foreground xl:block">Select a lead to see details</div>
      )}
    </div>
  );
}
