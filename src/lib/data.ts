// Server-only data access for the public site.
import { cache } from 'react';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { Car } from '@/db/schema';
import { finalPrice, savings } from './pricing';
import { SETTING_DEFAULTS, type SiteSettings } from './settings-defaults';

const { cars, carImages, offers, settings } = schema;

export type CarView = Car & { images: string[]; final: number; saving: number };

async function attachImages(rows: Car[]): Promise<CarView[]> {
  if (!rows.length) return [];
  const imgs = await db
    .select()
    .from(carImages)
    .where(inArray(carImages.carId, rows.map((r) => r.id)))
    .orderBy(asc(carImages.sortOrder), asc(carImages.id));
  return rows.map((r) => ({
    ...r,
    images: imgs.filter((i) => i.carId === r.id).map((i) => i.url),
    final: finalPrice(r),
    saving: savings(r),
  }));
}

/** Cars visible on the public site (available + reserved; optionally sold). */
export const getPublicCars = cache(async (opts: { includeSold?: boolean } = {}) => {
  const rows = await db
    .select()
    .from(cars)
    .where(opts.includeSold ? ne(cars.status, 'draft') : inArray(cars.status, ['available', 'reserved']))
    .orderBy(desc(cars.featured), desc(cars.createdAt));
  return attachImages(rows);
});

export const getCarBySlug = cache(async (slug: string) => {
  const [row] = await db.select().from(cars).where(and(eq(cars.slug, slug), ne(cars.status, 'draft')));
  if (!row) return null;
  return (await attachImages([row]))[0];
});

export async function getCarsByIds(ids: number[]) {
  if (!ids.length) return [];
  const rows = await db.select().from(cars).where(and(inArray(cars.id, ids), ne(cars.status, 'draft')));
  return attachImages(rows);
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.select().from(settings);
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  return out;
});

export const getActiveOffers = cache(async (homeOnly = false) => {
  const rows = await db
    .select()
    .from(offers)
    .where(homeOnly ? and(eq(offers.active, true), eq(offers.showOnHome, true)) : eq(offers.active, true))
    .orderBy(asc(offers.sortOrder), desc(offers.createdAt));
  const now = Date.now();
  const live = rows.filter((o) => !o.validUntil || o.validUntil.getTime() >= now);
  const carIds = live.map((o) => o.carId).filter((x): x is number => !!x);
  const linked = await getCarsByIds(carIds);
  return live.map((o) => ({ ...o, car: linked.find((c) => c.id === o.carId) ?? null }));
});
