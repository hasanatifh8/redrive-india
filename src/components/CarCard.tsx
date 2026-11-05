'use client';

import Link from 'next/link';
import { CalendarDays, Camera, Check, Cog, Fuel, Gauge, Heart, Users } from 'lucide-react';
import type { CarView } from '@/lib/data';
import { formatKm, formatPrice } from '@/lib/pricing';
import { useShortlist } from './ShortlistProvider';

type ImgCar = Pick<CarView, 'images' | 'brand' | 'model' | 'year'>;

export function CarImage({ car, index = 0, className = '' }: { car: ImgCar; index?: number; className?: string }) {
  const src = car.images[index];
  if (src) return <img src={src} alt={`${car.year} ${car.brand} ${car.model}`} loading="lazy" className={className} />;
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-ink ${className}`}>
      <img src="/images/logo-light.png" alt="" className="h-12 opacity-70" />
      <span className="text-[11px] tracking-[0.16em] text-white/50 uppercase">Photos coming soon</span>
    </div>
  );
}

export default function CarCard({ car }: { car: CarView }) {
  const { wishlist, compare, toggleWishlist, toggleCompare, maxCompare } = useShortlist();
  const saved = wishlist.includes(car.id);
  const comparing = compare.some((c) => c.id === car.id);
  const compareFull = !comparing && compare.length >= maxCompare;
  const href = `/cars/${car.slug}`;

  const specs = [
    { label: 'Year', value: car.year, Icon: CalendarDays },
    { label: 'Kilometres', value: formatKm(car.km), Icon: Gauge },
    { label: 'Fuel', value: car.fuel, Icon: Fuel },
    { label: 'Transmission', value: car.transmission, Icon: Cog },
    { label: 'Ownership', value: car.owner, Icon: Users },
  ];

  return (
    <article className="group rd-card flex flex-col overflow-hidden transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_14px_30px_-12px_rgba(16,18,24,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={href} aria-label={`View ${car.brand} ${car.model}`}>
          <CarImage car={car} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          {car.images[1] && (
            <img
              src={car.images[1]}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          {car.status === 'reserved' && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-ink shadow">Reserved</span>}
          {car.status === 'sold' && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white shadow">Sold</span>}
          {car.newArrival && car.status === 'available' && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow">New Arrival</span>
          )}
          {car.saving > 0 && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">Save {formatPrice(car.saving)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleWishlist(car.id)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition-[transform,background-color,color] duration-150 hover:scale-105 active:scale-95 ${
            saved ? 'text-brand' : 'text-ink'
          }`}
        >
          <Heart className={`size-[18px] ${saved ? 'fill-current' : ''}`} />
        </button>
        <span className="pointer-events-none absolute bottom-2.5 left-3 text-[12px] font-medium text-white/90">{car.registration}</span>
        {car.images.length > 1 && (
          <span className="pointer-events-none absolute right-3 bottom-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white">
            <Camera className="size-3" />
            {car.images.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{car.brand}</p>
        <h3 className="mt-0.5 text-[18px] leading-snug font-semibold text-ink">
          <Link href={href} className="hover:text-brand">
            {car.model}
          </Link>
        </h3>
        <p className="truncate text-[13px] text-muted-foreground">{car.variant}</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] text-ink-2">
          {specs.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-1.5" title={label}>
              <span className="text-muted-foreground">
                <Icon className="size-3.5" />
              </span>
              <dt className="sr-only">{label}</dt>
              <dd className="truncate">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto">
          <div className="mt-4 flex items-end justify-between gap-2 border-t border-dashed border-border pt-3">
            <div>
              {car.saving > 0 ? (
                <p className="text-[12px] text-muted-foreground line-through">{formatPrice(car.price)}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Asking price</p>
              )}
              <p className="font-heading text-[20px] font-semibold text-ink">{formatPrice(car.final)}</p>
            </div>
            <label
              className={`flex items-center gap-2 text-[13px] font-medium text-ink select-none ${compareFull ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              title={compareFull ? `You can compare up to ${maxCompare} cars` : undefined}
            >
              <input type="checkbox" className="peer sr-only" checked={comparing} disabled={compareFull} onChange={() => toggleCompare(car)} />
              <span
                className={`flex size-4 items-center justify-center rounded-[4px] border transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 ${
                  comparing ? 'border-brand bg-brand text-white' : 'border-input'
                }`}
              >
                {comparing && <Check className="size-3" strokeWidth={3} />}
              </span>
              Compare
            </label>
          </div>
          <Link
            href={href}
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-ink text-sm font-medium text-white transition-colors hover:bg-brand"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
