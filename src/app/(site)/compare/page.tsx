import type { Metadata } from 'next';
import { getPublicCars } from '@/lib/data';
import CompareView from '@/components/compare/CompareView';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Compare Cars',
  description: 'Compare pre-owned cars side by side at REDRIVE INDIA — price, condition, engine and features.',
};

export default async function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const all = await getPublicCars();
  const ids = (searchParams.ids ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  // Keep the order from the link; ignore ids that aren't public any more.
  const initial = ids
    .map((id) => all.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="Compare cars side by side"
        description="Price, condition, engine and features in one view — the best value in every row is marked with a blue tick."
      />
      <CompareView initialCars={initial} allCars={all} />
    </>
  );
}
