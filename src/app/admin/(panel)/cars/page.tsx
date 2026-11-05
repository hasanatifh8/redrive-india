import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { db, schema } from '@/db';
import { finalPrice } from '@/lib/pricing';
import { PageHeader, btn } from '@/components/admin/ui';
import { SavedToast } from '@/components/admin/client';
import CarsTable, { type AdminCarRow } from './CarsTable';

export const metadata = { title: 'Cars' };

export default async function AdminCarsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const [cars, images, leads] = await Promise.all([
    db.select().from(schema.cars).orderBy(desc(schema.cars.updatedAt)),
    db.select().from(schema.carImages).orderBy(asc(schema.carImages.sortOrder)),
    db.select({ carId: schema.leads.carId }).from(schema.leads),
  ]);

  const rows: AdminCarRow[] = cars.map((c) => {
    const imgs = images.filter((i) => i.carId === c.id);
    return {
      id: c.id,
      slug: c.slug,
      title: `${c.brand} ${c.model}`,
      variant: c.variant,
      year: c.year,
      km: c.km,
      fuel: c.fuel,
      transmission: c.transmission,
      price: c.price,
      final: finalPrice(c),
      status: c.status,
      featured: c.featured,
      newArrival: c.newArrival,
      views: c.views,
      leads: leads.filter((l) => l.carId === c.id).length,
      cover: imgs[0]?.url ?? null,
      photoCount: imgs.length,
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  return (
    <>
      <SavedToast />
      <PageHeader
        title="Cars"
        description="Add, edit, price and publish your stock. Changes go live on the website instantly."
        actions={
          <Link href="/admin/cars/new" className={btn.primary}>
            <Plus className="size-4" />
            Add car
          </Link>
        }
      />
      <CarsTable rows={rows} initialStatus={searchParams.status ?? 'all'} initialQuery={searchParams.q ?? ''} />
    </>
  );
}
