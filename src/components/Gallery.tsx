'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { GALLERY } from '@/lib/constants';

export default function Gallery() {
  const [index, setIndex] = useState<number | null>(null);
  const n = GALLERY.length;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % n));
      if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + n) % n));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, n]);

  return (
    <>
      <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
        {GALLERY.map((g, i) => (
          <button
            key={g.src}
            type="button"
            onClick={() => setIndex(i)}
            className={`group relative overflow-hidden rounded-xl bg-muted ${g.className}`}
          >
            <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-left text-[12px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {g.alt}
              <Expand className="size-4" />
            </span>
          </button>
        ))}
      </div>

      {index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={GALLERY[index].alt}
          className="animate-rd-fade fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIndex(null)}
        >
          <button type="button" aria-label="Close" className="absolute top-4 right-4 rounded-full p-2 text-white hover:bg-white/10">
            <X className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-3 rounded-full p-2 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index - 1 + n) % n);
            }}
          >
            <ChevronLeft className="size-8" />
          </button>
          <figure className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={GALLERY[index].src} alt={GALLERY[index].alt} className="max-h-[80vh] w-auto rounded-lg" />
            <figcaption className="mt-3 text-center text-[14px] text-white/80">{GALLERY[index].alt}</figcaption>
          </figure>
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-3 rounded-full p-2 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index + 1) % n);
            }}
          >
            <ChevronRight className="size-8" />
          </button>
        </div>
      )}
    </>
  );
}
