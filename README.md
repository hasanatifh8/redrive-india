# REDRIVE INDIA — Website & Admin Panel

Pre-owned car dealership website for REDRIVE INDIA, 120 Feet Road, Kalindipuram, Prayagraj.
Next.js 14 (App Router) · Tailwind CSS v4 · Drizzle ORM · Turso (SQLite) · Vercel Blob.

## What's inside

**Public website**
- Homepage, Buy Cars (filters: brand, model, budget, body type, fuel, transmission, year, km, discounted only; 7 sort orders), car pages, Sell, Exchange, Offers, About, Contact, FAQ
- Car page: photo gallery with full-screen view and swipe, discount pricing, inspection report, features, EMI calculator, test-drive booking, share, similar cars
- Wishlist (saved on the device), compare up to 3 cars side by side
- Every form saves a lead to the database (with spam protection) and offers a WhatsApp follow-up
- Referral / coupon codes checked live on forms
- SEO: per-car titles and social images, structured data, `sitemap.xml`, `robots.txt`

**Admin panel — `/admin`**
- **Dashboard:** stock count and value, new leads, sales this month, 14-day lead chart, most-viewed cars, cars missing photos
- **Cars:** add/edit with up to 12 photos (drag to reorder, choose cover, auto-compressed), price, flat or % discount with label, status (available / reserved / sold / draft), featured, new-arrival, features, inspection scores, description. Search, status tabs, duplicate, delete, and **bulk actions** (status, featured, apply/remove discount, delete)
- **Leads:** inbox with status pipeline (new → contacted → negotiating → won / lost), notes, one-tap call / WhatsApp, referral info, CSV export
- **Referral codes:** flat or % discount (with cap), referrer name/phone, reward per sale, usage limit, expiry, pause/resume, rewards-owed tracking
- **Offers:** banners linked to a car or a page, image, expiry date, homepage toggle, order
- **Settings:** phones, WhatsApp, address, hours, maps link/embed, homepage hero text, announcement bar, EMI defaults, demo-notice toggle

## Run locally

```bash
npm install
npm run db:seed   # first time only — loads the demo cars
npm run dev       # http://localhost:3000   admin: http://localhost:3000/admin
```

No accounts or env vars are needed locally: data goes in `local.db` (SQLite) and uploaded photos go in `.uploads/`.
The local admin password is **`admin123`**. Set `ADMIN_PASSWORD` in `.env.local` to change it (see `.env.example`).

Useful commands: `npm run db:studio` (browse the database), `npm run db:seed -- --force` (reset demo data).
After changing `src/db/schema.ts`, run `npm run db:generate` to create a migration.

## Deploy to Vercel

1. **Push this folder to a GitHub repository**, then on vercel.com choose **Add New → Project** and import it.
2. **Database:** in the project open **Storage → Create / Marketplace → Turso** and connect it. This adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. **Photo storage:** **Storage → Create → Blob** and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD`: a strong password for `/admin`
   - `AUTH_SECRET`: a random string of 32+ characters (generate one with `openssl rand -base64 32`)
   - `NEXT_PUBLIC_SITE_URL`: your domain, e.g. `https://redriveindia.in`
5. **Deploy.** The build runs database migrations automatically.
6. **Optional:** load the demo cars into the live database once, from your computer:
   ```bash
   TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run db:seed
   ```
   Or skip this and add your real cars from `/admin`.
7. In `/admin/settings`, fill in the opening hours and turn off **“Show demo data notices”** once real stock is listed.

## Project layout

```
src/app/(site)/        public pages + actions.ts (lead form, referral check)
src/app/admin/         login, admin pages, actions.ts (all admin mutations)
src/app/api/admin/     photo upload, leads CSV
src/db/                schema + database client
src/lib/               data queries, pricing/EMI, auth, storage, constants
src/components/        shared UI (components/admin = admin UI)
scripts/               migrate + seed
drizzle/               SQL migrations
```
