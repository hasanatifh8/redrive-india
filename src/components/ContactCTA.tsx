import { Phone } from 'lucide-react';
import { getSettings } from '@/lib/data';
import { DEFAULT_WA_TEXT, telHref, waHref } from '@/lib/settings-defaults';
import { WhatsAppIcon } from './BrandIcons';

export default async function ContactCTA() {
  const s = await getSettings();
  return (
    <section className="relative overflow-hidden bg-brand-dark text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand to-brand-dark opacity-80" aria-hidden="true" />
      <div className="animate-rd-sweep absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/5" aria-hidden="true" />
      <div className="rd-container relative flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[24px] font-semibold md:text-[28px]">Talk to {s.businessName} today</h2>
          <p className="mt-1.5 text-[15px] text-white/80">Questions about a car, a test drive, selling or exchange — just call.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a
            href={telHref(s.phonePrimary)}
            className="flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-semibold text-brand-dark transition-transform duration-150 hover:scale-[1.02]"
          >
            <Phone className="size-4" />
            Call {s.phonePrimary}
          </a>
          {s.phoneAlternate && (
            <a
              href={telHref(s.phoneAlternate)}
              className="flex h-11 items-center gap-2 rounded-lg border border-white/40 px-5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              <Phone className="size-4" />
              Alternate {s.phoneAlternate}
            </a>
          )}
          <a
            href={waHref(s, DEFAULT_WA_TEXT)}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-5 text-[14px] font-semibold text-white transition-transform duration-150 hover:scale-[1.02]"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
