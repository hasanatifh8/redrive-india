'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, ChevronDown, X } from 'lucide-react';
import LeadForm from './LeadForm';
import OfferIcon from './OfferIcon';

export type ShowroomOffer = {
  id: number;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  terms: string;
  claimable: boolean;
  image: string | null;
  ctaLabel: string;
  ctaHref: string;
  validUntil: Date | null;
};

const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ShowroomOfferCard({ offer, compact = false }: { offer: ShowroomOffer; compact?: boolean }) {
  const [claiming, setClaiming] = useState(false);
  const daysLeft = offer.validUntil ? Math.ceil((offer.validUntil.getTime() - Date.now()) / 86400000) : null;

  useEffect(() => {
    if (!claiming) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setClaiming(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [claiming]);

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-[calc(var(--radius)*1.4)] bg-ink text-white shadow-[0_24px_48px_-28px_rgba(16,18,24,0.6)] transition-transform duration-300 hover:-translate-y-1">
        {/* Background: photo if provided, otherwise brand glow + dots */}
        {offer.image ? (
          <>
            <img src={offer.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/40" />
          </>
        ) : (
          <>
            <div className="rd-dots absolute inset-0 opacity-70" />
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-brand/40 blur-[70px] transition-opacity duration-500 group-hover:opacity-90" />
          </>
        )}

        <div className="relative flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/40">
              <OfferIcon name={offer.icon} className="size-6" />
            </span>
            {offer.highlight && (
              <span className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 font-heading text-[18px] leading-none font-bold tracking-wide text-amber-300 uppercase">
                {offer.highlight}
              </span>
            )}
          </div>

          <p className="mt-5 text-[11px] font-semibold tracking-[0.18em] text-[#FF6B7F] uppercase">Showroom offer</p>
          <h3 className="mt-1 text-[20px] leading-snug font-semibold">{offer.title}</h3>
          {offer.description && <p className={`mt-2 text-[14px] leading-relaxed text-white/70 ${compact ? 'line-clamp-3' : ''}`}>{offer.description}</p>}

          <div className="mt-auto pt-5">
            {offer.validUntil && (
              <p className="mb-3 flex items-center gap-1.5 text-[12px] text-white/60">
                <CalendarClock className="size-3.5" />
                Valid till {fmtDate(offer.validUntil)}
                {daysLeft != null && daysLeft <= 7 && daysLeft >= 0 && (
                  <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                    {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                  </span>
                )}
              </p>
            )}

            {offer.terms && !compact && (
              <details className="group/terms mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between text-white/70">
                  Terms &amp; conditions
                  <ChevronDown className="size-4 transition-transform group-open/terms:rotate-180" />
                </summary>
                <p className="mt-2 whitespace-pre-line text-white/60">{offer.terms}</p>
              </details>
            )}

            <div className="flex flex-wrap gap-2">
              {offer.claimable && (
                <button
                  type="button"
                  onClick={() => setClaiming(true)}
                  className="flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-[14px] font-semibold text-ink transition hover:bg-brand hover:text-white"
                >
                  Claim offer <ArrowRight className="size-4" />
                </button>
              )}
              {offer.ctaHref && (
                <Link
                  href={offer.ctaHref}
                  className="flex h-10 items-center gap-1.5 rounded-lg border border-white/25 px-4 text-[14px] font-semibold text-white transition hover:border-white/60"
                >
                  {offer.ctaLabel || 'Learn more'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>

      {claiming && (
        <div className="animate-rd-fade fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setClaiming(false)}>
          <div role="dialog" aria-modal="true" aria-label={`Claim: ${offer.title}`} className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-page sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-hidden bg-ink p-5 text-white">
              <div className="rd-dots absolute inset-0" />
              <button type="button" onClick={() => setClaiming(false)} aria-label="Close" className="absolute top-3 right-3 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                <X className="size-5" />
              </button>
              <div className="relative flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand">
                  <OfferIcon name={offer.icon} className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#FF6B7F] uppercase">Claim offer {offer.highlight && `· ${offer.highlight}`}</p>
                  <p className="text-[17px] leading-snug font-semibold">{offer.title}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <LeadForm
                title="Your details"
                type="offer"
                submitLabel="Claim this offer"
                hidden={{ offer: offer.title }}
                fields={[
                  { name: 'name', label: 'Your name', required: true, half: true },
                  { name: 'phone', label: 'Mobile number', type: 'tel', required: true, half: true },
                  { name: 'preferredDate', label: 'Preferred date', type: 'date', half: true },
                  { name: 'preferredTime', label: 'Preferred time', type: 'select', options: ['Morning (10–1)', 'Afternoon (1–4)', 'Evening (4–7)'], half: true },
                  { name: 'carDetails', label: 'Your car (if relevant)', placeholder: 'e.g. 2018 Swift VXi' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
