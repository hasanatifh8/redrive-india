'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Search, TrendingUp, X } from 'lucide-react';
import { budgetLabel, parseQuery, POPULAR_SEARCHES, searchCars, type SearchItem } from '@/lib/search';
import { formatKm, formatPrice } from '@/lib/pricing';

type Props = {
  items: SearchItem[] | null; // null while loading
  value: string;
  onChange: (v: string) => void;
  /** Called for "see all results" / Enter on the query itself. */
  onSubmit: (q: string) => void;
  autoFocus?: boolean;
  /** "inline" = dropdown under the box (homepage); "panel" = results always shown below (header window). */
  mode?: 'inline' | 'panel';
  placeholder?: string;
  onNavigate?: () => void;
};

export default function CarSearchBox({ items, value, onChange, onSubmit, autoFocus, mode = 'inline', placeholder, onNavigate }: Props) {
  const router = useRouter();
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();
  const input = useRef<HTMLInputElement>(null);

  const q = value.trim();
  const parsed = useMemo(() => parseQuery(q), [q]);
  const matches = useMemo(() => (items && q ? searchCars(items, q) : []), [items, q]);
  const top = matches.slice(0, 5);
  const budget = budgetLabel(parsed.min, parsed.max);

  // Keyboard options: [see-all, ...top cars] when typing; popular searches when empty.
  const options: { kind: 'all' | 'car' | 'popular'; label: string; car?: SearchItem }[] = q
    ? [{ kind: 'all', label: q }, ...top.map((c) => ({ kind: 'car' as const, label: c.model, car: c }))]
    : POPULAR_SEARCHES.map((p) => ({ kind: 'popular' as const, label: p }));

  const open = mode === 'panel' || focused;

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return onSubmit(q);
    if (o.kind === 'car' && o.car) {
      onNavigate?.();
      router.push(`/cars/${o.car.slug}`);
    } else if (o.kind === 'popular') {
      onChange(o.label);
      onSubmit(o.label);
    } else onSubmit(q);
    setFocused(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!q && !open) return;
      choose(active);
    } else if (e.key === 'Escape') {
      if (q) onChange('');
      else input.current?.blur();
    }
  };

  const optionCls = (i: number) => `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${active === i ? 'bg-brand-soft/70' : 'hover:bg-page'}`;

  const panel = (
    <div
      id={listId}
      role="listbox"
      className={
        mode === 'inline'
          ? 'animate-rd-fade absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-[0_24px_48px_-16px_rgba(16,18,24,0.35)]'
          : 'max-h-[60vh] overflow-y-auto p-2'
      }
      onMouseDown={(e) => e.preventDefault()} // keep focus in the input while clicking
    >
      {q ? (
        <>
          <button type="button" role="option" aria-selected={active === 0} onMouseEnter={() => setActive(0)} onClick={() => choose(0)} className={optionCls(0)}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
              <Search className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">
                See all results for “{q}”
              </span>
              <span className="block text-[12px] text-muted-foreground">
                {items === null ? 'Searching…' : `${matches.length} car${matches.length === 1 ? '' : 's'} found`}
                {budget && ` · Budget: ${budget}`}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          {items === null && (
            <p className="flex items-center gap-2 px-3 py-4 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading cars…
            </p>
          )}

          {top.length > 0 && <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Top matches</p>}
          {top.map((c, idx) => {
            const i = idx + 1;
            return (
              <button key={c.id} type="button" role="option" aria-selected={active === i} onMouseEnter={() => setActive(i)} onClick={() => choose(i)} className={optionCls(i)}>
                {c.image ? (
                  <img src={c.image} alt="" className="h-11 w-16 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] text-white/60">No photo</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[14px] leading-snug font-semibold text-ink">
                    {c.year} {c.brand} {c.model}
                  </span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {c.variant} · {formatKm(c.km)} · {c.fuel}
                  </span>
                </span>
                <span className="shrink-0 text-[14px] font-semibold text-ink">{formatPrice(c.final)}</span>
              </button>
            );
          })}

          {items !== null && matches.length === 0 && (
            <div className="px-3 py-4">
              <p className="text-[14px] font-medium text-ink">No cars match “{q}”.</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Try a brand, a model or a budget like “under 10 lakh”. New cars arrive every week.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="flex items-center gap-1.5 px-3 pt-2 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <TrendingUp className="size-3.5" /> Popular searches
          </p>
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            {POPULAR_SEARCHES.map((p, i) => (
              <button
                key={p}
                type="button"
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`h-8 rounded-full border px-3 text-[13px] font-medium transition ${active === i ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink hover:border-brand'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder ?? 'Search by brand, model or budget — e.g. “Creta”, “SUV under 15 lakh”'}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(0);
          }}
          onFocus={() => {
            clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => (blurTimer.current = setTimeout(() => setFocused(false), 120))}
          onKeyDown={onKey}
          className="h-13 w-full rounded-xl border border-input bg-white pr-11 pl-12 text-[15px] text-ink transition outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/10 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {open && panel}
    </div>
  );
}
