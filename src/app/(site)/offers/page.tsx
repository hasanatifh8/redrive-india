import Link from 'next/link';
import type { Metadata } from 'next';
import { CarFront, Gift, Tag } from 'lucide-react';
import { getActiveOffers, getPublicCars } from '@/lib/data';
import { formatPrice } from '@/lib/pricing';
import ContactCTA from '@/components/ContactCTA';
import CarCard from '@/components/CarCard';
import ShowroomOfferCard from '@/components/ShowroomOfferCard';
import { EmptyState, OfferCard, PageHero, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Offers & Deals',
  description: 'Showroom offers, free services and discounted pre-owned cars at REDRIVE INDIA, Prayagraj.',
};

type Tab = 'all' | 'showroom' | 'cars';

export default async function OffersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab: Tab = searchParams.tab === 'showroom' || searchParams.tab === 'cars' ? searchParams.tab : 'all';
  const [offers, cars] = await Promise.all([getActiveOffers(), getPublicCars()]);
  const showroom = offers.filter((o) => o.category === 'showroom');
  const carOffers = offers.filter((o) => o.category !== 'showroom');
  const deals = cars.filter((c) => c.saving > 0).sort((a, b) => b.saving - a.saving);

  const tabs: { id: Tab; label: string; n: number; Icon: typeof Tag }[] = [
    { id: 'all', label: 'All offers', n: showroom.length + carOffers.length + deals.length, Icon: Tag },
    { id: 'showroom', label: 'Showroom offers', n: showroom.length, Icon: Gift },
    { id: 'cars', label: 'Car deals', n: carOffers.length + deals.length, Icon: CarFront },
  ];
  const showShowroom = tab !== 'cars';
  const showCars = tab !== 'showroom';

  return (
    <>
      <PageHero
        eyebrow="Special offers"
        title="Offers, freebies & price drops"
        description="Free services and events at our Kalindipuram showroom, plus the best deals on cars in stock."
        image="/images/showroom-cars.jpg"
      />

      <div className="sticky top-16 z-20 border-b border-border bg-white/90 backdrop-blur md:top-[100px]">
        <nav className="rd-container flex gap-1 overflow-x-auto py-2" aria-label="Offer type">
          {tabs.map(({ id, label, n, Icon }) => (
            <Link
              key={id}
              href={id === 'all' ? '/offers' : `/offers?tab=${id}`}
              scroll={false}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition ${
                tab === id ? 'bg-ink text-white' : 'text-ink-2 hover:bg-muted'
              }`}
            >
              <Icon className="size-4" />
              {label}
              <span className={`rounded-full px-1.5 text-[12px] ${tab === id ? 'bg-white/20' : 'bg-muted text-muted-foreground'}`}>{n}</span>
            </Link>
          ))}
        </nav>
      </div>

      {showShowroom && (
        <section className="rd-container py-12">
          <SectionHeading eyebrow="At our showroom" title="Free services, events & showroom offers" description="Visit us on 120 Feet Road — claim an offer below and we’ll call you to fix a time." />
          {showroom.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {showroom.map((o) => (
                <ShowroomOfferCard key={o.id} offer={o} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Gift className="size-10" />} title="No showroom offers right now" text="Check back soon — or call us, we may have something for you." />
          )}
        </section>
      )}

      {showCars && (
        <section className={`py-12 ${showShowroom ? 'border-t border-border bg-white' : ''}`}>
          <div className="rd-container">
            <SectionHeading
              eyebrow="Car deals"
              title="Spotlight cars & price drops"
              action={deals.length ? { href: '/buy-cars?deals=1&sort=discount', label: 'See all discounted cars' } : undefined}
            />
            {carOffers.length > 0 && (
              <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {carOffers.map((o) => (
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
                    tag={o.highlight || 'Car deal'}
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
            )}
            {deals.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {deals.slice(0, tab === 'cars' ? 12 : 6).map((c) => (
                  <CarCard key={c.id} car={c} />
                ))}
              </div>
            ) : (
              !carOffers.length && <EmptyState icon={<CarFront className="size-10" />} title="No car deals right now" text="New price drops are added every week." />
            )}
          </div>
        </section>
      )}
      <ContactCTA />
    </>
  );
}
