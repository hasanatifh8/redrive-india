// Loads demo cars, offers and a sample referral code. Only runs on an empty database
// unless you pass --force (which wipes cars/offers/referral codes first).
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { count } from 'drizzle-orm';
import * as schema from '../src/db/schema.ts';

try {
  process.loadEnvFile('.env.local');
} catch {}

const client = createClient({ url: process.env.TURSO_DATABASE_URL || 'file:local.db', authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client, { schema });
const { cars, carImages, offers, referralCodes } = schema;

const force = process.argv.includes('--force');
const [{ n }] = await db.select({ n: count() }).from(cars);
if (n > 0 && !force) {
  console.log(`Database already has ${n} cars — skipping. Use "npm run db:seed -- --force" to reset demo data.`);
  process.exit(0);
}
if (force) {
  await db.delete(offers);
  await db.delete(carImages);
  await db.delete(cars);
  await db.delete(referralCodes);
}

const img = (id: string) => `/images/photo-${id}.jpg`;
const days = (d: number) => new Date(Date.now() - d * 86400000);
const INSPECTION = [
  { area: 'Exterior', score: 4, note: 'Minor scratches on rear bumper' },
  { area: 'Interior', score: 5, note: 'Clean, no tears' },
  { area: 'Engine & Transmission', score: 5, note: 'Smooth, no leaks' },
  { area: 'Suspension & Brakes', score: 4 },
  { area: 'Tyres', score: 4, note: '70% life remaining' },
  { area: 'Electricals & AC', score: 5 },
];

type Seed = Omit<typeof cars.$inferInsert, 'slug'> & { photos: string[] };
const DEMO: Seed[] = [
  { brand: 'Hyundai', model: 'Creta', variant: 'SX (O) 1.5 Diesel AT', year: 2021, km: 38500, fuel: 'Diesel', transmission: 'Automatic', bodyType: 'SUV', owner: '1st Owner', color: 'Fiery Red', seats: 5, registration: 'UP-70 · Prayagraj', price: 1475000, discountType: 'flat', discountValue: 25000, discountLabel: 'Festive offer', featured: true, photos: [img('1748214547184-d994bfe53322')], features: ['Sunroof', 'Ventilated seats', 'Android Auto / Apple CarPlay', 'Rear camera', 'Cruise control'], createdAt: days(60) },
  { brand: 'Mahindra', model: 'Thar', variant: 'LX Hard Top 4WD Diesel MT', year: 2022, km: 24800, fuel: 'Diesel', transmission: 'Manual', bodyType: 'SUV', owner: '1st Owner', color: 'Napoli Black', seats: 4, registration: 'UP-70 · Prayagraj', price: 1490000, featured: true, photos: [img('1710225358761-4f5891df657d')], features: ['4x4', 'Touchscreen infotainment', 'Cruise control'], createdAt: days(52) },
  { brand: 'Toyota', model: 'Innova Crysta', variant: '2.4 VX 7-Seater MT', year: 2019, km: 86000, fuel: 'Diesel', transmission: 'Manual', bodyType: 'MUV', owner: '2nd Owner', color: 'Super White', seats: 7, registration: 'UP-32 · Lucknow', price: 1750000, featured: true, photos: [img('1748215210950-536c6621629a')], features: ['Climate control', 'Rear camera', 'Airbags (6)'], createdAt: days(70) },
  { brand: 'Kia', model: 'Seltos', variant: 'HTX 1.5 Petrol IVT', year: 2020, km: 45200, fuel: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', owner: '1st Owner', color: 'Gravity Grey', seats: 5, registration: 'UP-65 · Varanasi', price: 1140000, discountType: 'percent', discountValue: 3, discountLabel: 'Limited-time price drop', featured: true, photos: [img('1659406189166-7c17fe5df12a')], features: ['Sunroof', 'LED headlamps', 'Push-button start'], createdAt: days(64) },
  { brand: 'Mahindra', model: 'Scorpio-N', variant: 'Z8 L 2.2 Diesel AT', year: 2023, km: 18700, fuel: 'Diesel', transmission: 'Automatic', bodyType: 'SUV', owner: '1st Owner', color: 'Deep Forest', seats: 7, registration: 'UP-70 · Prayagraj', price: 2190000, featured: true, newArrival: true, photos: [img('1652709830696-1e88c2d9247b')], features: ['Sunroof', 'Leather seats', 'Wireless charging', 'Airbags (6)'], createdAt: days(5) },
  { brand: 'Honda', model: 'City', variant: 'VX 1.5 i-VTEC CVT', year: 2021, km: 30400, fuel: 'Petrol', transmission: 'Automatic', bodyType: 'Sedan', owner: '1st Owner', color: 'Platinum White', seats: 5, registration: 'UP-70 · Prayagraj', price: 1125000, featured: true, photos: [img('1708401265955-bef493b523e7')], features: ['Sunroof', 'Cruise control', 'LED headlamps'], createdAt: days(48) },
  { brand: 'Tata', model: 'Nexon EV', variant: 'Max XZ+ Lux', year: 2023, km: 14500, fuel: 'Electric', transmission: 'Automatic', bodyType: 'Compact SUV', owner: '1st Owner', color: 'Intensi-Teal', seats: 5, registration: 'UP-70 · Prayagraj', price: 1540000, newArrival: true, photos: [img('1629367121610-34e15c4c1f25')], features: ['Sunroof', 'Ventilated seats', 'Wireless charging'], createdAt: days(3) },
  { brand: 'Maruti Suzuki', model: 'Brezza', variant: 'VXi S-CNG MT', year: 2023, km: 16200, fuel: 'CNG', transmission: 'Manual', bodyType: 'Compact SUV', owner: '1st Owner', color: 'Grandeur Grey', seats: 5, registration: 'UP-70 · Prayagraj', price: 980000, newArrival: true, photos: [img('1729539853644-c110fa1f389d')], features: ['Touchscreen infotainment', 'Rear camera'], createdAt: days(9) },
  { brand: 'MG', model: 'Astor', variant: 'Sharp 1.5 CVT', year: 2022, km: 22000, fuel: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', owner: '1st Owner', color: 'Aurora Silver', seats: 5, registration: 'UP-70 · Prayagraj', price: 1190000, newArrival: true, photos: [img('1643628067815-3c32ff04f23e')], features: ['Sunroof', '360° camera', 'Climate control'], createdAt: days(14) },
  { brand: 'Maruti Suzuki', model: 'Swift', variant: 'ZXi 1.2 Petrol MT', year: 2020, km: 41000, fuel: 'Petrol', transmission: 'Manual', bodyType: 'Hatchback', owner: '1st Owner', color: 'Solid Fire Red', seats: 5, registration: 'UP-70 · Prayagraj', price: 560000, photos: [], createdAt: days(83) },
  { brand: 'Maruti Suzuki', model: 'Baleno', variant: 'Alpha 1.2 AMT', year: 2022, km: 21500, fuel: 'Petrol', transmission: 'Automatic', bodyType: 'Hatchback', owner: '1st Owner', color: 'Nexa Blue', seats: 5, registration: 'UP-70 · Prayagraj', price: 780000, photos: [], createdAt: days(60) },
  { brand: 'Hyundai', model: 'i20', variant: 'Asta (O) 1.2 MT', year: 2021, km: 33800, fuel: 'Petrol', transmission: 'Manual', bodyType: 'Hatchback', owner: '1st Owner', color: 'Polar White', seats: 5, registration: 'UP-70 · Prayagraj', price: 760000, photos: [], createdAt: days(65) },
  { brand: 'Tata', model: 'Nexon', variant: 'XZ+ 1.2 Petrol MT', year: 2021, km: 36200, fuel: 'Petrol', transmission: 'Manual', bodyType: 'Compact SUV', owner: '1st Owner', color: 'Flame Red', seats: 5, registration: 'UP-70 · Prayagraj', price: 845000, photos: [], createdAt: days(47) },
  { brand: 'Toyota', model: 'Fortuner', variant: '2.8 4x2 Diesel AT', year: 2018, km: 92000, fuel: 'Diesel', transmission: 'Automatic', bodyType: 'SUV', owner: '2nd Owner', color: 'Attitude Black', seats: 7, registration: 'UP-70 · Prayagraj', price: 2650000, status: 'reserved', photos: [], createdAt: days(90) },
];

const slugOf = (c: Seed) =>
  `${c.year}-${c.brand}-${c.model}-${c.variant}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ids: Record<string, number> = {};
for (const { photos, ...c } of DEMO) {
  const [row] = await db
    .insert(cars)
    .values({
      ...c,
      slug: slugOf({ ...c, photos }),
      description: `Well-maintained ${c.year} ${c.brand} ${c.model} ${c.variant} in ${c.color}. Inspected by the REDRIVE INDIA team. Visit our 120 Feet Road yard for a test drive. (Demo listing — details are illustrative.)`,
      inspection: INSPECTION,
      updatedAt: c.createdAt,
    })
    .returning({ id: cars.id });
  ids[c.model] = row.id;
  if (photos.length) await db.insert(carImages).values(photos.map((url, i) => ({ carId: row.id, url, sortOrder: i })));
}

await db.insert(offers).values([
  { category: 'showroom', icon: 'inspection', highlight: 'FREE', title: 'Free car health check-up', description: '25-point check of engine, brakes, battery, AC and tyres — for any car, any brand. Takes about 30 minutes.', terms: 'Prior booking required. Valid Monday–Saturday. Parts and repairs, if any, are charged separately.', sortOrder: 0 },
  { category: 'showroom', icon: 'test-drive', highlight: 'FREE', title: 'Test drive at your doorstep', description: 'Shortlisted a car? We’ll bring it to your home or office in Prayagraj for a no-obligation test drive.', terms: 'Within Prayagraj city limits. Valid driving licence required.', sortOrder: 1 },
  { category: 'showroom', icon: 'paperwork', highlight: 'FREE', title: 'RC transfer assistance', description: 'Buy any car from us and we handle the RC transfer paperwork for you at no extra service charge.', terms: 'Government/RTO fees are payable as applicable.', claimable: false, ctaLabel: 'Browse cars', ctaHref: '/buy-cars', sortOrder: 2 },
  { category: 'showroom', icon: 'exchange', highlight: 'FREE VALUATION', title: 'Bring your car for exchange evaluation', description: 'Planning to upgrade? Bring your current car to the showroom and discuss its exchange value against any car you like.', ctaLabel: 'Start exchange', ctaHref: '/exchange', sortOrder: 3 },
  { category: 'car', highlight: 'Festive deal', title: 'Spotlight: Hyundai Creta SX (O)', description: 'Top-spec diesel automatic Creta featured this month — now with a festive discount.', carId: ids['Creta'], sortOrder: 1 },
  { category: 'car', highlight: 'New arrival', title: 'New arrival: Mahindra Scorpio-N Z8 L', description: 'Nearly new Scorpio-N automatic — just arrived at the yard.', carId: ids['Scorpio-N'], sortOrder: 2 },
]);

await db.insert(referralCodes).values({
  code: 'WELCOME5K',
  description: 'Welcome discount for referred customers',
  discountType: 'flat',
  discountValue: 5000,
  referrerName: 'Demo referrer',
  rewardAmount: 2000,
});

console.log(`✓ Seeded ${DEMO.length} cars, 6 offers and referral code WELCOME5K`);
client.close();
