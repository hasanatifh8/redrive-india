import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Info, Tag } from 'lucide-react';

export function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
  action,
  className = 'mb-8',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="max-w-2xl">
        <span className="rd-eyebrow mb-3">{eyebrow}</span>
        <h2 className={`text-[24px] leading-tight font-semibold md:text-[28px] ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
        {description && (
          <p className={`mt-2 text-[15px] leading-relaxed ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand transition-colors duration-150 hover:text-brand-dark"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function DemoNotice({ children, className = 'mb-6' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900 ${className}`}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Dark hero band used at the top of inner pages. */
export function PageHero({ eyebrow, title, description, image }: { eyebrow: string; title: string; description?: string; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {image && (
        <>
          <img src={image} alt="" aria-hidden="true" className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-25 md:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" aria-hidden="true" />
        </>
      )}
      <div className="rd-dots absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-brand/25 blur-[120px]" aria-hidden="true" />
      <div className="rd-container relative py-14 md:py-16">
        <span className="animate-rd-rise rd-eyebrow">{eyebrow}</span>
        <h1 className="animate-rd-rise mt-3 text-[30px] leading-[1.15] font-semibold [animation-delay:60ms] md:text-[36px]">{title}</h1>
        {description && (
          <p className="animate-rd-rise mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70 [animation-delay:120ms]">{description}</p>
        )}
      </div>
    </section>
  );
}

export function OfferCard({
  media,
  title,
  text,
  price,
  oldPrice,
  tag = 'Offer',
  href,
  cta,
  validUntil,
}: {
  media: ReactNode;
  title: string;
  text: string;
  price?: string;
  oldPrice?: string;
  tag?: string;
  href?: string;
  cta?: string;
  validUntil?: Date | null;
}) {
  return (
    <div className="rd-card group flex flex-col overflow-hidden">
      <div className="overflow-hidden">{media}</div>
      <div className="flex flex-1 flex-col p-5">
        <span className="flex w-fit items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
          <Tag className="size-3" />
          {tag}
        </span>
        <h3 className="mt-3 text-[17px] font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 flex-1 text-[14px] text-muted-foreground">{text}</p>
        {price && (
          <p className="mt-3 text-[14px] font-semibold text-ink">
            {price} {oldPrice && <span className="ml-1 font-normal text-muted-foreground line-through">{oldPrice}</span>}
          </p>
        )}
        {validUntil && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            Valid till {validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        {href && (
          <Link href={href} className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-brand hover:text-brand-dark">
            {cta || 'View details'}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rd-card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
      {text && <p className="max-w-md text-[14px] text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}
