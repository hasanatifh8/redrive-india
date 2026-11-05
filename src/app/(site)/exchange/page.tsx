import type { Metadata } from 'next';
import { CarFront, Repeat2, ScanSearch, Search } from 'lucide-react';
import { BRANDS } from '@/lib/constants';
import { getPublicCars } from '@/lib/data';
import ContactCTA from '@/components/ContactCTA';
import LeadForm from '@/components/LeadForm';
import Steps from '@/components/Steps';
import { PageHero, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Exchange Your Car', description: 'Exchange your old car for a better one at REDRIVE INDIA, Prayagraj.' };

export default async function ExchangePage() {
  const cars = await getPublicCars();
  return (
    <>
      <PageHero
        eyebrow="Exchange"
        title="Upgrade by exchanging your current car"
        description="Bring your car to the yard, pick any car you like, and we’ll adjust your car’s value against it — one visit, one deal."
      />
      <div className="rd-container grid gap-10 py-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="How exchange works" title="From your car to your next car" />
          <Steps
            steps={[
              { Icon: Search, title: 'Choose your next car', text: 'Browse our yard online or in person and shortlist the car you want.' },
              { Icon: ScanSearch, title: 'Evaluate your current car', text: 'We inspect your car at the showroom and agree its exchange value openly.' },
              { Icon: Repeat2, title: 'Pay only the difference', text: 'Your car’s value is adjusted against the new car’s price.' },
              { Icon: CarFront, title: 'Drive home the upgrade', text: 'We handle the paperwork guidance for both cars before handover.' },
            ]}
          />
        </div>
        <LeadForm
          title="Start an exchange"
          type="exchange"
          showReferral
          submitLabel="Request exchange evaluation"
          fields={[
            { name: 'name', label: 'Your name', required: true, half: true },
            { name: 'phone', label: 'Mobile number', type: 'tel', required: true, half: true },
            { name: 'brand', label: 'Your car — brand', type: 'select', options: BRANDS, required: true, half: true },
            { name: 'model', label: 'Your car — model & year', required: true, half: true, placeholder: 'e.g. i20 2018' },
            { name: 'km', label: 'Kilometres driven', type: 'number', half: true },
            { name: 'interest', label: 'Interested in', type: 'select', options: [...cars.map((c) => `${c.year} ${c.brand} ${c.model}`), 'Not decided yet'], half: true },
            { name: 'notes', label: 'Anything else?', type: 'textarea' },
          ]}
        />
      </div>
      <ContactCTA />
    </>
  );
}
