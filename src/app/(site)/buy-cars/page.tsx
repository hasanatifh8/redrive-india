import { Suspense } from 'react';
import type { Metadata } from 'next';
import ContactCTA from '@/components/ContactCTA';
import { PageHero } from '@/components/ui';
import { getPublicCars } from '@/lib/data';
import Inventory from './Inventory';

export const metadata: Metadata = {
  title: 'Buy Pre-Owned Cars',
  description: 'Browse verified pre-owned cars at REDRIVE INDIA, Prayagraj. Filter by brand, budget, fuel and body type.',
};

export default async function BuyCarsPage() {
  const cars = await getPublicCars();
  return (
    <>
      <PageHero
        eyebrow="Buy cars"
        title="Pre-owned cars at our Kalindipuram yard"
        description="Filter by brand, budget and body type. Save cars with the heart, tick Compare on up to three, then book a test drive."
      />
      <Suspense fallback={<div className="rd-container py-16 text-muted-foreground">Loading cars…</div>}>
        <Inventory cars={cars} />
      </Suspense>
      <ContactCTA />
    </>
  );
}
