'use client';

import { useEffect, useState } from 'react';
import { Check, Heart, Share2 } from 'lucide-react';
import type { CarView } from '@/lib/data';
import { recordView } from '@/app/(site)/actions';
import { useShortlist } from './ShortlistProvider';

/** Counts one view per car per browser session. */
export function ViewTracker({ carId }: { carId: number }) {
  useEffect(() => {
    const key = `rd-viewed-${carId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    recordView(carId).catch(() => {});
  }, [carId]);
  return null;
}

export function CarActions({ car }: { car: CarView }) {
  const { wishlist, toggleWishlist, compare, toggleCompare } = useShortlist();
  const saved = wishlist.includes(car.id);
  const comparing = compare.some((c) => c.id === car.id);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    const title = `${car.year} ${car.brand} ${car.model}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const btn = 'flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition';
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => toggleWishlist(car.id)} className={`${btn} ${saved ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink hover:border-brand'}`}>
        <Heart className={`size-4 ${saved ? 'fill-current' : ''}`} />
        {saved ? 'Saved' : 'Save'}
      </button>
      <button type="button" onClick={() => toggleCompare(car)} className={`${btn} ${comparing ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink hover:border-brand'}`}>
        {comparing && <Check className="size-4" />}
        Compare
      </button>
      <button type="button" onClick={share} className={`${btn} border-border text-ink hover:border-brand`}>
        <Share2 className="size-4" />
        {copied ? 'Link copied' : 'Share'}
      </button>
    </div>
  );
}
