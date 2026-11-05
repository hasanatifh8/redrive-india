import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { getSettings } from '@/lib/data';
import { DEFAULT_WA_TEXT, telHref, waHref } from '@/lib/settings-defaults';
import SellForm from '@/components/SellForm';
import ContactCTA from '@/components/ContactCTA';
import { WhatsAppIcon } from '@/components/BrandIcons';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Sell Your Car',
  description: 'Sell your car to REDRIVE INDIA, Prayagraj. Share details and photos — we call you, inspect in person and agree a fair price.',
};

const STEPS = [
  'Share your car’s details & photos',
  'We call you to understand the car',
  'Bring the car for an in-person inspection',
  'Agree on a price and complete paperwork',
];

export default async function SellPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Sell your car"
        title={`Sell your car to ${s.businessName}`}
        description="Tell us about your car and upload a few photos. Our team will call you to discuss a fair price and inspect the car in person."
        image="/images/showroom-cars.jpg"
      />
      <div className="rd-container grid items-start gap-6 py-10 lg:grid-cols-[1fr_300px]">
        <SellForm />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-32">
          <div className="rd-card overflow-hidden">
            <img src="/images/showroom-cars.jpg" alt="Cars at the REDRIVE INDIA showroom" className="aspect-[16/9] w-full object-cover" />
            <div className="p-5">
              <h2 className="text-[16px] font-semibold text-ink">How selling works</h2>
              <ol className="mt-4 flex flex-col gap-3.5">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-[14px] text-ink-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="rd-card flex flex-col gap-2 p-5">
            <p className="text-[14px] font-semibold text-ink">Prefer to talk?</p>
            <a href={telHref(s.phonePrimary)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-semibold text-white hover:bg-brand-dark">
              <Phone className="size-4" /> Call {s.phonePrimary}
            </a>
            <a href={waHref(s, DEFAULT_WA_TEXT)} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-[14px] font-semibold text-white">
              <WhatsAppIcon /> WhatsApp us
            </a>
          </div>
        </aside>
      </div>
      <ContactCTA />
    </>
  );
}
