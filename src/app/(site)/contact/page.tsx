import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getPublicCars, getSettings } from '@/lib/data';
import { DEFAULT_WA_TEXT, telHref, waHref } from '@/lib/settings-defaults';
import LeadForm from '@/components/LeadForm';
import LocationCard from '@/components/LocationCard';
import { InstagramIcon, WhatsAppIcon } from '@/components/BrandIcons';
import { PageHero } from '@/components/ui';

export const metadata: Metadata = { title: 'Contact', description: 'Call, WhatsApp or visit REDRIVE INDIA on 120 Feet Road, Kalindipuram, Prayagraj.' };

const ENQUIRY_TYPES = ['General Enquiry', 'Test Drive', 'Buy a Car', 'Sell My Car', 'Exchange', 'Car Loan'];

export default async function ContactPage({ searchParams }: { searchParams: { type?: string } }) {
  const [s, cars] = await Promise.all([getSettings(), getPublicCars()]);
  const preset = ENQUIRY_TYPES.includes(searchParams.type ?? '') ? searchParams.type : undefined;

  const items = [
    { Icon: MapPin, label: 'Visit', value: s.address, href: s.mapsUrl },
    { Icon: Phone, label: 'Call', value: s.phonePrimary, href: telHref(s.phonePrimary) },
    s.phoneAlternate && { Icon: Phone, label: 'Alternate', value: s.phoneAlternate, href: telHref(s.phoneAlternate) },
    { Icon: WhatsAppIcon, label: 'WhatsApp', value: s.phonePrimary, href: waHref(s, DEFAULT_WA_TEXT) },
    s.email && { Icon: Mail, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    s.instagramHandle && { Icon: InstagramIcon, label: 'Instagram', value: s.instagramHandle, href: s.instagramUrl },
    { Icon: Clock, label: 'Hours', value: `Mon–Sat: ${s.hoursWeekdays} · Sun: ${s.hoursSunday}` },
  ].filter(Boolean) as { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow="Contact" title={`Talk to ${s.businessName}`} description="Call, WhatsApp, or send us an enquiry — or just visit the yard on 120 Feet Road." />
      <div className="rd-container grid gap-8 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {items.map(({ Icon, label, value, href }) => {
            const body = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] text-muted-foreground">{label}</span>
                  <span className="text-[15px] font-semibold break-words text-ink">{value}</span>
                </span>
              </>
            );
            const cls = 'rd-card flex items-center gap-3 p-4';
            return href ? (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`${cls} transition-colors hover:border-brand/40`}>
                {body}
              </a>
            ) : (
              <div key={label} className={cls}>
                {body}
              </div>
            );
          })}
        </div>
        <LeadForm
          title="Send an enquiry"
          type={preset === 'Test Drive' ? 'test_drive' : 'general'}
          showReferral
          fields={[
            { name: 'name', label: 'Your name', required: true, half: true },
            { name: 'phone', label: 'Mobile number', type: 'tel', required: true, half: true },
            { name: 'enquiry', label: 'Enquiry type', type: 'select', options: ENQUIRY_TYPES, half: true, defaultValue: preset, required: true },
            { name: 'car', label: 'Car (optional)', type: 'select', options: cars.map((c) => `${c.year} ${c.brand} ${c.model}`), half: true },
            { name: 'message', label: 'Message', type: 'textarea' },
          ]}
        />
      </div>
      <section className="rd-container pb-16">
        <LocationCard showContactLink={false} />
      </section>
    </>
  );
}
