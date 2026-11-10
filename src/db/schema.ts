import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch() * 1000)`;
const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now),
};

export type InspectionItem = { area: string; score: number; note?: string };
export type CustomSpec = { label: string; value: string };

export const cars = sqliteTable(
  'cars',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    variant: text('variant').notNull().default(''),
    year: integer('year').notNull(),
    month: integer('month'), // manufacturing month 1–12, optional
    km: integer('km').notNull().default(0),
    fuel: text('fuel').notNull(), // Petrol | Diesel | CNG | Electric | Hybrid
    transmission: text('transmission').notNull(), // Manual | Automatic
    bodyType: text('body_type').notNull().default('SUV'),
    owner: text('owner').notNull().default('1st Owner'),
    color: text('color').notNull().default(''),
    seats: integer('seats'),
    registration: text('registration').notNull().default(''), // e.g. "UP-70 · Prayagraj"
    insuranceValidity: text('insurance_validity').notNull().default(''),
    price: integer('price').notNull(), // listed price, rupees
    discountType: text('discount_type').notNull().default('none'), // none | flat | percent
    discountValue: integer('discount_value').notNull().default(0),
    discountLabel: text('discount_label').notNull().default(''), // e.g. "Diwali offer"
    status: text('status').notNull().default('available'), // draft | available | reserved | sold
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    newArrival: integer('new_arrival', { mode: 'boolean' }).notNull().default(false),
    description: text('description').notNull().default(''),
    features: text('features', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    inspection: text('inspection', { mode: 'json' }).$type<InspectionItem[]>().notNull().default(sql`'[]'`),
    specs: text('specs', { mode: 'json' }).$type<CustomSpec[]>().notNull().default(sql`'[]'`), // admin-defined extra fields
    views: integer('views').notNull().default(0),
    soldAt: integer('sold_at', { mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('cars_slug_idx').on(t.slug), index('cars_status_idx').on(t.status)],
);

export const carImages = sqliteTable(
  'car_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    carId: integer('car_id')
      .notNull()
      .references(() => cars.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('car_images_car_idx').on(t.carId)],
);

export const referralCodes = sqliteTable(
  'referral_codes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    description: text('description').notNull().default(''),
    discountType: text('discount_type').notNull().default('flat'), // flat | percent
    discountValue: integer('discount_value').notNull().default(0),
    maxDiscount: integer('max_discount'), // cap for percent codes
    referrerName: text('referrer_name').notNull().default(''),
    referrerPhone: text('referrer_phone').notNull().default(''),
    rewardAmount: integer('reward_amount').notNull().default(0), // paid to referrer per sale
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('referral_code_idx').on(t.code)],
);

export const leads = sqliteTable(
  'leads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(), // test_drive | buy | sell | exchange | general
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    carId: integer('car_id').references(() => cars.id, { onDelete: 'set null' }),
    carLabel: text('car_label').notNull().default(''), // snapshot, survives car deletion
    referralCode: text('referral_code'),
    details: text('details', { mode: 'json' }).$type<Record<string, string>>().notNull().default(sql`'{}'`),
    images: text('images', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`), // customer photos (sell leads)
    status: text('status').notNull().default('new'), // new | contacted | negotiating | won | lost
    notes: text('notes').notNull().default(''),
    rewardPaid: integer('reward_paid', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index('leads_status_idx').on(t.status), index('leads_created_idx').on(t.createdAt)],
);

export const offers = sqliteTable('offers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  image: text('image'),
  carId: integer('car_id').references(() => cars.id, { onDelete: 'set null' }),
  ctaLabel: text('cta_label').notNull().default(''),
  ctaHref: text('cta_href').notNull().default(''),
  validUntil: integer('valid_until', { mode: 'timestamp_ms' }),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  showOnHome: integer('show_on_home', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type Offer = typeof offers.$inferSelect;
