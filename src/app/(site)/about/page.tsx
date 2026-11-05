import type { Metadata } from 'next';
import { Handshake, ScanSearch, ShieldCheck, SmilePlus } from 'lucide-react';
import Gallery from '@/components/Gallery';
import ContactCTA from '@/components/ContactCTA';
import { PageHero, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'About Us' };

const VALUES = [
  { Icon: ShieldCheck, title: 'Verified Cars', text: 'Every car is checked by our team before it reaches the yard.' },
  { Icon: Handshake, title: 'Fair Deals', text: 'Prices are discussed openly, face to face.' },
  { Icon: ScanSearch, title: 'Transparent Process', text: 'Clear paperwork guidance from enquiry to handover.' },
  { Icon: SmilePlus, title: 'Customer Satisfaction', text: 'Visit, call or WhatsApp any time you need help.' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A local dealership on 120 Feet Road"
        description="REDRIVE INDIA buys, sells and exchanges pre-owned cars from its yard in Kalindipuram, Prayagraj."
      />
      <section className="rd-container grid items-center gap-10 py-14 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Our story" title="Your Dream Car, Our Commitment" className="mb-4" />
          <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
            <p>
              REDRIVE INDIA is a pre-owned car dealership on 120 Feet Road in Kalindipuram, Prayagraj. We help people find a good used
              car, sell their current car for a fair price, or exchange it for an upgrade — all in one place.
            </p>
            <p>
              Every customer is welcome to visit the yard, inspect the cars in person, and ask about papers and history before deciding.
            </p>
          </div>
        </div>
        <img src="/images/owner-yard.jpg" alt="At the REDRIVE INDIA yard, Kalindipuram" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
      </section>

      <section className="border-y border-border bg-white py-14">
        <div className="rd-container">
          <SectionHeading eyebrow="What we stand for" title="The promise on our signboard" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ Icon, title, text }) => (
              <div key={title} className="rd-card p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[18px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rd-container py-14">
        <SectionHeading eyebrow="Dealership gallery" title="Visit our Kalindipuram yard" />
        <Gallery />
      </section>
      <ContactCTA />
    </>
  );
}
