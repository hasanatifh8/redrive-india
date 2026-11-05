import type { Metadata } from 'next';
import { Tag } from 'lucide-react';
import { getActiveOffers, getPublicCars } from '@/lib/data';
import { formatPrice } from '@/lib/pricing';
import ContactCTA from '@/components/ContactCTA';
import CarCard from '@/components/CarCard';
import { EmptyState, OfferCard, PageHero, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Offers & Deals', description: 'Current offers and discounted pre-owned cars at REDRIVE INDIA, Prayagraj.' };

export default async function OffersPage() {
  const [offers, cars] = await Promise.all([getActiveOffers(), getPublicCars()]);
  const deals = cars.filter((c) => c.saving > 0).sort((a, b) => b.saving - a.saving);

  return (
    <>
      <PageHero eyebrow="Special offers" title="Current offers & price drops" description="Showroom offers and discounted cars at our Kalindipuram yard." />
      <div className="rd-container py-14">
        {offers.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
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
        ) : (
          <EmptyState icon={<Tag className="size-10" />} title="No offers running right now" text="Check back soon, or call us — we may have a deal for you." />
        )}
      </div>

      {deals.length > 0 && (
        <section className="border-t border-border bg-white py-14">
          <div className="rd-container">
            <SectionHeading eyebrow="Price drops" title="Discounted cars" action={{ href: '/buy-cars?deals=1&sort=discount', label: 'See all deals' }} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {deals.slice(0, 6).map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          </div>
        </section>
      )}
      <ContactCTA />
    </>
  );
}
