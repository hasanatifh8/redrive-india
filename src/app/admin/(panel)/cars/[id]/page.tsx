import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { db, schema } from '@/db';
import CarForm from '@/components/admin/CarForm';
import { PageHeader, btn } from '@/components/admin/ui';

export const metadata = { title: 'Edit car' };

export default async function EditCarPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [car] = await db.select().from(schema.cars).where(eq(schema.cars.id, id));
  if (!car) notFound();
  const images = await db.select().from(schema.carImages).where(eq(schema.carImages.carId, id)).orderBy(asc(schema.carImages.sortOrder));

  return (
    <>
      <Link href="/admin/cars" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-brand">
        <ChevronLeft className="size-4" /> Cars
      </Link>
      <PageHeader
        title={`${car.year} ${car.brand} ${car.model}`}
        description={`${car.views} views · last updated ${car.updatedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`}
        actions={
          car.status !== 'draft' && (
            <a href={`/cars/${car.slug}`} target="_blank" className={btn.outline}>
              <ExternalLink className="size-4" />
              View on website
            </a>
          )
        }
      />
      <CarForm car={car} images={images.map((i) => i.url)} />
    </>
  );
}
