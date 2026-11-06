import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  CarFront,
  Handshake,
  MapPin,
  Phone,
  Repeat2,
  ScanSearch,
  Search,
  ShieldCheck,
  SmilePlus,
} from 'lucide-react';
import { BRANDS } from '@/lib/constants';
import { getActiveOffers, getPublicCars, getSettings } from '@/lib/data';
import { formatPrice } from '@/lib/pricing';
import { telHref } from '@/lib/settings-defaults';
import CarCard from '@/components/CarCard';
import VehicleSearch from '@/components/VehicleSearch';
import Gallery from '@/components/Gallery';
import Reveal from '@/components/Reveal';
import LocationCard from '@/components/LocationCard';
import ContactCTA from '@/components/ContactCTA';
import { DemoNotice, OfferCard, SectionHeading } from '@/components/ui';

const PILLARS = [
  { Icon: ShieldCheck, title: 'Verified Cars', text: 'Every car on display is checked by our team before it reaches the yard. Inspect it yourself and ask for its papers at the showroom.' },
  { Icon: Handshake, title: 'Fair Deals', text: 'Prices are discussed openly, face to face — whether you are buying, selling or exchanging.' },
  { Icon: ScanSearch, title: 'Transparent Process', text: 'Clear paperwork guidance from enquiry to handover. Ask any question about a car before you decide.' },
  { Icon: SmilePlus, title: 'Customer Satisfaction', text: 'A local Prayagraj dealership you can visit, call or WhatsApp any time you need help.' },
];

const SERVICES = [
  { Icon: CarFront, title: 'Buy a pre-owned car', text: 'Browse hatchbacks, sedans, SUVs and MUVs. Shortlist, compare and book a test drive.', href: '/buy-cars', cta: 'Browse cars', offset: false },
  { Icon: BadgeIndianRupee, title: 'Sell your car', text: 'Share your car’s details and photos. We’ll call you to discuss a fair price.', href: '/sell-your-car', cta: 'Get a callback', offset: true },
  { Icon: Repeat2, title: 'Exchange your car', text: 'Upgrade by exchanging your current car against any car from our yard.', href: '/exchange', cta: 'Start exchange', offset: false },
];

export default async function Home() {
  const [cars, offers, s] = await Promise.all([getPublicCars(), getActiveOffers(true), getSettings()]);
  const featured = (cars.some((c) => c.featured) ? cars.filter((c) => c.featured) : cars).slice(0, 6);
  const latest = [...cars]
    .sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);
  const showDemo = s.showDemoNotice === 'true';

  // Brands in stock first, then the popular makes we can source on request.
  const stockBrands = Array.from(new Set(cars.map((c) => c.brand)));
  const brandTiles = [...stockBrands, ...BRANDS.filter((b) => !stockBrands.includes(b))].slice(0, 12);
  const brandCount = (b: string) => {
    const n = cars.filter((c) => c.brand === b).length;
    return n === 0 ? 'Ask for availability' : `${n} car${n > 1 ? 's' : ''} in stock`;
  };

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="rd-dots absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-brand/25 blur-[120px]" aria-hidden="true" />
        <div className="rd-container relative grid items-center gap-10 pt-10 pb-28 md:pt-14 lg:grid-cols-[1fr_1.1fr] lg:pb-32">
          <div>
            <span className="animate-rd-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold tracking-[0.2em] text-white uppercase backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand" />
              REDRIVE INDIA · Prayagraj
            </span>
            <h1 className="animate-rd-rise mt-5 text-[30px] leading-[1.15] font-semibold [animation-delay:60ms] md:text-[34px]">
              {s.heroTitle}
              <span className="block text-white/60">{s.heroSubtitle}</span>
            </h1>
            <p className="animate-rd-rise mt-4 max-w-lg text-[15px] leading-relaxed text-white/70 [animation-delay:120ms]">
              {s.heroText} <span className="text-white">Drive your dream.</span>
            </p>
            <div className="animate-rd-rise mt-7 flex flex-wrap gap-2.5 [animation-delay:180ms]">
              <a
                href="#vehicle-search"
                className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white shadow-lg shadow-brand/30 transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98]"
              >
                <Search className="size-4" />
                Search Cars
              </a>
              <Link
                href="/buy-cars"
                className="flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-semibold text-ink transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98]"
              >
                Explore Inventory
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sell-your-car"
                className="flex h-11 items-center gap-2 rounded-lg border border-white/25 px-5 text-[14px] font-semibold text-white transition-[background-color,border-color] duration-150 hover:border-white/50 hover:bg-white/5"
              >
                Sell Your Car
              </Link>
            </div>
            <div className="animate-rd-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/60 [animation-delay:240ms]">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#FF6B7F]" />
                {s.addressShort}
              </span>
              <a href={telHref(s.phonePrimary)} className="flex items-center gap-1.5 transition-colors duration-150 hover:text-white">
                <Phone className="size-3.5 text-[#FF6B7F]" />
                {s.phonePrimary}
              </a>
            </div>
          </div>

          <div className="animate-rd-rise relative [animation-delay:120ms]">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src="/images/signage-gate.jpg"
                alt="REDRIVE INDIA dealership entrance with signage on 120 Feet Road, Prayagraj"
                className="aspect-[1600/719] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-right">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-[#FF6B7F] uppercase">Our showroom</p>
                <p className="text-[14px] text-white">Sale · Purchase · Exchange of Pre-Owned Cars</p>
              </div>
            </div>
            <div className="absolute -bottom-16 -left-4 hidden w-40 overflow-hidden rounded-xl border-4 border-ink shadow-xl sm:block md:-left-8">
              <img src="/images/showroom-cars.jpg" alt="Cars on display at REDRIVE INDIA" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Vehicle search ---------- */}
      <div className="rd-container relative z-10 -mt-16">
        <VehicleSearch brands={stockBrands.sort()} models={cars.map((c) => ({ brand: c.brand, model: c.model }))} />
      </div>

      {/* ---------- Featured ---------- */}
      <section className="rd-container py-16">
        <SectionHeading
          eyebrow="Featured cars"
          title="Handpicked from our yard"
          description={`A selection of cars currently featured at ${s.businessName}.`}
          action={{ href: '/buy-cars', label: `View all ${cars.length} cars` }}
        />
        {showDemo && (
          <DemoNotice>
            Illustrative demo data — prices, variants, kilometres and availability will be updated when {s.businessName} supplies its
            actual stock list.
          </DemoNotice>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      </section>

      {/* ---------- Brands ---------- */}
      <section className="border-y border-border bg-white py-14">
        <div className="rd-container">
          <SectionHeading eyebrow="Browse by brand" title="Shop the makes India drives" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brandTiles.map((b) => (
              <Link
                key={b}
                href={`/buy-cars?brand=${encodeURIComponent(b)}`}
                className="group flex flex-col justify-between gap-6 rounded-xl border border-border bg-page/60 p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-ink font-heading text-[15px] font-semibold text-white transition-colors duration-200 group-hover:bg-brand">
                  {b[0]}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{b}</span>
                  <span className="text-[12px] text-muted-foreground">{brandCount(b)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Latest arrivals ---------- */}
      <section className="rd-container py-16">
        <SectionHeading eyebrow="Latest arrivals" title="Just arrived at the yard" action={{ href: '/buy-cars?sort=newest', label: 'See newest first' }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <section className="relative overflow-hidden bg-ink py-16 text-white">
        <div className="rd-dots absolute inset-0" aria-hidden="true" />
        <div className="rd-container relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              dark
              className="mb-6"
              eyebrow="Why REDRIVE INDIA"
              title="The promise on our signboard"
              description="These four words greet every customer at our gate on 120 Feet Road. They’re how we try to work, every day."
            />
            <img src="/images/yard-entrance.jpg" alt="REDRIVE INDIA yard" className="aspect-[16/10] w-full rounded-xl object-cover opacity-90" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="h-full rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-[border-color,background-color] duration-200 hover:border-brand/50 hover:bg-white/[0.07]">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/15 text-[#FF6B7F]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-[18px] font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-white/65">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Services ---------- */}
      <section className="rd-container py-16">
        <SectionHeading eyebrow="What we do" title="Buy, sell or exchange — under one roof" />
        <div className="grid gap-5 md:grid-cols-3">
          {SERVICES.map(({ Icon, title, text, href, cta, offset }) => (
            <div
              key={title}
              className={`rd-card group relative flex flex-col overflow-hidden p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                offset ? 'md:translate-y-4 md:hover:translate-y-3.5' : ''
              }`}
            >
              <span className="absolute top-0 left-0 h-1 w-14 bg-brand transition-[width] duration-300 group-hover:w-full" />
              <Icon className="size-7 text-brand" />
              <h3 className="mt-4 text-[20px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
              <Link
                href={href}
                className="mt-5 inline-flex h-10 w-fit items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
              >
                {cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Offers ---------- */}
      {offers.length > 0 && (
      <section className="border-y border-border bg-white py-16">
        <div className="rd-container">
          <SectionHeading
            eyebrow="Special offers"
            title="Current highlights"
            description="Current deals and spotlight cars at our Kalindipuram yard."
            action={{ href: '/offers', label: 'All offers' }}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {offers.slice(0, 3).map((o) => (
              <OfferCard
                key={o.id}
                media={
                  o.image || o.car?.images[0] ? (
                    <img src={o.image || o.car!.images[0]} alt="" className="aspect-[16/8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex aspect-[16/8] items-center justify-center bg-ink">
                      <img src="/images/logo-light.png" alt="" className="h-14 opacity-80" />
                    </div>
                  )
                }
                title={o.title}
                text={o.description}
                price={o.car ? formatPrice(o.car.final) : undefined}
                oldPrice={o.car && o.car.saving > 0 ? formatPrice(o.car.price) : undefined}
                href={o.car ? `/cars/${o.car.slug}` : o.ctaHref || undefined}
                cta={o.ctaLabel || undefined}
                validUntil={o.validUntil}
              />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ---------- Gallery ---------- */}
      <section className="rd-container py-16">
        <SectionHeading eyebrow="Dealership gallery" title="Visit our Kalindipuram yard" description="Real photographs from REDRIVE INDIA, 120 Feet Road." />
        <Gallery />
      </section>

      {/* ---------- Location ---------- */}
      <section className="rd-container pb-16">
        <LocationCard />
      </section>

      <ContactCTA />
    </div>
  );
}
