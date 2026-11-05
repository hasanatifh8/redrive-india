import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import ContactCTA from '@/components/ContactCTA';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = { title: 'FAQ' };

const FAQS = [
  { q: 'Where is REDRIVE INDIA located?', a: 'Our yard and showroom are on 120 Feet Road, Kalindipuram, Prayagraj, Uttar Pradesh.' },
  { q: 'Can I inspect a car before buying?', a: 'Yes. Visit the yard, inspect the car yourself and ask to see its papers before you decide.' },
  { q: 'How do I book a test drive?', a: 'Open any car and use “Book a test drive”, or call / WhatsApp us on 99188 16493.' },
  { q: 'How do you value my car when I sell or exchange?', a: 'We inspect the car at the showroom and discuss the price openly, face to face, based on its condition, year and kilometres.' },
  { q: 'Do you help with RC transfer and paperwork?', a: 'Yes. We guide you through the paperwork from enquiry to handover.' },
  { q: 'Do you offer car loans?', a: 'Yes, we help arrange finance through partner banks and NBFCs. Use the EMI calculator on any car page for an estimate.' },
  { q: 'How do referral codes work?', a: 'If someone referred you, enter their code when booking a test drive or sending an enquiry. Valid codes give you an extra discount on your purchase.' },
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" />
      <div className="rd-container max-w-3xl py-14">
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="rd-card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-[17px] font-semibold text-ink">
                {q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <ContactCTA />
    </>
  );
}
