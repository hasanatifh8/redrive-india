import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  BadgeCheck,
  CalendarDays,
  Car as CarIcon,
  CheckCircle2,
  ChevronLeft,
  Cog,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  Users,
  Armchair,
  Eye,
} from 'lucide-react';
import { getCarBySlug, getPublicCars, getSettings } from '@/lib/data';
import { formatKm, formatPrice } from '@/lib/pricing';
import { telHref, waHref } from '@/lib/settings-defaults';
import CarCard from '@/components/CarCard';
import CarGallery from '@/components/CarGallery';
import EmiCalculator from '@/components/EmiCalculator';
import LeadForm from '@/components/LeadForm';
import { CarActions, ViewTracker } from '@/components/CarPageClient';
import { WhatsAppIcon } from '@/components/BrandIcons';
import { DemoNotice, SectionHeading } from '@/components/ui';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const car = await getCarBySlug(params.slug);
  if (!car) return { title: 'Car not found' };
  const title = `${car.year} ${car.brand} ${car.model} ${car.variant} — ${formatPrice(car.final)}`;
  return {
    title,
    description: `${car.year} ${car.brand} ${car.model}, ${formatKm(car.km)}, ${car.fuel}, ${car.transmission}, ${car.owner}. Available at REDRIVE INDIA, Prayagraj.`,
    openGraph: { title, images: car.images[0] ? [car.images[0]] : undefined },
  };
}

const scoreColor = (s: number) => (s >= 4 ? 'bg-emerald-500' : s >= 3 ? 'bg-amber-400' : 'bg-brand');

export default async function CarPage({ params }: { params: { slug: string } }) {
  const [car, s] = await Promise.all([getCarBySlug(params.slug), getSettings()]);
  if (!car) notFound();

  const all = await getPublicCars();
  const similar = all
    .filter((c) => c.id !== car.id)
    .map((c) => ({ c, score: (c.bodyType === car.bodyType ? 2 : 0) + (c.brand === car.brand ? 1 : 0) - Math.abs(c.final - car.final) / 500000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.c);

  const name = `${car.year} ${car.brand} ${car.model} ${car.variant}`;
  const specs = [
    { label: 'Model year', value: car.year, Icon: CalendarDays },
    { label: 'Kilometres', value: formatKm(car.km), Icon: Gauge },
    { label: 'Fuel', value: car.fuel, Icon: Fuel },
    { label: 'Transmission', value: car.transmission, Icon: Cog },
    { label: 'Ownership', value: car.owner, Icon: Users },
    { label: 'Body type', value: car.bodyType, Icon: CarIcon },
    { label: 'Colour', value: car.color, Icon: Palette },
    { label: 'Seats', value: car.seats, Icon: Armchair },
    { label: 'Registration', value: car.registration, Icon: MapPin },
    { label: 'Insurance', value: car.insuranceValidity, Icon: ShieldCheck },
  ].filter((x) => x.value);
  const avgScore = car.inspection.length ? car.inspection.reduce((a, b) => a + b.score, 0) / car.inspection.length : 0;
  const waText = `Hello ${s.businessName}, I am interested in the ${name} (${formatPrice(car.final)}). Is it available?`;
  const sold = car.status === 'sold';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name,
    brand: car.brand,
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.km, unitCode: 'KMT' },
    fuelType: car.fuel,
    vehicleTransmission: car.transmission,
    color: car.color || undefined,
    image: car.images,
    offers: {
      '@type': 'Offer',
      price: car.final,
      priceCurrency: 'INR',
      availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker carId={car.id} />
      <div className="rd-container py-8">
        <nav className="flex items-center gap-1 text-[13px] text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/buy-cars" className="inline-flex items-center gap-1 font-medium hover:text-brand">
            <ChevronLeft className="size-4" />
            All cars
          </Link>
          <span>/</span>
          <Link href={`/buy-cars?brand=${encodeURIComponent(car.brand)}`} className="hover:text-brand">
            {car.brand}
          </Link>
          <span>/</span>
          <span className="text-ink">{car.model}</span>
        </nav>

        {sold && (
          <div className="mt-4 rounded-xl border border-border bg-white p-4 text-[14px] text-ink">
            <strong>This car has been sold.</strong> Have a look at similar cars below, or tell us what you’re looking for.
          </div>
        )}

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6">
            <CarGallery
              images={car.images}
              brand={car.brand}
              model={car.model}
              year={car.year}
              badges={
                <>
                  {car.status === 'reserved' && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-ink shadow">Reserved</span>}
                  {car.newArrival && car.status === 'available' && (
                    <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow">New Arrival</span>
                  )}
                  {car.saving > 0 && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">Save {formatPrice(car.saving)}</span>}
                </>
              }
            />

            <section className="rd-card p-5">
              <h2 className="text-[18px] font-semibold text-ink">Car overview</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {specs.map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[12px] text-muted-foreground">{label}</dt>
                      <dd className="truncate text-[14px] font-semibold text-ink">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            {car.inspection.length > 0 && (
              <section className="rd-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-[18px] font-semibold text-ink">
                    <BadgeCheck className="size-5 text-emerald-600" />
                    Inspection report
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
                    Overall {avgScore.toFixed(1)} / 5
                  </span>
                </div>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {car.inspection.map((it) => (
                    <li key={it.area} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="font-medium text-ink">{it.area}</span>
                        <span className="font-semibold text-ink">{it.score}/5</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${scoreColor(it.score)}`} style={{ width: `${(it.score / 5) * 100}%` }} />
                      </div>
                      {it.note && <p className="mt-2 text-[13px] text-muted-foreground">{it.note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {car.features.length > 0 && (
              <section className="rd-card p-5">
                <h2 className="text-[18px] font-semibold text-ink">Features</h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {car.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[14px] text-ink-2">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {car.description && (
              <section className="rd-card p-5">
                <h2 className="text-[18px] font-semibold text-ink">About this car</h2>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{car.description}</p>
              </section>
            )}

            {!sold && <EmiCalculator price={car.final} rate={Number(s.emiInterestRate) || 10.5} maxTenure={Number(s.emiMaxTenureMonths) || 84} />}
          </div>

          <div className="flex flex-col gap-5 lg:sticky lg:top-32 lg:self-start">
            <div className="rd-card p-5">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{car.brand}</p>
              <h1 className="mt-1 text-[28px] leading-tight font-semibold text-ink">{car.model}</h1>
              <p className="text-[14px] text-muted-foreground">{car.variant}</p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {car.year} · {formatKm(car.km)} · {car.fuel} · {car.transmission}
              </p>

              <div className="mt-4 border-t border-dashed border-border pt-4">
                {car.saving > 0 && (
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] text-muted-foreground line-through">{formatPrice(car.price)}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">
                      {car.discountLabel || 'Discount'} · Save {formatPrice(car.saving)}
                    </span>
                  </div>
                )}
                <p className="font-heading text-[32px] leading-tight font-semibold text-ink">{formatPrice(car.final)}</p>
                <p className="text-[12px] text-muted-foreground">Fixed price · Paperwork guidance included</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={telHref(s.phonePrimary)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-semibold text-white hover:bg-brand-dark">
                  <Phone className="size-4" />
                  Call now
                </a>
                <a
                  href={waHref(s, waText)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-[14px] font-semibold text-white hover:brightness-95"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <CarActions car={car} />
              </div>
              {car.views > 5 && (
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Eye className="size-3.5" />
                  {car.views} people viewed this car
                </p>
              )}
              {s.showDemoNotice === 'true' && <DemoNotice className="mt-4">Demo listing — please confirm availability and price with the dealership.</DemoNotice>}
            </div>

            {!sold && (
              <div id="book">
                <LeadForm
                  title="Book a free test drive"
                  type="test_drive"
                  carId={car.id}
                  submitLabel="Request test drive"
                  showReferral
                  fields={[
                    { name: 'name', label: 'Your name', required: true, half: true },
                    { name: 'phone', label: 'Mobile number', type: 'tel', required: true, half: true },
                    { name: 'date', label: 'Preferred date', type: 'date', half: true },
                    { name: 'time', label: 'Preferred time', type: 'select', options: ['Morning (10–1)', 'Afternoon (1–4)', 'Evening (4–7)'], half: true },
                    { name: 'finance', label: 'Need a car loan?', type: 'select', options: ['Yes', 'No', 'Not sure'], half: true },
                    { name: 'exchange', label: 'Have a car to exchange?', type: 'select', options: ['Yes', 'No'], half: true },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="rd-container pb-16">
          <SectionHeading eyebrow="You may also like" title="Similar cars at the yard" action={{ href: '/buy-cars', label: 'View all cars' }} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
