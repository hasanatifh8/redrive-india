'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CarFront, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Settings, Tag, TicketPercent, X } from 'lucide-react';
import { logout } from '@/app/admin/actions';

const LINKS = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/admin/cars', label: 'Cars', Icon: CarFront },
  { href: '/admin/leads', label: 'Leads', Icon: Inbox, badge: 'leads' as const },
  { href: '/admin/referrals', label: 'Referral codes', Icon: TicketPercent },
  { href: '/admin/offers', label: 'Offers', Icon: Tag },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function AdminNav({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {LINKS.map(({ href, label, Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition ${active ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Icon className="size-[18px]" />
            {label}
            {badge && newLeads > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-white text-brand' : 'bg-brand text-white'}`}>{newLeads}</span>
            )}
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-[18px]" />
          View website
        </a>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="size-[18px]" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink px-4 lg:hidden">
        <img src="/images/logo-light.png" alt="REDRIVE INDIA" className="h-9" />
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-white" aria-label="Menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && <div className="fixed inset-0 top-14 z-40 flex flex-col bg-ink lg:hidden">{nav}</div>}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <img src="/images/logo-light.png" alt="REDRIVE INDIA" className="h-10" />
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white/70 uppercase">Admin</span>
        </div>
        {nav}
      </aside>
    </>
  );
}
