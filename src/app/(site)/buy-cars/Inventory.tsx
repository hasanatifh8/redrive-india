'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import type { CarView } from '@/lib/data';
import { BODY_TYPES, BUDGET_OPTIONS, FUELS, TRANSMISSIONS } from '@/lib/constants';
import CarCard from '@/components/CarCard';
import { EmptyState } from '@/components/ui';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest listings' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'km-asc', label: 'Kilometres: lowest' },
  { value: 'year-desc', label: 'Model year: newest' },
  { value: 'discount', label: 'Biggest discount' },
];

const KM_OPTIONS = [20000, 40000, 60000, 80000, 100000].map((v) => ({ value: v, label: `Under ${v.toLocaleString('en-IN')} km` }));

const KEYS = ['q', 'brand', 'model', 'min', 'max', 'fuel', 'transmission', 'body', 'minYear', 'maxKm', 'deals', 'sort'] as const;
type Key = (typeof KEYS)[number];

const sorters: Record<string, (a: CarView, b: CarView) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.getTime() - a.createdAt.getTime(),
  newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  'price-asc': (a, b) => a.final - b.final,
  'price-desc': (a, b) => b.final - a.final,
  'km-asc': (a, b) => a.km - b.km,
  'year-desc': (a, b) => b.year - a.year,
  discount: (a, b) => b.saving - a.saving,
};

function Select({
  id,
  label,
  empty,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  empty: string;
  value: string;
  options: { value: string | number; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`f-${id}`} className="text-[12px] font-medium text-muted-foreground">
        {label}
      </label>
      <select id={`f-${id}`} className="rd-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Inventory({ cars }: { cars: CarView[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);

  const f = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ''])) as Record<Key, string>;
  const sort = f.sort || 'featured';

  const update = (k: Key, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    if (k === 'brand' && v && f.model && !cars.some((c) => c.brand === v && c.model === f.model)) next.delete('model');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  };
  const reset = () => router.replace(pathname, { scroll: false });

  const brands = Array.from(new Set(cars.map((c) => c.brand))).sort();
  const models = Array.from(new Set(cars.filter((c) => !f.brand || c.brand === f.brand).map((c) => c.model))).sort();
  const years = Array.from(new Set(cars.map((c) => c.year))).sort((a, b) => b - a);

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = cars.filter(
      (c) =>
        (!q || `${c.brand} ${c.model} ${c.variant} ${c.color} ${c.bodyType}`.toLowerCase().includes(q)) &&
        (!f.brand || c.brand === f.brand) &&
        (!f.model || c.model === f.model) &&
        (!f.min || c.final >= Number(f.min)) &&
        (!f.max || c.final <= Number(f.max)) &&
        (!f.fuel || c.fuel === f.fuel) &&
        (!f.transmission || c.transmission === f.transmission) &&
        (!f.body || c.bodyType === f.body) &&
        (!f.minYear || c.year >= Number(f.minYear)) &&
        (!f.maxKm || c.km <= Number(f.maxKm)) &&
        (!f.deals || c.saving > 0),
    );
    return [...list].sort(sorters[sort] ?? sorters.featured);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, cars]);

  const activeChips = KEYS.filter((k) => k !== 'sort' && f[k]);
  const chipLabel = (k: Key) => {
    const v = f[k];
    if (k === 'min') return `From ${BUDGET_OPTIONS.find((o) => String(o.value) === v)?.label ?? v}`;
    if (k === 'max') return `Up to ${BUDGET_OPTIONS.find((o) => String(o.value) === v)?.label ?? v}`;
    if (k === 'minYear') return `${v} or newer`;
    if (k === 'maxKm') return `Under ${Number(v).toLocaleString('en-IN')} km`;
    if (k === 'deals') return 'Discounted only';
    if (k === 'q') return `“${v}”`;
    return v;
  };

  return (
    <div className="rd-container grid gap-6 py-10 lg:grid-cols-[280px_1fr]">
      <aside className={`${showFilters ? 'fixed inset-0 z-50 overflow-auto bg-black/50 p-3' : 'hidden'} lg:static lg:block lg:bg-transparent lg:p-0`}>
        <div className="rd-card flex flex-col gap-3 p-4 lg:sticky lg:top-32">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ink">Filters</h2>
            <div className="flex items-center gap-3">
              {activeChips.length > 0 && (
                <button type="button" onClick={reset} className="flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-dark">
                  <RotateCcw className="size-3.5" />
                  Reset
                </button>
              )}
              <button type="button" className="lg:hidden" aria-label="Close filters" onClick={() => setShowFilters(false)}>
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="f-q" className="text-[12px] font-medium text-muted-foreground">
              Search
            </label>
            <input id="f-q" className="rd-input" placeholder="e.g. Creta, sunroof, white" defaultValue={f.q} onChange={(e) => update('q', e.target.value)} />
          </div>
          <Select id="brand" label="Brand" empty="All brands" value={f.brand} onChange={(v) => update('brand', v)} options={brands.map((b) => ({ value: b, label: b }))} />
          <Select id="model" label="Model" empty="All models" value={f.model} onChange={(v) => update('model', v)} options={models.map((m) => ({ value: m, label: m }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select id="min" label="Min budget" empty="No min" value={f.min} onChange={(v) => update('min', v)} options={BUDGET_OPTIONS} />
            <Select id="max" label="Max budget" empty="No max" value={f.max} onChange={(v) => update('max', v)} options={BUDGET_OPTIONS} />
          </div>
          <Select id="body" label="Body type" empty="Any body type" value={f.body} onChange={(v) => update('body', v)} options={BODY_TYPES.map((x) => ({ value: x, label: x }))} />
          <Select id="fuel" label="Fuel type" empty="Any fuel" value={f.fuel} onChange={(v) => update('fuel', v)} options={FUELS.map((x) => ({ value: x, label: x }))} />
          <Select id="transmission" label="Transmission" empty="Any" value={f.transmission} onChange={(v) => update('transmission', v)} options={TRANSMISSIONS.map((x) => ({ value: x, label: x }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select id="minYear" label="Model year" empty="Any year" value={f.minYear} onChange={(v) => update('minYear', v)} options={years.map((y) => ({ value: y, label: `${y}+` }))} />
            <Select id="maxKm" label="Kilometres" empty="Any km" value={f.maxKm} onChange={(v) => update('maxKm', v)} options={KM_OPTIONS} />
          </div>
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-ink">
            <input type="checkbox" className="size-4 accent-[var(--brand)]" checked={!!f.deals} onChange={(e) => update('deals', e.target.checked ? '1' : '')} />
            Discounted cars only
          </label>
          <button type="button" onClick={() => setShowFilters(false)} className="mt-2 h-11 rounded-lg bg-brand text-[14px] font-semibold text-white lg:hidden">
            Show {results.length} cars
          </button>
        </div>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[14px] font-medium lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters {activeChips.length > 0 && `(${activeChips.length})`}
            </button>
            <p className="text-[14px] text-muted-foreground">
              <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? 'car' : 'cars'} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="f-sort" className="hidden text-[13px] text-muted-foreground sm:block">
              Sort by
            </label>
            <select id="f-sort" className="rd-select w-52 bg-white" value={sort} onChange={(e) => update('sort', e.target.value === 'featured' ? '' : e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => update(k, '')}
                className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[13px] font-medium text-brand hover:border-brand"
              >
                {chipLabel(k)}
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        )}

        {results.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<SearchX className="size-10" />}
            title="No cars match these filters"
            text="Try widening your budget or removing a filter. New cars arrive at the yard every week — tell us what you want and we’ll call you."
            action={
              <button type="button" onClick={reset} className="mt-2 h-10 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-dark">
                Clear filters
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
