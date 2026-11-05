'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { CarImage } from './CarCard';

type Props = { images: string[]; brand: string; model: string; year: number; badges?: React.ReactNode };

export default function CarGallery({ images, brand, model, year, badges }: Props) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => n && setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [full]);

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  const alt = `${year} ${brand} ${model}`;
  const arrow = 'absolute top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white';

  if (!n) return <CarImage car={{ images, brand, model, year }} className="aspect-[4/3] w-full rounded-2xl object-cover" />;

  return (
    <div>
      <div className="group relative overflow-hidden rounded-2xl bg-muted" {...swipe}>
        <button type="button" className="block w-full" onClick={() => setFull(true)} aria-label="View full screen">
          <img src={images[i]} alt={`${alt} — photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
        </button>
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">{badges}</div>
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3 opacity-0 group-hover:opacity-100 max-md:opacity-100`}>
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3 opacity-0 group-hover:opacity-100 max-md:opacity-100`}>
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white">
          <Expand className="size-3.5" />
          {i + 1} / {n}
        </span>
      </div>

      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show photo ${idx + 1}`}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${idx === i ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {full && (
        <div role="dialog" aria-modal="true" aria-label={alt} className="animate-rd-fade fixed inset-0 z-[60] flex flex-col bg-black/95" {...swipe}>
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-[14px]">
              {alt} · {i + 1} / {n}
            </span>
            <button type="button" aria-label="Close" onClick={() => setFull(false)} className="rounded-full p-2 hover:bg-white/10">
              <X className="size-6" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4">
            <img src={images[i]} alt={alt} className="max-h-[78vh] max-w-full rounded-lg object-contain" />
            {n > 1 && (
              <>
                <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-4`}>
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-4`}>
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto p-4">
            {images.map((src, idx) => (
              <button
                key={src}
                type="button"
                onClick={() => setI(idx)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${idx === i ? 'border-white' : 'border-transparent opacity-50'}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
