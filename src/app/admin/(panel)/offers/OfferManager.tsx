'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CarFront, Gift, Home, Pencil, Plus, Trash2, X } from 'lucide-react';
import { deleteOffer, saveOffer, toggleOffer, type ActionResult } from '@/app/admin/actions';
import ImageManager from '@/components/admin/ImageManager';
import OfferIcon, { OFFER_ICONS } from '@/components/OfferIcon';
import { ActionButton, SubmitButton, Toast } from '@/components/admin/client';
import { Badge, Field, btn } from '@/components/admin/ui';

export type OfferRow = {
  id: number;
  category: string;
  icon: string;
  highlight: string;
  terms: string;
  claimable: boolean;
  title: string;
  description: string;
  image: string | null;
  carId: number | null;
  ctaLabel: string;
  ctaHref: string;
  validUntil: string;
  active: boolean;
  showOnHome: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function OfferForm({ edit, cars, onDone }: { edit: OfferRow | null; cars: { id: number; label: string }[]; onDone: (saved: boolean) => void }) {
  const router = useRouter();
  const [state, action] = useFormState<ActionResult, FormData>(saveOffer, null);
  const [category, setCategory] = useState(edit?.category ?? 'showroom');
  const [icon, setIcon] = useState(edit?.icon ?? 'gift');
  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      onDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const showroom = category === 'showroom';

  return (
    <form action={action} className="rd-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">{edit ? 'Edit offer' : 'New offer'}</h2>
        <button type="button" onClick={() => onDone(false)} className="rounded-full p-1 hover:bg-muted" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      {edit && <input type="hidden" name="id" value={edit.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="icon" value={icon} />

      <Field label="Offer type">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {[
            { v: 'showroom', l: 'Showroom offer / event', Icon: Gift },
            { v: 'car', l: 'Car deal', Icon: CarFront },
          ].map(({ v, l, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setCategory(v)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold transition ${category === v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground'}`}
            >
              <Icon className="size-4" />
              {l}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Title *" htmlFor="of-title">
        <input id="of-title" name="title" required defaultValue={edit?.title} className="rd-input" placeholder={showroom ? 'Free car health check-up' : 'Diwali deal on Hyundai Creta'} />
      </Field>
      <Field label="Description" htmlFor="of-desc">
        <textarea
          id="of-desc"
          name="description"
          rows={3}
          defaultValue={edit?.description}
          className="rd-input h-auto py-2"
          placeholder={showroom ? '25-point check of engine, brakes, AC and battery — on us. Bring any car.' : ''}
        />
      </Field>

      {showroom ? (
        <>
          <Field label="Icon">
            <div className="grid grid-cols-6 gap-1.5">
              {Object.entries(OFFER_ICONS).map(([key, { label, Icon }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={icon === key}
                  onClick={() => setIcon(key)}
                  className={`flex aspect-square items-center justify-center rounded-lg border transition ${icon === key ? 'border-brand bg-brand text-white' : 'border-border bg-white text-ink hover:border-brand'}`}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Highlight badge" htmlFor="of-hl" hint="Short and bold, e.g. FREE, ₹2,000 OFF, 0% FEE">
            <input id="of-hl" name="highlight" maxLength={24} defaultValue={edit?.highlight ?? 'FREE'} className="rd-input uppercase" />
          </Field>
          <Field label="Terms & conditions" htmlFor="of-terms" hint="Shown in a collapsible box on the offer">
            <textarea id="of-terms" name="terms" rows={3} defaultValue={edit?.terms} className="rd-input h-auto py-2" placeholder="Valid on weekdays. One per customer. Prior booking required." />
          </Field>
          <label className="flex items-start gap-2 text-[14px] font-medium text-ink">
            <input type="checkbox" name="claimable" defaultChecked={edit ? edit.claimable : true} className="mt-0.5 size-4 accent-[var(--brand)]" />
            <span>
              Show “Claim offer” button
              <span className="block text-[12px] font-normal text-muted-foreground">Customers leave their name &amp; number — it arrives in Leads as an “Offer claim”.</span>
            </span>
          </label>
        </>
      ) : (
        <>
          <Field label="Linked car" htmlFor="of-car" hint="Shows the car’s photo and live price, and links to it">
            <select id="of-car" name="carId" defaultValue={edit?.carId ?? ''} className="rd-select">
              <option value="">— None —</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Badge text" htmlFor="of-hl" hint="Optional, e.g. Price drop">
            <input id="of-hl" name="highlight" maxLength={24} defaultValue={edit?.highlight} className="rd-input" />
          </Field>
        </>
      )}

      <Field label={showroom ? 'Background photo (optional)' : 'Banner image'} hint={showroom ? 'Leave empty for the dark branded design' : 'Optional — overrides the car photo'}>
        <ImageManager name="image" initial={edit?.image ? [edit.image] : []} single folder="offers" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Extra button text" htmlFor="of-cta">
          <input id="of-cta" name="ctaLabel" defaultValue={edit?.ctaLabel} className="rd-input" placeholder={showroom ? 'Book test drive' : 'Start exchange'} />
        </Field>
        <Field label="Extra button link" htmlFor="of-href">
          <input id="of-href" name="ctaHref" defaultValue={edit?.ctaHref} className="rd-input" placeholder="/contact" />
        </Field>
        <Field label="Valid until" htmlFor="of-valid" hint="Hidden automatically after">
          <input id="of-valid" name="validUntil" type="date" defaultValue={edit?.validUntil} className="rd-input" />
        </Field>
        <Field label="Order" htmlFor="of-order" hint="Lower shows first">
          <input id="of-order" name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} className="rd-input" />
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <input type="checkbox" name="active" defaultChecked={edit ? edit.active : true} className="size-4 accent-[var(--brand)]" />
          Active
        </label>
        <label className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <input type="checkbox" name="showOnHome" defaultChecked={edit ? edit.showOnHome : true} className="size-4 accent-[var(--brand)]" />
          Show on homepage (first 3)
        </label>
      </div>
      {state && !state.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">{state.message}</p>}
      <SubmitButton>{edit ? 'Save offer' : 'Create offer'}</SubmitButton>
    </form>
  );
}

export default function OfferManager({ rows, cars }: { rows: OfferRow[]; cars: { id: number; label: string }[] }) {
  const [editing, setEditing] = useState<OfferRow | null | 'new'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [filter, setFilter] = useState<'all' | 'showroom' | 'car'>('all');
  const shown = rows.filter((o) => filter === 'all' || o.category === filter);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      {toast && <Toast message={toast} />}
      <div className="rd-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', 'All', rows.length],
                ['showroom', 'Showroom', rows.filter((o) => o.category === 'showroom').length],
                ['car', 'Car deals', rows.filter((o) => o.category !== 'showroom').length],
              ] as const
            ).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`h-8 rounded-full px-3 text-[13px] font-medium transition ${filter === id ? 'bg-ink text-white' : 'text-muted-foreground hover:bg-muted hover:text-ink'}`}
              >
                {label} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setEditing('new')} className={btn.primary}>
            <Plus className="size-4" /> New offer
          </button>
        </div>
        <ul className="divide-y divide-border">
          {shown.map((o) => {
            const car = cars.find((c) => c.id === o.carId);
            const expired = o.validUntil && o.validUntil < today;
            return (
              <li key={o.id} className="flex items-center gap-4 p-4">
                <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink">
                  {o.image ? (
                    <img src={o.image} alt="" className="h-full w-full object-cover" />
                  ) : o.category === 'showroom' ? (
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
                      <OfferIcon name={o.icon} className="size-5" />
                    </span>
                  ) : (
                    <CarFront className="size-5 text-white/50" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {o.title}
                    {o.category === 'showroom' ? (
                      <Badge className="border-brand/20 bg-brand-soft text-brand">Showroom{o.highlight && ` · ${o.highlight}`}</Badge>
                    ) : (
                      <Badge className="border-sky-200 bg-sky-50 text-sky-700">Car deal</Badge>
                    )}
                    {!o.active ? (
                      <Badge className="border-zinc-200 bg-zinc-100 text-zinc-600">Paused</Badge>
                    ) : expired ? (
                      <Badge className="border-amber-200 bg-amber-50 text-amber-800">Expired</Badge>
                    ) : (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Live</Badge>
                    )}
                    {o.showOnHome && <Home className="size-3.5 text-muted-foreground" aria-label="On homepage" />}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {car ? `🚗 ${car.label}` : o.description}
                    {o.validUntil && ` · till ${o.validUntil}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <ActionButton action={() => toggleOffer(o.id, !o.active)}>{o.active ? 'Pause' : 'Resume'}</ActionButton>
                  <button type="button" onClick={() => setEditing(o)} className={btn.ghost} title="Edit">
                    <Pencil className="size-3.5" />
                  </button>
                  <ActionButton action={() => deleteOffer(o.id)} confirm={`Delete “${o.title}”?`} className={btn.danger} title="Delete">
                    <Trash2 className="size-3.5" />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
        {!shown.length && <p className="p-10 text-center text-[14px] text-muted-foreground">No offers yet.</p>}
      </div>
      <div className="xl:sticky xl:top-6 xl:self-start">
        {editing ? (
          <OfferForm
            key={editing === 'new' ? 'new' : editing.id}
            edit={editing === 'new' ? null : editing}
            cars={cars}
            onDone={(saved) => {
              if (saved) setToast('Offer saved');
              setEditing(null);
            }}
          />
        ) : (
          <div className="rd-card p-5 text-[14px] text-muted-foreground">
            Tip: to put a single car on sale, set a discount on the car itself (Cars → Edit → Pricing). Offers are for banners and promotions.
          </div>
        )}
      </div>
    </div>
  );
}
