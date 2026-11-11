// Export all cars in the bulk-import format — edit in Excel/Sheets and re-import to update in bulk.
import { asc } from 'drizzle-orm';
import { db, schema } from '@/db';
import { isAdmin } from '@/lib/admin-guard';
import { IMPORT_COLUMNS, toCsv, type ImportKey } from '@/lib/car-import';
import { MONTHS } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  const cars = await db.select().from(schema.cars).orderBy(asc(schema.cars.id));
  const rows = cars.map((c) => {
    const v: Record<ImportKey, unknown> = {
      id: c.id,
      photo_code: '',
      brand: c.brand,
      model: c.model,
      variant: c.variant,
      year: c.year,
      month: c.month ? MONTHS[c.month - 1] : '',
      km: c.km,
      fuel: c.fuel,
      transmission: c.transmission,
      body_type: c.bodyType,
      owner: c.owner.match(/\d/)?.[0] ?? '1',
      price: c.price,
      discount_type: c.discountType,
      discount_value: c.discountValue || '',
      discount_label: c.discountLabel,
      status: c.status,
      featured: c.featured ? 'yes' : 'no',
      new_arrival: c.newArrival ? 'yes' : 'no',
      color: c.color,
      seats: c.seats ?? '',
      registration: c.registration,
      insurance: c.insuranceValidity,
      engine_type: c.engineType,
      engine_cc: c.engineCc ?? '',
      power: c.power,
      torque: c.torque,
      mileage: c.mileage,
      drivetrain: c.drivetrain.split(' ')[0],
      features: c.features.join('; '),
      description: c.description,
    };
    return IMPORT_COLUMNS.map((col) => v[col.key]);
  });
  const csv = toCsv([IMPORT_COLUMNS.map((c) => c.key), ...rows]);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="redrive-cars-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
