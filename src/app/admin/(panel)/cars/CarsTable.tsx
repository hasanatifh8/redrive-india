'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, Eye, ImageOff, Inbox, Loader2, Pencil, Search, Star, Trash2 } from 'lucide-react';
import { CAR_STATUSES } from '@/lib/constants';
import { formatKm, formatPrice } from '@/lib/pricing';
import { bulkCarAction, deleteCar, duplicateCar } from '@/app/admin/actions';
import { ActionButton, Toast } from '@/components/admin/client';
import { Badge, btn } from '@/components/admin/ui';

export type AdminCarRow = {
  id: number;
  slug: string;
  title: string;
  variant: string;
  year: number;
  km: number;
  fuel: string;
  transmission: string;
  price: number;
  final: number;
  status: string;
  featured: boolean;
  newArrival: boolean;
  views: number;
  leads: number;
  cover: string | null;
  photoCount: number;
  updatedAt: string;
};

const BULK = [
  { value: 'available', label: 'Mark available' },
  { value: 'reserved', label: 'Mark reserved' },
  { value: 'sold', label: 'Mark sold' },
  { value: 'draft', label: 'Move to drafts (hide)' },
  { value: 'feature', label: 'Feature on homepage' },
  { value: 'unfeature', label: 'Remove from featured' },
  { value: 'new', label: 'Tag “New Arrival”' },
  { value: 'unnew', label: 'Remove “New Arrival”' },
  { value: 'discount-percent', label: 'Apply % discount…' },
  { value: 'discount-flat', label: 'Apply ₹ discount…' },
  { value: 'clear-discount', label: 'Remove discount' },
  { value: 'delete', label: 'Delete permanently' },
];

export default function CarsTable({ rows, initialStatus, initialQuery }: { rows: AdminCarRow[]; initialStatus: string; initialQuery: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState(initialQuery);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulk, setBulk] = useState('');
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const counts = Object.fromEntries(CAR_STATUSES.map((s) => [s.value, rows.filter((r) => r.status === s.value).length]));
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => (status === 'all' || r.status === status) && (!term || `${r.title} ${r.variant} ${r.year}`.toLowerCase().includes(term)));
  }, [rows, status, q]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map((r) => r.id));
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const runBulk = () => {
    if (!bulk) return;
    let value: number | undefined;
    if (bulk.startsWith('discount-')) {
      const input = window.prompt(bulk === 'discount-percent' ? 'Discount percentage (1–90):' : 'Discount amount in ₹ (e.g. 25000):');
      if (!input) return;
      value = Number(input.replace(/[^\d.]/g, ''));
    }
    if (bulk === 'delete' && !window.confirm(`Delete ${selected.length} car(s)?\n\nTheir photos are kept in Admin → Recover photos, and a backup is available in Admin → Backups.`)) return;
    start(async () => {
      const res = await bulkCarAction(selected, bulk, value);
      setToast({ message: res?.message ?? 'Done', ok: !!res?.ok });
      if (res?.ok) {
        setSelected([]);
        setBulk('');
      }
      router.refresh();
    });
  };

  const tabs = [{ value: 'all', label: 'All', n: rows.length }, ...CAR_STATUSES.map((s) => ({ value: s.value, label: s.label.replace(' (hidden)', 's'), n: counts[s.value] }))];

  return (
    <div className="rd-card overflow-hidden">
      {toast && <Toast message={toast.message} ok={toast.ok} />}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
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
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cars…" className="rd-input w-full pl-9 lg:w-64" />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-brand-soft/50 px-4 py-2.5">
          <span className="text-[13px] font-semibold text-ink">{selected.length} selected</span>
          <select value={bulk} onChange={(e) => setBulk(e.target.value)} className="rd-select h-9 w-56 bg-white">
            <option value="">Bulk action…</option>
            {BULK.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={runBulk} disabled={!bulk || pending} className={`${btn.dark} h-9`}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Apply
          </button>
          <button type="button" onClick={() => setSelected([])} className={btn.ghost}>
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead className="bg-page/70 text-[12px] font-semibold text-muted-foreground uppercase">
            <tr>
              <th className="w-10 p-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 accent-[var(--brand)]" aria-label="Select all" />
              </th>
              <th className="p-3">Car</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Activity</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const st = CAR_STATUSES.find((s) => s.value === r.status)!;
              return (
                <tr key={r.id} className={`transition hover:bg-page/50 ${selected.includes(r.id) ? 'bg-brand-soft/30' : ''}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-[var(--brand)]" aria-label={`Select ${r.title}`} />
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/cars/${r.id}`} className="flex items-center gap-3">
                      <span className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {r.cover ? <img src={r.cover} alt="" className="h-full w-full object-cover" /> : <ImageOff className="size-4 text-muted-foreground" />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold text-ink">
                          {r.year} {r.title}
                          {r.featured && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                          {r.newArrival && <span className="rounded bg-brand px-1 text-[10px] font-semibold text-white">NEW</span>}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {r.variant} · {formatKm(r.km)} · {r.fuel} · {r.photoCount} photo{r.photoCount === 1 ? '' : 's'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-semibold text-ink">{formatPrice(r.final)}</span>
                    {r.final < r.price && <span className="block text-[12px] text-muted-foreground line-through">{formatPrice(r.price)}</span>}
                  </td>
                  <td className="p-3">
                    <Badge className={st.cls}>{st.label.replace(' (hidden)', '')}</Badge>
                  </td>
                  <td className="p-3 text-[13px] whitespace-nowrap text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" /> {r.views} views
                    </span>
                    <Link href={`/admin/leads?car=${r.id}`} className="flex items-center gap-1 hover:text-brand">
                      <Inbox className="size-3.5" /> {r.leads} leads
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-0.5">
                      <Link href={`/admin/cars/${r.id}`} className={btn.ghost} title="Edit">
                        <Pencil className="size-3.5" />
                      </Link>
                      {r.status !== 'draft' && (
                        <a href={`/cars/${r.slug}`} target="_blank" className={btn.ghost} title="View on website">
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      <ActionButton action={() => duplicateCar(r.id)} title="Duplicate as draft">
                        <Copy className="size-3.5" />
                      </ActionButton>
                      <ActionButton action={() => deleteCar(r.id)} confirm={`Delete ${r.year} ${r.title}?\n\nIts photos are kept — you can re-attach them from Admin → Recover photos, or restore from Admin → Backups.`} className={btn.danger} title="Delete">
                        <Trash2 className="size-3.5" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <p className="p-10 text-center text-[14px] text-muted-foreground">No cars here yet.</p>}
      </div>
    </div>
  );
}
