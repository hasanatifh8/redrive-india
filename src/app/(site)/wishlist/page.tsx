'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import type { CarView } from '@/lib/data';
import CarCard from '@/components/CarCard';
import { useShortlist } from '@/components/ShortlistProvider';
import { EmptyState, PageHero } from '@/components/ui';
import { fetchCarsByIds } from '../actions';

export default function WishlistPage() {
  const { wishlist } = useShortlist();
  const [cars, setCars] = useState<CarView[] | null>(null);
  const key = wishlist.join(',');

  useEffect(() => {
    let live = true;
    fetchCarsByIds(wishlist).then((r) => live && setCars(r));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const shown = cars?.filter((c) => wishlist.includes(c.id)) ?? null;

  return (
    <>
      <PageHero eyebrow="Wishlist" title="Your shortlisted cars" description="Cars you’ve saved with the heart icon. They stay saved on this device." />
      <div className="rd-container py-12">
        {shown === null ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : shown.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="size-10" />}
            title="No saved cars yet"
            text="Tap the heart on any car to save it here."
            action={
              <Link href="/buy-cars" className="mt-2 flex h-10 items-center rounded-lg bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-dark">
                Browse cars
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
