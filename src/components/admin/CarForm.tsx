'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Plus, Trash2, X } from 'lucide-react';
import type { Car, CustomSpec, InspectionItem } from '@/db/schema';
import { BODY_TYPES, BRANDS, CAR_STATUSES, COMMON_FEATURES, FUELS, INSPECTION_AREAS, MAX_CAR_IMAGES, MONTHS, OWNERS, SPEC_SUGGESTIONS, TRANSMISSIONS } from '@/lib/constants';
import { finalPrice, formatPrice, formatRupees } from '@/lib/pricing';
import { saveCar, type ActionResult } from '@/app/admin/actions';
import ImageManager from './ImageManager';
import { SubmitButton } from './client';
import { Card, Field, btn } from './ui';

type Props = { car?: Car; images?: string[] };

export default function CarForm({ car, images = [] }: Props) {
  const [state, action] = useFormState<ActionResult, FormData>(saveCar, null);

  const [price, setPrice] = useState(car?.price ? String(car.price) : '');
  const [discountType, setDiscountType] = useState(car?.discountType ?? 'none');
  const [discountValue, setDiscountValue] = useState(car?.discountValue ? String(car.discountValue) : '');
  const [features, setFeatures] = useState<string[]>(car?.features ?? []);
  const [customFeature, setCustomFeature] = useState('');
  const [specs, setSpecs] = useState<(CustomSpec & { key: string })[]>(() => (car?.specs ?? []).map((x) => ({ ...x, key: crypto.randomUUID() })));
  const addSpec = (label = '') => setSpecs((list) => [...list, { key: crypto.randomUUID(), label, value: '' }]);
  const setSpec = (key: string, patch: Partial<CustomSpec>) => setSpecs((list) => list.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const removeSpec = (key: string) => setSpecs((list) => list.filter((x) => x.key !== key));
  const usedLabels = new Set(specs.map((x) => x.label.trim().toLowerCase()));

  const [inspection, setInspection] = useState<InspectionItem[]>(
    INSPECTION_AREAS.map((area) => car?.inspection.find((i) => i.area === area) ?? { area, score: 0, note: '' }),
  );

  const p = Number(price) || 0;
  const final = finalPrice({ price: p, discountType, discountValue: Number(discountValue) || 0 });
  const toggleFeature = (f: string) => setFeatures((list) => (list.includes(f) ? list.filter((x) => x !== f) : [...list, f]));
  const addCustom = () => {
    const f = customFeature.trim();
    if (f && !features.includes(f)) setFeatures([...features, f]);
    setCustomFeature('');
  };
  const setInsp = (i: number, patch: Partial<InspectionItem>) => setInspection((list) => list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const year = new Date().getFullYear();

  return (
    <form action={action} className="flex flex-col gap-6 pb-24">
      {car && <input type="hidden" name="id" value={car.id} />}
      <input type="hidden" name="features" value={JSON.stringify(features)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs.map(({ label, value }) => ({ label, value })))} />
      <input type="hidden" name="inspection" value={JSON.stringify(inspection.filter((i) => i.score > 0))} />

      <Card title="Photos" description={`Upload 6–8 clear photos: front, rear, both sides, interior, dashboard, engine bay, odometer. Up to ${MAX_CAR_IMAGES}.`}>
        <ImageManager name="images" initial={images} max={MAX_CAR_IMAGES} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Car details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Brand *" htmlFor="brand">
                <input id="brand" name="brand" required list="brand-list" defaultValue={car?.brand} className="rd-input" placeholder="e.g. Hyundai" />
                <datalist id="brand-list">
                  {BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label="Model *" htmlFor="model">
                <input id="model" name="model" required defaultValue={car?.model} className="rd-input" placeholder="e.g. Creta" />
              </Field>
              <Field label="Variant" htmlFor="variant">
                <input id="variant" name="variant" defaultValue={car?.variant} className="rd-input" placeholder="e.g. SX (O) 1.5 Diesel AT" />
              </Field>
              <Field label="Model year (month & year) *" htmlFor="year">
                <div className="grid grid-cols-[1fr_1.2fr] gap-2">
                  <select id="month" name="month" aria-label="Month" defaultValue={car?.month ?? ''} className="rd-select">
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input id="year" name="year" type="number" required min={1990} max={year + 1} defaultValue={car?.year ?? year - 3} className="rd-input" aria-label="Year" />
                </div>
              </Field>
              <Field label="Kilometres driven *" htmlFor="km">
                <input id="km" name="km" type="number" required min={0} step={1} defaultValue={car?.km} className="rd-input" placeholder="e.g. 38500" />
              </Field>
              <Field label="Ownership" htmlFor="owner">
                <select id="owner" name="owner" defaultValue={car?.owner ?? OWNERS[0]} className="rd-select">
                  {OWNERS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fuel" htmlFor="fuel">
                <select id="fuel" name="fuel" defaultValue={car?.fuel ?? 'Petrol'} className="rd-select">
                  {FUELS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Transmission" htmlFor="transmission">
                <select id="transmission" name="transmission" defaultValue={car?.transmission ?? 'Manual'} className="rd-select">
                  {TRANSMISSIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Body type" htmlFor="bodyType">
                <select id="bodyType" name="bodyType" defaultValue={car?.bodyType ?? 'SUV'} className="rd-select">
                  {BODY_TYPES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Colour" htmlFor="color">
                <input id="color" name="color" defaultValue={car?.color} className="rd-input" placeholder="e.g. Polar White" />
              </Field>
              <Field label="Seats" htmlFor="seats">
                <input id="seats" name="seats" type="number" min={2} max={12} defaultValue={car?.seats ?? ''} className="rd-input" placeholder="5" />
              </Field>
              <Field label="Registration" htmlFor="registration">
                <input id="registration" name="registration" defaultValue={car?.registration ?? 'UP-70 · Prayagraj'} className="rd-input" />
              </Field>
              <Field label="Insurance" htmlFor="insuranceValidity" className="sm:col-span-2 lg:col-span-3">
                <input id="insuranceValidity" name="insuranceValidity" defaultValue={car?.insuranceValidity} className="rd-input" placeholder="e.g. Comprehensive, valid till Mar 2026" />
              </Field>
            </div>
          </Card>

          <Card
            title="More details"
            description="Add any extra fields you want buyers to see: engine, mileage, service history, anything. Each one appears in the car overview."
            actions={
              <button type="button" onClick={() => addSpec()} className={`${btn.outline} shrink-0 whitespace-nowrap`}>
                <Plus className="size-4" />
                Add field
              </button>
            }
          >
            {specs.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {specs.map((sp) => (
                  <div key={sp.key} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                    <input
                      value={sp.label}
                      onChange={(e) => setSpec(sp.key, { label: e.target.value })}
                      placeholder="Field name, e.g. Engine"
                      aria-label="Field name"
                      className="rd-input font-medium"
                    />
                    <input
                      value={sp.value}
                      onChange={(e) => setSpec(sp.key, { value: e.target.value })}
                      placeholder="Value, e.g. 1497 cc"
                      aria-label="Value"
                      className="rd-input"
                      autoFocus={!sp.value && !!sp.label}
                    />
                    <button type="button" onClick={() => removeSpec(sp.key)} className={btn.danger} aria-label="Remove field">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mb-2 text-[12px] font-medium text-muted-foreground">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SPEC_SUGGESTIONS.filter((l) => !usedLabels.has(l.toLowerCase())).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => addSpec(l)}
                  className="h-7 rounded-full border border-dashed border-input px-2.5 text-[12px] font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  + {l}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">Rows with an empty name or value are skipped when you save.</p>
          </Card>

          <Card title="Features" description="Tick what this car has, or add your own.">
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...COMMON_FEATURES, ...features])).map((f) => {
                const on = features.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`h-8 rounded-full border px-3 text-[13px] font-medium transition ${on ? 'border-brand bg-brand text-white' : 'border-border bg-white text-ink hover:border-brand'}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Add another feature…"
                className="rd-input"
              />
              <button type="button" onClick={addCustom} className={btn.outline}>
                <Plus className="size-4" />
                Add
              </button>
            </div>
          </Card>

          <Card title="Inspection report" description="Rate each area 1–5 (leave blank to hide it). Shown to buyers on the car page.">
            <div className="flex flex-col gap-3">
              {inspection.map((it, i) => (
                <div key={it.area} className="grid items-center gap-2 sm:grid-cols-[180px_auto_1fr]">
                  <span className="text-[14px] font-medium text-ink">{it.area}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInsp(i, { score: it.score === n ? 0 : n })}
                        className={`size-8 rounded-md border text-[13px] font-semibold transition ${
                          it.score >= n ? (it.score >= 4 ? 'border-emerald-500 bg-emerald-500 text-white' : it.score === 3 ? 'border-amber-400 bg-amber-400 text-ink' : 'border-brand bg-brand text-white') : 'border-border bg-white text-muted-foreground'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input value={it.note ?? ''} onChange={(e) => setInsp(i, { note: e.target.value })} placeholder="Note (optional)" className="rd-input h-9" />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Description">
            <textarea name="description" rows={5} defaultValue={car?.description} className="rd-input h-auto py-2" placeholder="Service history, condition, why it’s a good buy…" />
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
          <Card title="Pricing">
            <div className="flex flex-col gap-4">
              <Field label="Listed price (₹) *" htmlFor="price" hint={p ? formatPrice(p) : undefined}>
                <input id="price" name="price" type="number" required min={1} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className="rd-input" placeholder="e.g. 1475000" />
              </Field>
              <Field label="Discount" htmlFor="discountType">
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                  {[
                    { v: 'none', l: 'None' },
                    { v: 'flat', l: '₹ Flat' },
                    { v: 'percent', l: '% Off' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setDiscountType(o.v)}
                      className={`h-8 rounded-md text-[13px] font-semibold transition ${discountType === o.v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="discountType" value={discountType} />
              </Field>
              {discountType !== 'none' && (
                <>
                  <Field label={discountType === 'flat' ? 'Discount amount (₹)' : 'Discount (%)'} htmlFor="discountValue">
                    <input
                      id="discountValue"
                      name="discountValue"
                      type="number"
                      min={0}
                      max={discountType === 'percent' ? 90 : undefined}
                      step={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="rd-input"
                    />
                  </Field>
                  <Field label="Discount label" htmlFor="discountLabel" hint="Shown next to the price, e.g. “Diwali offer”">
                    <input id="discountLabel" name="discountLabel" defaultValue={car?.discountLabel} className="rd-input" placeholder="Festive offer" />
                  </Field>
                </>
              )}
              <div className="rounded-xl bg-ink p-4 text-white">
                <p className="text-[12px] text-white/60">Customer pays</p>
                <p className="font-heading text-[26px] font-semibold">{p ? formatPrice(final) : '—'}</p>
                {p > 0 && final < p && (
                  <p className="text-[12px] text-emerald-300">
                    Saves {formatRupees(p - final)} ({Math.round(((p - final) / p) * 100)}%)
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Visibility">
            <div className="flex flex-col gap-4">
              <Field label="Status" htmlFor="status">
                <select id="status" name="status" defaultValue={car?.status ?? 'available'} className="rd-select">
                  {CAR_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="featured" defaultChecked={car?.featured} className="mt-0.5 size-4 accent-[var(--brand)]" />
                <span>
                  <span className="block text-[14px] font-medium text-ink">Featured</span>
                  <span className="text-[12px] text-muted-foreground">Show in “Handpicked from our yard” on the homepage</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="newArrival" defaultChecked={car ? car.newArrival : true} className="mt-0.5 size-4 accent-[var(--brand)]" />
                <span>
                  <span className="block text-[14px] font-medium text-ink">New arrival</span>
                  <span className="text-[12px] text-muted-foreground">Adds the red “New Arrival” badge</span>
                </span>
              </label>
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <p className={`text-[13px] font-medium ${state && !state.ok ? 'text-brand' : 'text-muted-foreground'}`}>
            {state && !state.ok ? state.message : car ? `Editing ${car.year} ${car.brand} ${car.model}` : 'New car'}
          </p>
          <div className="flex gap-2">
            <Link href="/admin/cars" className={btn.outline}>
              <X className="size-4" />
              Cancel
            </Link>
            <SubmitButton>{car ? 'Save changes' : 'Publish car'}</SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
