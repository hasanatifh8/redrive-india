'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import { useShortlist } from './ShortlistProvider';
import { CarImage } from './CarCard';

export default function CompareTray() {
  const pathname = usePathname();
  const { compare: cars, toggleCompare, clearCompare, maxCompare } = useShortlist();

  // The compare page has its own full UI.
  if (cars.length === 0 || pathname.startsWith('/compare')) return null;

  const href = `/compare?ids=${cars.map((c) => c.id).join(',')}`;
  const ready = cars.length >= 2;

  return (
    <div className="animate-rd-rise fixed inset-x-0 bottom-16 z-30 px-3 md:bottom-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-border bg-white/95 p-2.5 shadow-[0_24px_48px_-20px_rgba(16,18,24,0.45)] backdrop-blur">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {cars.map((c) => (
            <span key={c.id} className="flex shrink-0 items-center gap-2 rounded-xl bg-page py-1 pr-2 pl-1 text-[13px] font-medium text-ink">
              <CarImage car={c} className="h-8 w-11 rounded-lg object-cover" />
              <span className="max-w-[110px] truncate">
                {c.brand} {c.model}
              </span>
              <button type="button" aria-label={`Remove ${c.model}`} onClick={() => toggleCompare(c)} className="text-muted-foreground hover:text-brand">
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {Array.from({ length: maxCompare - cars.length }).map((_, i) => (
            <span key={i} className="hidden h-10 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-input text-[12px] text-muted-foreground sm:flex">
              + Add car
            </span>
          ))}
        </div>
        <button type="button" onClick={clearCompare} className="hidden text-[13px] font-medium text-muted-foreground hover:text-ink sm:block">
          Clear
        </button>
        {ready ? (
          <Link href={href} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-[14px] font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
            Compare {cars.length}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span className="shrink-0 px-2 text-[12px] text-muted-foreground">Pick 1 more</span>
        )}
      </div>
    </div>
  );
}
