import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] leading-tight font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

export function Field({ label, htmlFor, hint, children, className = '' }: { label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Card({ title, description, children, className = '', actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rd-card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[16px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export const btn = {
  primary: 'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60',
  dark: 'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-semibold text-white transition hover:bg-ink-2 disabled:opacity-60',
  outline: 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-[14px] font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-60',
  ghost: 'inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted hover:text-ink',
  danger: 'inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-brand transition hover:bg-brand-soft',
};
