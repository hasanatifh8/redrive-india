'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Search } from 'lucide-react';
import { BUDGET_OPTIONS, FUELS } from '@/lib/constants';
import { searchCars, type SearchItem } from '@/lib/search';
import CarSearchBox from './CarSearchBox';

const QUICK: { label: string; params: Record<string, string> }[] = [
  { label: 'Under ₹5 Lakh', params: { max: '500000' } },
  { label: 'Under ₹10 Lakh', params: { max: '1000000' } },
  { label: 'SUV', params: { body: 'SUV' } },
  { label: 'Hatchback', params: { body: 'Hatchback' } },
  { label: 'Sedan', params: { body: 'Sedan' } },
  { label: 'Automatic', params: { transmission: 'Automatic' } },
  { label: 'Diesel', params: { fuel: 'Diesel' } },
  { label: 'CNG', params: { fuel: 'CNG' } },
  { label: 'Price drops', params: { deals: '1', sort: 'discount' } },
];

type Filters = { brand: string; model: string; min: string; max: string; fuel: string };
const EMPTY: Filters = { brand: '', model: '', min: '', max: '', fuel: '' };

export default function VehicleSearch({ cars }: { cars: SearchItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>(EMPTY);

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setF((cur) => ({ ...cur, [k]: e.target.value, ...(k === 'brand' ? { model: '' } : {}) }));

  // Only offer brands/models that are actually in stock, with counts.
  const brands = useMemo(() => {
    const m = new Map<string, number>();
    cars.forEach((c) => m.set(c.brand, (m.get(c.brand) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cars]);
  const models = useMemo(() => {
    const m = new Map<string, number>();
    cars.filter((c) => !f.brand || c.brand === f.brand).forEach((c) => m.set(c.model, (m.get(c.model) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [cars, f.brand]);

  // Live count for the button.
  const count = useMemo(() => {
    const base = q.trim() ? searchCars(cars, q) : cars;
    return base.filter(
      (c) =>
        (!f.brand || c.brand === f.brand) &&
        (!f.model || c.model === f.model) &&
        (!f.min || c.final >= Number(f.min)) &&
        (!f.max || c.final <= Number(f.max)) &&
        (!f.fuel || c.fuel === f.fuel),
    ).length;
  }, [cars, q, f]);

  const go = (extra: Record<string, string> = {}, query = q) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    Object.entries({ ...f, ...extra }).forEach(([k, v]) => v && params.set(k, v));
    router.push(`/buy-cars${params.size ? `?${params}` : ''}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go();
  };

  const dirty = q || Object.values(f).some(Boolean);
  const label = 'text-[12px] font-medium text-muted-foreground';

  return (
    <form
      id="vehicle-search"
      onSubmit={submit}
      role="search"
      aria-label="Search cars"
      className="rd-card relative scroll-mt-28 p-4 shadow-[0_24px_48px_-24px_rgba(16,18,24,0.35)] md:p-5"
    >
      <CarSearchBox items={cars} value={q} onChange={setQ} onSubmit={(query) => go({}, query)} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr_0.85fr_auto]">
        <div className="flex flex-col gap-1">
          <label htmlFor="vs-brand" className={label}>Brand</label>
          <select id="vs-brand" className="rd-select h-11 bg-page/60" value={f.brand} onChange={set('brand')}>
            <option value="">All brands</option>
            {brands.map(([b, n]) => (
              <option key={b} value={b}>
                {b} ({n})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="vs-model" className={label}>Model</label>
          <select id="vs-model" className="rd-select h-11 bg-page/60" value={f.model} onChange={set('model')}>
            <option value="">{f.brand ? `All ${f.brand} models` : 'All models'}</option>
            {models.map(([m, n]) => (
              <option key={m} value={m}>
                {m} ({n})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="vs-min" className={label}>Min budget</label>
          <select id="vs-min" className="rd-select h-11 bg-page/60" value={f.min} onChange={set('min')}>
            <option value="">No minimum</option>
            {BUDGET_OPTIONS.filter((o) => !f.max || o.value < Number(f.max)).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="vs-max" className={label}>Max budget</label>
          <select id="vs-max" className="rd-select h-11 bg-page/60" value={f.max} onChange={set('max')}>
            <option value="">No maximum</option>
            {BUDGET_OPTIONS.filter((o) => !f.min || o.value > Number(f.min)).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="vs-fuel" className={label}>Fuel type</label>
          <select id="vs-fuel" className="rd-select h-11 bg-page/60" value={f.fuel} onChange={set('fuel')}>
            <option value="">Any fuel</option>
            {FUELS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="flex h-11 min-w-[150px] items-center justify-center gap-2 self-end rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98] sm:col-span-2 lg:col-span-1"
        >
          <Search className="size-4" />
          {dirty ? (count ? `Show ${count} car${count === 1 ? '' : 's'}` : 'No matches') : `Show all ${cars.length}`}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-muted-foreground">Quick search:</span>
        {QUICK.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => router.push(`/buy-cars?${new URLSearchParams(c.params)}`)}
            className="h-8 rounded-full border border-border bg-white px-3 text-[13px] font-medium text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand"
          >
            {c.label}
          </button>
        ))}
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setF(EMPTY);
            }}
            className="ml-auto flex h-8 items-center gap-1 px-2 text-[13px] font-medium text-muted-foreground hover:text-brand"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        )}
      </div>
    </form>
  );
}
