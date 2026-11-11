'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db, libsql, schema } from '@/db';
import { requireAdmin } from '@/lib/admin-guard';
import { SESSION_COOKIE, adminPassword, createSession, safeEqual, sessionMaxAge } from '@/lib/auth';
import { backupStamp, deleteBackup as removeBackupFile, deleteImages, listStoredImages, readBackup, saveBackup } from '@/lib/storage';
import { exportData, parseBackup, restoreData } from '@/lib/backup';
import { normalizeRecord, type ImportKey } from '@/lib/car-import';
import { slugify } from '@/lib/constants';
import { SETTING_DEFAULTS, type SettingKey } from '@/lib/settings-defaults';
import type { CustomSpec, InspectionItem } from '@/db/schema';

const { cars, carImages, leads, referralCodes, offers, settings } = schema;

export type ActionResult = { ok: boolean; message: string } | null;

const refreshSite = () => {
  revalidatePath('/', 'layout');
};

/* ------------------------------------------------------------------ auth */

export async function login(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const pw = String(form.get('password') ?? '');
  // Small fixed delay slows down password guessing.
  await new Promise((r) => setTimeout(r, 400));
  if (!safeEqual(pw, adminPassword())) return { ok: false, message: 'Incorrect password' };
  cookies().set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionMaxAge,
  });
  const next = String(form.get('next') || '/admin');
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/admin/login');
}

/* ------------------------------------------------------------------ cars */

const intOrNull = z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable());
const bool = z.preprocess((v) => v === 'on' || v === 'true' || v === '1', z.boolean());

const CarSchema = z.object({
  brand: z.string().trim().min(1, 'Brand is required'),
  model: z.string().trim().min(1, 'Model is required'),
  variant: z.string().trim().default(''),
  year: z.coerce.number().int().min(1990, 'Year looks wrong').max(new Date().getFullYear() + 1, 'Year looks wrong'),
  month: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(1).max(12).nullable()),
  km: z.coerce.number().int().min(0),
  fuel: z.string().min(1),
  transmission: z.string().min(1),
  bodyType: z.string().min(1),
  engineType: z.string().trim().max(60).default(''),
  engineCc: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(50, 'Engine capacity looks wrong').max(10000, 'Engine capacity looks wrong').nullable()),
  power: z.string().trim().max(60).default(''),
  torque: z.string().trim().max(60).default(''),
  mileage: z.string().trim().max(60).default(''),
  drivetrain: z.string().trim().max(40).default(''),
  owner: z.string().min(1),
  color: z.string().trim().default(''),
  seats: intOrNull,
  registration: z.string().trim().default(''),
  insuranceValidity: z.string().trim().default(''),
  price: z.coerce.number().int().positive('Price must be more than 0'),
  discountType: z.enum(['none', 'flat', 'percent']),
  discountValue: z.coerce.number().int().min(0).default(0),
  discountLabel: z.string().trim().default(''),
  status: z.enum(['draft', 'available', 'reserved', 'sold']),
  featured: bool,
  newArrival: bool,
  description: z.string().trim().default(''),
});

function parseJson<T>(v: FormDataEntryValue | null, fallback: T): T {
  try {
    return v ? (JSON.parse(String(v)) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function uniqueSlug(base: string, exceptId?: number) {
  let slug = base || 'car';
  for (let i = 2; ; i++) {
    const [hit] = await db
      .select({ id: cars.id })
      .from(cars)
      .where(exceptId ? and(eq(cars.slug, slug), ne(cars.id, exceptId)) : eq(cars.slug, slug));
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
}

export async function saveCar(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(form.get('id')) || undefined;
  const parsed = CarSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.discountType === 'percent' && data.discountValue > 90) return { ok: false, message: 'Percentage discount cannot exceed 90%' };
  if (data.discountType === 'flat' && data.discountValue >= data.price) return { ok: false, message: 'Discount must be less than the price' };
  if (data.discountType === 'none') data.discountValue = 0;

  const images = parseJson<string[]>(form.get('images'), []).filter((u) => typeof u === 'string' && u).slice(0, 20);
  const features = parseJson<string[]>(form.get('features'), [])
    .map((f) => String(f).trim())
    .filter(Boolean)
    .slice(0, 60);
  const inspection = parseJson<InspectionItem[]>(form.get('inspection'), [])
    .filter((i) => i && i.area && i.score > 0)
    .map((i) => ({ area: String(i.area).slice(0, 60), score: Math.min(5, Math.max(1, Math.round(Number(i.score)))), note: i.note ? String(i.note).slice(0, 200) : undefined }));

  // Admin-defined extra fields: drop empty rows and duplicate labels, keep order.
  const seen = new Set<string>();
  const specs = parseJson<CustomSpec[]>(form.get('specs'), [])
    .map((x) => ({ label: String(x?.label ?? '').trim().slice(0, 60), value: String(x?.value ?? '').trim().slice(0, 200) }))
    .filter((x) => x.label && x.value && !seen.has(x.label.toLowerCase()) && seen.add(x.label.toLowerCase()))
    .slice(0, 40);

  const slug = await uniqueSlug(slugify(`${data.year} ${data.brand} ${data.model} ${data.variant}`), id);
  const values = { ...data, slug, features, inspection, specs, updatedAt: new Date() };

  let carId = id;
  if (id) {
    const [existing] = await db.select().from(cars).where(eq(cars.id, id));
    if (!existing) return { ok: false, message: 'Car not found' };
    await db
      .update(cars)
      .set({ ...values, soldAt: data.status === 'sold' ? (existing.soldAt ?? new Date()) : null })
      .where(eq(cars.id, id));
    // Photos removed here are NOT deleted from storage — they stay in Admin → Recover photos,
    // so a backup restore (or a change of mind) can always bring them back.
    await db.delete(carImages).where(eq(carImages.carId, id));
  } else {
    const [row] = await db
      .insert(cars)
      .values({ ...values, soldAt: data.status === 'sold' ? new Date() : null })
      .returning({ id: cars.id });
    carId = row.id;
  }
  if (images.length) await db.insert(carImages).values(images.map((url, i) => ({ carId: carId!, url, sortOrder: i })));

  refreshSite();
  redirect(`/admin/cars?saved=${encodeURIComponent(`${data.brand} ${data.model}`)}`);
}

export async function deleteCar(id: number) {
  await requireAdmin();
  await db.delete(carImages).where(eq(carImages.carId, id));
  await db.update(offers).set({ carId: null }).where(eq(offers.carId, id));
  await db.update(leads).set({ carId: null }).where(eq(leads.carId, id));
  await db.delete(cars).where(eq(cars.id, id));
  // Photos are kept in storage on purpose (see Admin → Recover photos) so a restore can bring them back.
  refreshSite();
}

export async function duplicateCar(id: number) {
  await requireAdmin();
  const [c] = await db.select().from(cars).where(eq(cars.id, id));
  if (!c) return;
  const { id: _id, createdAt: _c, updatedAt: _u, views: _v, soldAt: _s, ...rest } = c;
  const [row] = await db
    .insert(cars)
    .values({ ...rest, status: 'draft', slug: await uniqueSlug(`${c.slug}-copy`) })
    .returning({ id: cars.id });
  refreshSite();
  redirect(`/admin/cars/${row.id}`);
}

export async function bulkCarAction(ids: number[], action: string, value?: number) {
  await requireAdmin();
  if (!ids.length) return { ok: false, message: 'No cars selected' };
  const where = inArray(cars.id, ids);
  const now = new Date();
  switch (action) {
    case 'available':
    case 'reserved':
    case 'draft':
      await db.update(cars).set({ status: action, soldAt: null, updatedAt: now }).where(where);
      break;
    case 'sold':
      await db.update(cars).set({ status: 'sold', soldAt: now, updatedAt: now }).where(where);
      break;
    case 'feature':
    case 'unfeature':
      await db.update(cars).set({ featured: action === 'feature', updatedAt: now }).where(where);
      break;
    case 'new':
    case 'unnew':
      await db.update(cars).set({ newArrival: action === 'new', updatedAt: now }).where(where);
      break;
    case 'discount-percent':
      if (!value || value < 0 || value > 90) return { ok: false, message: 'Enter a discount between 1 and 90%' };
      await db.update(cars).set({ discountType: 'percent', discountValue: Math.round(value), updatedAt: now }).where(where);
      break;
    case 'discount-flat':
      if (!value || value < 0) return { ok: false, message: 'Enter a discount amount' };
      await db.update(cars).set({ discountType: 'flat', discountValue: Math.round(value), updatedAt: now }).where(where);
      break;
    case 'clear-discount':
      await db.update(cars).set({ discountType: 'none', discountValue: 0, discountLabel: '', updatedAt: now }).where(where);
      break;
    case 'delete':
      for (const id of ids) await deleteCar(id);
      break;
    default:
      return { ok: false, message: 'Unknown action' };
  }
  refreshSite();
  return { ok: true, message: `Updated ${ids.length} car${ids.length > 1 ? 's' : ''}` };
}

/* ------------------------------------------------------------------ leads */

export async function updateLead(id: number, patch: { status?: string; notes?: string; rewardPaid?: boolean }) {
  await requireAdmin();
  const allowed = ['new', 'contacted', 'negotiating', 'won', 'lost'];
  const set: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
  if (patch.status && allowed.includes(patch.status)) set.status = patch.status;
  if (typeof patch.notes === 'string') set.notes = patch.notes.slice(0, 4000);
  if (typeof patch.rewardPaid === 'boolean') set.rewardPaid = patch.rewardPaid;
  await db.update(leads).set(set).where(eq(leads.id, id));
  revalidatePath('/admin', 'layout');
}

export async function deleteLead(id: number) {
  await requireAdmin();
  const [lead] = await db.select({ images: leads.images }).from(leads).where(eq(leads.id, id));
  await db.delete(leads).where(eq(leads.id, id));
  if (lead?.images.length) await deleteImages(lead.images);
  revalidatePath('/admin', 'layout');
}

/* ------------------------------------------------------------------ referral codes */

const ReferralSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,32}$/, 'Code must be 3–32 letters/numbers (no spaces)'),
  description: z.string().trim().default(''),
  discountType: z.enum(['flat', 'percent']),
  discountValue: z.coerce.number().int().min(0),
  maxDiscount: intOrNull,
  referrerName: z.string().trim().default(''),
  referrerPhone: z.string().trim().default(''),
  rewardAmount: z.coerce.number().int().min(0).default(0),
  maxUses: intOrNull,
  expiresAt: z.preprocess((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null), z.date().nullable()),
  active: bool,
});

export async function saveReferral(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(form.get('id')) || undefined;
  const parsed = ReferralSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;
  if (data.discountType === 'percent' && data.discountValue > 50) return { ok: false, message: 'Percentage discount cannot exceed 50%' };

  const [clash] = await db
    .select({ id: referralCodes.id })
    .from(referralCodes)
    .where(id ? and(eq(referralCodes.code, data.code), ne(referralCodes.id, id)) : eq(referralCodes.code, data.code));
  if (clash) return { ok: false, message: `Code ${data.code} already exists` };

  if (id) await db.update(referralCodes).set({ ...data, updatedAt: new Date() }).where(eq(referralCodes.id, id));
  else await db.insert(referralCodes).values(data);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: id ? `Saved ${data.code}` : `Created ${data.code}` };
}

export async function toggleReferral(id: number, active: boolean) {
  await requireAdmin();
  await db.update(referralCodes).set({ active, updatedAt: new Date() }).where(eq(referralCodes.id, id));
  revalidatePath('/admin', 'layout');
}

export async function deleteReferral(id: number) {
  await requireAdmin();
  await db.delete(referralCodes).where(eq(referralCodes.id, id));
  revalidatePath('/admin', 'layout');
}

/* ------------------------------------------------------------------ offers */

const OfferSchema = z.object({
  category: z.enum(['car', 'showroom']).default('car'),
  title: z.string().trim().min(2, 'Title is required'),
  description: z.string().trim().default(''),
  icon: z.string().trim().max(30).default('gift'),
  highlight: z.string().trim().max(24, 'Highlight must be short, e.g. "FREE"').default(''),
  terms: z.string().trim().max(2000).default(''),
  claimable: bool,
  image: z.string().trim().nullable().default(null).transform((v) => v || null),
  carId: intOrNull,
  ctaLabel: z.string().trim().default(''),
  ctaHref: z.string().trim().default(''),
  validUntil: z.preprocess((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null), z.date().nullable()),
  active: bool,
  showOnHome: bool,
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveOffer(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(form.get('id')) || undefined;
  const parsed = OfferSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  // Showroom offers aren't tied to a car.
  const data = { ...parsed.data, carId: parsed.data.category === 'showroom' ? null : parsed.data.carId };
  if (id) {
    const [old] = await db.select().from(offers).where(eq(offers.id, id));
    if (old?.image && old.image !== data.image) await deleteImages([old.image]);
    await db.update(offers).set({ ...data, updatedAt: new Date() }).where(eq(offers.id, id));
  } else await db.insert(offers).values(data);
  refreshSite();
  return { ok: true, message: 'Offer saved' };
}

export async function toggleOffer(id: number, active: boolean) {
  await requireAdmin();
  await db.update(offers).set({ active, updatedAt: new Date() }).where(eq(offers.id, id));
  refreshSite();
}

export async function deleteOffer(id: number) {
  await requireAdmin();
  const [o] = await db.select().from(offers).where(eq(offers.id, id));
  await db.delete(offers).where(eq(offers.id, id));
  if (o?.image) await deleteImages([o.image]);
  refreshSite();
}

/* ------------------------------------------------------------------ settings */

export async function saveSettings(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const keys = Object.keys(SETTING_DEFAULTS) as SettingKey[];
  for (const key of keys) {
    if (!form.has(key) && key !== 'showDemoNotice') continue;
    let value = String(form.get(key) ?? '').trim();
    if (key === 'showDemoNotice') value = form.get(key) === 'on' ? 'true' : 'false';
    if (key === 'whatsappNumber') value = value.replace(/\D/g, '');
    if (key === 'whatsappNumber' && value.length === 10) value = `91${value}`;
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  refreshSite();
  return { ok: true, message: 'Settings saved' };
}

/* ------------------------------------------------------------------ backups */

export async function backupNow(): Promise<ActionResult> {
  await requireAdmin();
  const data = await exportData(libsql);
  await saveBackup(`manual-${backupStamp()}.json`, JSON.stringify(data));
  revalidatePath('/admin/backups');
  return { ok: true, message: `Backup saved (${data.counts.cars ?? 0} cars, ${data.counts.leads ?? 0} leads)` };
}

async function restoreFromText(text: string): Promise<ActionResult> {
  const data = parseBackup(text);
  // Always keep a copy of what's there right now, so a restore can itself be undone.
  await saveBackup(`before-restore-${backupStamp()}.json`, JSON.stringify(await exportData(libsql)));
  const counts = await restoreData(libsql, data);
  refreshSite();
  return { ok: true, message: `Restored: ${counts.cars ?? 0} cars, ${counts.leads ?? 0} leads, ${counts.offers ?? 0} offers` };
}

export async function restoreBackup(name: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    return await restoreFromText(await readBackup(name));
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Restore failed' };
  }
}

export async function restoreUploadedBackup(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return { ok: false, message: 'Choose a backup file first' };
  try {
    return await restoreFromText(await file.text());
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Restore failed' };
  }
}

export async function deleteBackup(name: string) {
  await requireAdmin();
  await removeBackupFile(name);
  revalidatePath('/admin/backups');
}

/* ------------------------------------------------------------------ recover from photos */

/** Car photos in storage that no car uses any more, oldest first. */
export async function getOrphanPhotos() {
  await requireAdmin();
  const [stored, used] = await Promise.all([listStoredImages('cars'), db.select({ url: carImages.url }).from(carImages)]);
  const usedSet = new Set(used.map((u) => u.url));
  return stored.filter((p) => !usedSet.has(p.url)).sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());
}

export async function recoverCar(urls: string[]): Promise<ActionResult> {
  await requireAdmin();
  // Only accept photos that really exist in storage and are unused.
  const orphans = await getOrphanPhotos();
  const valid = orphans.map((o) => o.url).filter((u) => urls.includes(u));
  if (!valid.length) return { ok: false, message: 'Select at least one photo' };
  const when = orphans.find((o) => o.url === valid[0])!.uploadedAt;
  const label = when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const [row] = await db
    .insert(cars)
    .values({
      slug: await uniqueSlug(slugify(`recovered ${backupStamp(when)}`)),
      brand: 'Recovered',
      model: `Car (photos from ${label})`,
      year: new Date().getFullYear(),
      km: 0,
      fuel: 'Petrol',
      transmission: 'Manual',
      bodyType: 'SUV',
      owner: '1st Owner',
      price: 1,
      status: 'draft',
      description: '',
    })
    .returning({ id: cars.id });
  await db.insert(carImages).values(valid.map((url, i) => ({ carId: row.id, url, sortOrder: i })));
  revalidatePath('/admin', 'layout');
  redirect(`/admin/cars/${row.id}?recovered=1`);
}

export async function deleteOrphanPhotos(urls: string[]): Promise<ActionResult> {
  await requireAdmin();
  const orphans = new Set((await getOrphanPhotos()).map((o) => o.url));
  const valid = urls.filter((u) => orphans.has(u));
  await deleteImages(valid);
  revalidatePath('/admin/recover');
  return { ok: true, message: `Deleted ${valid.length} photo${valid.length === 1 ? '' : 's'}` };
}

/* ------------------------------------------------------------------ bulk import */

export type ImportResult = { ok: boolean; message: string; id?: number; slug?: string; action?: 'created' | 'updated' };

const OUR_IMAGE = /^(\/uploads\/|\/media\/|https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/)/i;

/** Creates (or, when the row has an id, updates) one car from a spreadsheet row. Re-validated here. */
export async function importCarRow(record: Partial<Record<ImportKey, string>>, images: string[], asDraft: boolean): Promise<ImportResult> {
  await requireAdmin();
  const { car, errors } = normalizeRecord(record ?? {});
  if (!car) return { ok: false, message: errors.join(' · ') };
  const photos = (images ?? []).filter((u) => typeof u === 'string' && OUR_IMAGE.test(u)).slice(0, 20);

  const { id, photoCode: _code, ...fields } = car;
  const values = { ...fields, status: asDraft ? ('draft' as const) : car.status, specs: [], inspection: [], updatedAt: new Date() };
  const slug = await uniqueSlug(slugify(`${car.year} ${car.brand} ${car.model} ${car.variant}`), id);

  if (id) {
    const [existing] = await db.select({ id: cars.id, soldAt: cars.soldAt, specs: cars.specs, inspection: cars.inspection }).from(cars).where(eq(cars.id, id));
    if (!existing) return { ok: false, message: `No car with id ${id} — clear the id column to add it as a new car` };
    // Keep things the spreadsheet doesn't hold (inspection, custom fields, photos unless new ones were given).
    await db
      .update(cars)
      .set({ ...values, specs: existing.specs, inspection: existing.inspection, slug, soldAt: values.status === 'sold' ? (existing.soldAt ?? new Date()) : null })
      .where(eq(cars.id, id));
    if (photos.length) {
      await db.delete(carImages).where(eq(carImages.carId, id));
      await db.insert(carImages).values(photos.map((url, i) => ({ carId: id, url, sortOrder: i })));
    }
    refreshSite();
    return { ok: true, message: 'Updated', id, slug, action: 'updated' };
  }

  const [row] = await db
    .insert(cars)
    .values({ ...values, slug, soldAt: values.status === 'sold' ? new Date() : null })
    .returning({ id: cars.id });
  if (photos.length) await db.insert(carImages).values(photos.map((url, i) => ({ carId: row.id, url, sortOrder: i })));
  refreshSite();
  return { ok: true, message: 'Created', id: row.id, slug, action: 'created' };
}
