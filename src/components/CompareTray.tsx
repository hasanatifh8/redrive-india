'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CarView } from '@/lib/data';
import { formatKm, formatPrice } from '@/lib/pricing';
import { useShortlist } from './ShortlistProvider';
import { CarImage } from './CarCard';

const ROWS: [string, (c: CarView) => string | number][] = [
  ['Price', (c) => formatPrice(c.final)],
  ['Variant', (c) => c.variant],
  ['Year', (c) => c.year],
  ['Kilometres', (c) => formatKm(c.km)],
  ['Fuel', (c) => c.fuel],
  ['Transmission', (c) => c.transmission],
  ['Body type', (c) => c.bodyType],
  ['Ownership', (c) => c.owner],
  ['Seats', (c) => c.seats ?? '—'],
  ['Colour', (c) => c.color || '—'],
  ['Registration', (c) => c.registration],
  ['Features', (c) => (c.features.length ? c.features.join(', ') : '—')],
];

export default function CompareTray() {
  const { compare: cars, toggleCompare, clearCompare, maxCompare } = useShortlist();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (cars.length < 2) setOpen(false);
  }, [cars.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (cars.length === 0) return null;

  return (
    <>
      <div className="animate-rd-rise fixed inset-x-0 bottom-16 z-30 px-3 md:bottom-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-[0_24px_48px_-24px_rgba(16,18,24,0.45)]">
          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            {cars.map((c) => (
              <span key={c.id} className="flex shrink-0 items-center gap-1.5 rounded-full bg-page px-3 py-1 text-[13px] font-medium text-ink">
                {c.brand} {c.model}
                <button type="button" aria-label={`Remove ${c.model}`} onClick={() => toggleCompare(c)} className="text-muted-foreground hover:text-brand">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <span className="shrink-0 text-[12px] text-muted-foreground">
              {cars.length}/{maxCompare}
            </span>
          </div>
          <button type="button" onClick={clearCompare} className="text-[13px] font-medium text-muted-foreground hover:text-ink">
            Clear
          </button>
          <button
            type="button"
            disabled={cars.length < 2}
            onClick={() => setOpen(true)}
            title={cars.length < 2 ? 'Pick at least 2 cars' : undefined}
            className="h-10 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Compare
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-rd-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Compare cars"
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white p-4">
              <h2 className="text-[20px] font-semibold text-ink">Compare cars</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr>
                  <th className="w-36 p-4" />
                  {cars.map((c) => (
                    <th key={c.id} className="p-4 align-top">
                      <CarImage car={c} className="aspect-[4/3] w-full rounded-lg object-cover" />
                      <p className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{c.brand}</p>
                      <Link href={`/cars/${c.slug}`} onClick={() => setOpen(false)} className="font-heading text-[17px] font-semibold text-ink hover:text-brand">
                        {c.model}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, get]) => (
                  <tr key={label} className="border-t border-border">
                    <th className="p-4 align-top font-medium text-muted-foreground">{label}</th>
                    {cars.map((c) => (
                      <td key={c.id} className="p-4 align-top text-ink">
                        {get(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
