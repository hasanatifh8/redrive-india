'use server';

import { and, eq, gt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, schema } from '@/db';
import { codeDiscount, finalPrice, formatPrice } from '@/lib/pricing';
import { getCarsByIds } from '@/lib/data';
import { saveImage } from '@/lib/storage';

const MAX_LEAD_PHOTOS = 8;
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024; // browser compresses to ~300 KB first
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const { leads, referralCodes, cars } = schema;

export type LeadState = { ok: boolean; message: string; summary?: string } | null;

const LeadSchema = z.object({
  type: z.enum(['test_drive', 'buy', 'sell', 'exchange', 'general']),
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, '').slice(-10))
    .refine((v) => /^[6-9]\d{9}$/.test(v), 'Please enter a valid 10-digit mobile number'),
  carId: z.coerce.number().int().positive().optional().catch(undefined),
  referralCode: z.string().trim().toUpperCase().max(32).optional(),
});

type CodeLookup = { ok: false; error: string } | { ok: true; rc: typeof referralCodes.$inferSelect };

async function findValidCode(code: string): Promise<CodeLookup> {
  const [rc] = await db.select().from(referralCodes).where(eq(referralCodes.code, code.toUpperCase()));
  if (!rc || !rc.active) return { ok: false, error: 'This code is not valid' };
  if (rc.expiresAt && rc.expiresAt.getTime() < Date.now()) return { ok: false, error: 'This code has expired' };
  if (rc.maxUses != null && rc.usedCount >= rc.maxUses) return { ok: false, error: 'This code has reached its usage limit' };
  return { ok: true, rc };
}

export type CodeCheck = { ok: boolean; message: string; discount?: number; code?: string };

export async function checkReferralCode(code: string, carId?: number): Promise<CodeCheck> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: 'Enter a code' };
  const res = await findValidCode(trimmed);
  if (!res.ok) return { ok: false, message: res.error };
  const { rc } = res;
  let discount = rc.discountType === 'flat' ? rc.discountValue : 0;
  if (carId) {
    const [car] = await getCarsByIds([carId]);
    if (car) discount = codeDiscount(car.final, rc);
  }
  const label =
    rc.discountType === 'percent'
      ? `${rc.discountValue}% off${rc.maxDiscount ? ` (up to ${formatPrice(rc.maxDiscount)})` : ''}`
      : `${formatPrice(rc.discountValue)} off`;
  return { ok: true, message: `Code applied — ${label}`, discount, code: rc.code };
}

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  // Honeypot: real people never fill this hidden field.
  if (form.get('company')) return { ok: true, message: 'Thanks! We will call you shortly.' };

  const parsed = LeadSchema.safeParse({
    type: form.get('type'),
    name: form.get('name'),
    phone: form.get('phone'),
    carId: form.get('carId') || undefined,
    referralCode: (form.get('referralCode') as string) || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { type, name, phone, carId } = parsed.data;
  // Referral codes give a discount on a purchase — they don't apply when a customer sells to us.
  const referralCode = type === 'sell' ? undefined : parsed.data.referralCode;

  const photos = type === 'sell' ? form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0) : [];
  if (photos.length > MAX_LEAD_PHOTOS) return { ok: false, message: `Please upload at most ${MAX_LEAD_PHOTOS} photos` };
  for (const f of photos) {
    if (!PHOTO_TYPES.includes(f.type)) return { ok: false, message: 'Photos must be JPG, PNG or WebP images' };
    if (f.size > MAX_PHOTO_BYTES) return { ok: false, message: 'One of the photos is too large' };
  }

  // Basic flood protection: same phone + type within 2 minutes.
  const recent = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.phone, phone), eq(leads.type, type), gt(leads.createdAt, new Date(Date.now() - 2 * 60 * 1000))));
  if (recent.length) return { ok: true, message: 'We already have your request — our team will call you shortly.' };

  const details: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== 'string' || !v.trim()) continue;
    if (['type', 'name', 'phone', 'carId', 'referralCode', 'company', 'photos'].includes(k) || k.startsWith('$ACTION')) continue;
    details[k] = v.trim().slice(0, 1000);
  }

  let carLabel = '';
  if (carId) {
    const [car] = await db.select().from(cars).where(eq(cars.id, carId));
    if (car) {
      carLabel = `${car.year} ${car.brand} ${car.model} ${car.variant} — ${formatPrice(finalPrice(car))}`;
    }
  }

  let appliedCode: string | null = null;
  if (referralCode) {
    const res = await findValidCode(referralCode);
    if (!res.ok) return { ok: false, message: `Referral code: ${res.error}` };
    appliedCode = res.rc.code;
    await db
      .update(referralCodes)
      .set({ usedCount: sql`${referralCodes.usedCount} + 1` })
      .where(eq(referralCodes.id, res.rc.id));
  }

  let images: string[] = [];
  try {
    images = await Promise.all(photos.map((f) => saveImage(f, 'sell-leads')));
  } catch {
    return { ok: false, message: 'Could not upload your photos — please try again, or send them on WhatsApp.' };
  }

  await db.insert(leads).values({ type, name, phone, carId: carId ?? null, carLabel, referralCode: appliedCode, details, images });
  revalidatePath('/admin', 'layout');

  const summary = [
    `Hello, I just sent an enquiry on your website.`,
    `Name: ${name}`,
    carLabel && `Car: ${carLabel}`,
    ...Object.entries(details).map(([k, v]) => `${k}: ${v}`),
    appliedCode && `Referral code: ${appliedCode}`,
    images.length > 0 && `(${images.length} photos uploaded on the website)`,
  ]
    .filter(Boolean)
    .join('\n');

  return { ok: true, message: 'Thank you! Our team will call you shortly.', summary };
}

export async function recordView(carId: number) {
  await db
    .update(cars)
    .set({ views: sql`${cars.views} + 1` })
    .where(eq(cars.id, carId));
}

export async function fetchCarsByIds(ids: number[]) {
  return getCarsByIds(ids.filter((x) => Number.isInteger(x)).slice(0, 100));
}
