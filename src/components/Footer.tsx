import Link from 'next/link';
import { CarFront, Clock, MapPin, Phone } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { DEFAULT_WA_TEXT, telHref, waHref, type SiteSettings } from '@/lib/settings-defaults';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './BrandIcons';

const SERVICES = [
  { label: 'Buy Pre-Owned Cars', href: '/buy-cars' },
  { label: 'Sell Your Car', href: '/sell-your-car' },
  { label: 'Car Exchange', href: '/exchange' },
  { label: 'Used Car Inventory', href: '/buy-cars' },
  { label: 'Vehicle Enquiries', href: '/contact' },
  { label: 'Test Drive Requests', href: '/contact?type=Test%20Drive' },
];

const linkCls = 'transition-colors duration-150 hover:text-white';
const socialCls = 'flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150';

export default function Footer({ settings: s }: { settings: SiteSettings }) {
  return (
    <>
      <footer className="relative overflow-hidden bg-ink text-white/70" data-testid="site-footer">
        <div className="rd-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="rd-container relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div>
            <img src="/images/logo-light.png" alt="REDRIVE INDIA logo" className="h-14 w-auto select-none" draggable={false} />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed">
              Sale | Purchase | Exchange of Pre-Owned Cars. <span className="text-white">Drive Your Dream.</span>
            </p>
            <div className="mt-5 flex gap-2">
              <a href={s.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className={`${socialCls} hover:bg-brand`}>
                <InstagramIcon />
              </a>
              {s.facebookUrl && (
                <a href={s.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className={`${socialCls} hover:bg-[#1877F2]`}>
                  <FacebookIcon />
                </a>
              )}
              <a href={waHref(s)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className={`${socialCls} hover:bg-[#25D366]`}>
                <WhatsAppIcon />
              </a>
              <a href={telHref(s.phonePrimary)} aria-label="Call" className={`${socialCls} hover:bg-brand`}>
                <Phone className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-semibold tracking-[0.14em] text-white uppercase">Navigate</h4>
            <ul className="flex flex-col gap-2.5 text-[14px]">
              {[...NAV_LINKS, { href: '/faq', label: 'FAQ' }].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-semibold tracking-[0.14em] text-white uppercase">Services</h4>
            <ul className="flex flex-col gap-2.5 text-[14px]">
              {SERVICES.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className={linkCls}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[13px] font-semibold tracking-[0.14em] text-white uppercase">Visit &amp; Contact</h4>
            <ul className="flex flex-col gap-3 text-[14px]">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#FF6B7F]" />
                <span>{s.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#FF6B7F]" />
                <span className="flex flex-col">
                  <a href={telHref(s.phonePrimary)} className="text-white transition-colors duration-150 hover:text-[#FF6B7F]">
                    {s.phonePrimary}
                  </a>
                  <a href={telHref(s.phoneAlternate)} className={linkCls}>
                    {s.phoneAlternate}
                  </a>
                </span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-[#FF6B7F]" />
                <span className="flex flex-col">
                  <span>
                    Monday – Saturday: <span className="text-white/50">{s.hoursWeekdays}</span>
                  </span>
                  <span>
                    Sunday: <span className="text-white/50">{s.hoursSunday}</span>
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="rd-container flex flex-col gap-3 py-5 text-[12px] md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} {s.businessName}, Prayagraj. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className={linkCls}>Privacy Policy</Link>
              <Link href="/terms" className={linkCls}>Terms of Use</Link>
              <Link href="/faq" className={linkCls}>FAQ</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <a href={telHref(s.phonePrimary)} className="flex h-14 flex-col items-center justify-center gap-0.5 bg-brand text-[12px] font-semibold text-white">
          <Phone className="size-4" />
          Call Now
        </a>
        <a
          href={waHref(s, DEFAULT_WA_TEXT)}
          target="_blank"
          rel="noreferrer"
          className="flex h-14 flex-col items-center justify-center gap-0.5 bg-[#25D366] text-[12px] font-semibold text-white"
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
        <Link href="/buy-cars" className="flex h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold text-ink">
          <CarFront className="size-4" />
          View Cars
        </Link>
      </div>
    </>
  );
}
