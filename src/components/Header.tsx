'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, MapPin, Menu, Phone, Search, X } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { DEFAULT_WA_TEXT, telHref, waHref } from '@/lib/settings-defaults';
import { useSettings } from './SettingsProvider';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './BrandIcons';
import { useShortlist } from './ShortlistProvider';

const iconBtn =
  'relative flex size-10 items-center justify-center rounded-full text-ink transition-[background-color,color] duration-150 hover:bg-muted hover:text-brand';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist } = useShortlist();
  const s = useSettings();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40" data-testid="site-header">
      {/* Top bar */}
      <div className="hidden bg-ink text-[13px] text-white/75 md:block">
        <div className="rd-container flex h-9 items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-[#FF6B7F]" />
            {s.address}
          </span>
          <div className="flex items-center gap-5">
            <a href={telHref(s.phonePrimary)} className="transition-colors duration-150 hover:text-white">
              {s.phonePrimary}
            </a>
            <a href={telHref(s.phoneAlternate)} className="transition-colors duration-150 hover:text-white">
              {s.phoneAlternate}
            </a>
            <a
              href={s.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition-colors duration-150 hover:text-white"
            >
              <InstagramIcon className="size-3.5" />
              {s.instagramHandle}
            </a>
            {s.facebookUrl && (
              <a
                href={s.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 transition-colors duration-150 hover:text-white"
              >
                <FacebookIcon className="size-3.5" />
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-white/92 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="rd-container flex h-16 items-center gap-4">
          <Link href="/" className="shrink-0" aria-label="REDRIVE INDIA home">
            <img src="/images/logo-dark.png" alt="REDRIVE INDIA logo" className="h-11 w-auto select-none" draggable={false} />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative rounded-md px-2.5 py-2 text-[14px] font-medium transition-colors duration-150 xl:px-3 ${
                    active ? 'text-brand' : 'text-ink-2 hover:text-brand'
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-2.5 -bottom-[13px] h-0.5 origin-left bg-brand transition-transform duration-200 ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button type="button" className={iconBtn} aria-label="Search cars" onClick={() => router.push('/buy-cars')}>
              <Search className="size-[18px]" />
            </button>
            <Link href="/wishlist" className={iconBtn} aria-label="Wishlist">
              <Heart className="size-[18px]" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <a
              href={waHref(s, DEFAULT_WA_TEXT)}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp REDRIVE INDIA"
              className="ml-1 hidden h-10 items-center gap-2 rounded-full border border-[#25D366]/40 px-3 text-[14px] font-medium text-[#128C4A] transition-[background-color,border-color] duration-150 hover:border-[#25D366] hover:bg-[#25D366]/10 md:flex"
            >
              <WhatsAppIcon />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>
            <a
              href={telHref(s.phonePrimary)}
              className="ml-1 hidden h-10 items-center gap-2 rounded-full bg-brand px-4 text-[14px] font-semibold text-white shadow-sm shadow-brand/30 transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98] md:flex"
            >
              <Phone className="size-4" />
              <span className="hidden xl:inline">{s.phonePrimary}</span>
              <span className="xl:hidden">Call</span>
            </a>
            <button
              type="button"
              className={`${iconBtn} lg:hidden`}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <nav className="animate-rd-fade border-t border-border bg-white lg:hidden" aria-label="Mobile">
            <div className="rd-container flex flex-col py-3">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2.5 text-[15px] font-medium ${
                    isActive(l.href) ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-muted'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/wishlist" className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-muted">
                Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
