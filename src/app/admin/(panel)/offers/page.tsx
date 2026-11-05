import { asc, desc, ne } from 'drizzle-orm';
import { db, schema } from '@/db';
import { PageHeader } from '@/components/admin/ui';
import OfferManager, { type OfferRow } from './OfferManager';

export const metadata = { title: 'Offers' };

export default async function OffersAdminPage() {
  const [offers, cars] = await Promise.all([
    db.select().from(schema.offers).orderBy(asc(schema.offers.sortOrder), desc(schema.offers.createdAt)),
    db
      .select({ id: schema.cars.id, year: schema.cars.year, brand: schema.cars.brand, model: schema.cars.model, variant: schema.cars.variant })
      .from(schema.cars)
      .where(ne(schema.cars.status, 'draft')),
  ]);
  const rows: OfferRow[] = offers.map((o) => ({
    ...o,
    validUntil: o.validUntil ? o.validUntil.toISOString().slice(0, 10) : '',
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));
  return (
    <>
      <PageHeader title="Offers" description="Promotions shown on the homepage and the Offers page. Link an offer to a car to show its live price." />
      <OfferManager rows={rows} cars={cars.map((c) => ({ id: c.id, label: `${c.year} ${c.brand} ${c.model} ${c.variant}` }))} />
    </>
  );
}
