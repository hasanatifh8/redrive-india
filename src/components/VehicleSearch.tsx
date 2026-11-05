'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { BUDGET_OPTIONS, FUELS } from '@/lib/constants';

export default function VehicleSearch({ brands, models }: { brands: string[]; models: { brand: string; model: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ brand: '', model: '', min: '', max: '', fuel: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value, ...(k === 'brand' ? { model: '' } : {}) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    router.push(`/buy-cars${params.size ? `?${params}` : ''}`);
  };

  const fields = [
    { id: 'brand', label: 'Brand', empty: 'Select Brand', options: brands.map((b) => ({ value: b, label: b })) },
    {
      id: 'model',
      label: 'Model',
      empty: 'Select Model',
      options: Array.from(new Set(models.filter((m) => !f.brand || m.brand === f.brand).map((m) => m.model)))
        .sort()
        .map((m) => ({ value: m, label: m })),
    },
    { id: 'min', label: 'Minimum budget', empty: 'No minimum', options: BUDGET_OPTIONS },
    { id: 'max', label: 'Maximum budget', empty: 'No maximum', options: BUDGET_OPTIONS },
    { id: 'fuel', label: 'Fuel type', empty: 'Any fuel', options: FUELS.map((x) => ({ value: x, label: x })) },
  ] as const;

  return (
    <form
      id="vehicle-search"
      onSubmit={submit}
      className="rd-card relative grid scroll-mt-28 gap-3 p-4 shadow-[0_24px_48px_-24px_rgba(16,18,24,0.35)] sm:grid-cols-2 md:p-5 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr_0.85fr_auto]"
    >
      {fields.map((fd) => (
        <div key={fd.id} className="flex flex-col gap-1">
          <label htmlFor={`vs-${fd.id}`} className="text-[12px] font-medium text-muted-foreground">
            {fd.label}
          </label>
          <select id={`vs-${fd.id}`} className="rd-select h-11 bg-page/60" value={f[fd.id]} onChange={set(fd.id)}>
            <option value="">{fd.empty}</option>
            {fd.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="submit"
        className="flex h-11 items-center justify-center gap-2 self-end rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98] sm:col-span-2 lg:col-span-1"
      >
        <Search className="size-4" />
        Search Cars
      </button>
    </form>
  );
}
