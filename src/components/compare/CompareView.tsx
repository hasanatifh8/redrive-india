'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  IndianRupee,
  LayoutList,
  Link2,
  ListChecks,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import type { CarView } from '@/lib/data';
import { emi, formatKm, formatPrice, formatRupees } from '@/lib/pricing';
import { modelYearLabel, withUnit } from '@/lib/constants';
import { CarImage } from '@/components/CarCard';
import { useShortlist } from '@/components/ShortlistProvider';
import { useSettings } from '@/components/SettingsProvider';

const MAX = 3;

/* ------------------------------------------------------------------ helpers */

const num = (s: string | number | null | undefined) => {
  if (typeof s === 'number') return s;
  const m = String(s ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};
const ownerRank = (o: string) => num(o) ?? 9;
const avgInspection = (c: CarView) => (c.inspection.length ? c.inspection.reduce((a, b) => a + b.score, 0) / c.inspection.length : null);

type Row = {
  label: string;
  value: (c: CarView) => ReactNode;
  /** Plain text used for the "only differences" filter and empty checks. */
  text: (c: CarView) => string;
  /** Higher-is-better score; omitted rows never get a "Best" badge. */
  score?: (c: CarView) => number | null;
  bestLabel?: string;
};
type Section = { id: string; title: string; Icon: typeof Gauge; rows: Row[]; kind?: 'features' };

/** Ids of the cars that win a row (ties share it). Null when there's nothing to compare. */
function winners(row: Row, cars: CarView[]) {
  if (!row.score || cars.length < 2) return null;
  const scores = cars.map((c) => row.score!(c));
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length < 2) return null;
  const best = Math.max(...valid);
  if (valid.every((s) => s === best)) return null; // all equal: nobody "wins"
  return new Set(cars.filter((_, i) => scores[i] === best).map((c) => c.id));
}

/* ------------------------------------------------------------------ component */

export default function CompareView({ initialCars, allCars }: { initialCars: CarView[]; allCars: CarView[] }) {
  const pathname = usePathname();
  const settings = useSettings();
  const { compare, setCompare } = useShortlist();
  // From the link (?ids=…) first; otherwise whatever is already in the compare tray.
  const [cars, setCars] = useState<CarView[]>(() => (initialCars.length ? initialCars : compare).slice(0, MAX));
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [picker, setPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const headRef = useRef<HTMLDivElement>(null);

  // Keep the URL (shareable) and the floating compare tray in sync with what's on screen.
  useEffect(() => {
    const ids = cars.map((c) => c.id).join(',');
    // History API (not router) so changing cars doesn't re-fetch the page from the server.
    window.history.replaceState(null, '', ids ? `${pathname}?ids=${ids}` : pathname);
    setCompare(cars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  // Compact car bar once the big car headers scroll out of view.
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [cars.length]);

  const add = (c: CarView) => {
    setCars((list) => (list.length >= MAX || list.some((x) => x.id === c.id) ? list : [...list, c]));
    setPicker(false);
  };
  const remove = (id: number) => setCars((list) => list.filter((c) => c.id !== id));

  const rate = Number(settings.emiInterestRate) || 10.5;
  const monthly = (c: CarView) => emi(c.final * 0.8, rate, 60);

  const sections: Section[] = useMemo(() => {
    const featureNames = Array.from(new Set(cars.flatMap((c) => c.features))).sort((a, b) => a.localeCompare(b));
    const specLabels = Array.from(new Set(cars.flatMap((c) => c.specs.map((s) => s.label))));
    const areas = Array.from(new Set(cars.flatMap((c) => c.inspection.map((i) => i.area))));
    const spec = (c: CarView, label: string) => c.specs.find((s) => s.label === label)?.value ?? '';
    const engine = (c: CarView) => [c.engineType, c.engineCc ? `${c.engineCc.toLocaleString('en-IN')} cc` : ''].filter(Boolean).join(' · ');

    return [
      {
        id: 'price',
        title: 'Price & value',
        Icon: IndianRupee,
        rows: [
          { label: 'Price', value: (c) => <span className="font-heading text-[17px] font-semibold">{formatPrice(c.final)}</span>, text: (c) => String(c.final), score: (c) => -c.final, bestLabel: 'Lowest price' },
          { label: 'You save', value: (c) => (c.saving > 0 ? <span className="font-semibold text-emerald-700">{formatPrice(c.saving)}</span> : '—'), text: (c) => String(c.saving), score: (c) => (c.saving > 0 ? c.saving : null), bestLabel: 'Biggest saving' },
          { label: 'EMI from*', value: (c) => `${formatRupees(monthly(c))}/mo`, text: (c) => String(Math.round(monthly(c))), score: (c) => -monthly(c), bestLabel: 'Lowest EMI' },
        ],
      },
      {
        id: 'overview',
        title: 'Overview',
        Icon: LayoutList,
        rows: [
          { label: 'Model year', value: (c) => modelYearLabel(c.year, c.month), text: (c) => modelYearLabel(c.year, c.month), score: (c) => c.year * 12 + (c.month ?? 6), bestLabel: 'Newest' },
          { label: 'Kilometres', value: (c) => formatKm(c.km), text: (c) => String(c.km), score: (c) => -c.km, bestLabel: 'Least driven' },
          { label: 'Ownership', value: (c) => c.owner, text: (c) => c.owner, score: (c) => -ownerRank(c.owner), bestLabel: 'Fewest owners' },
          { label: 'Fuel', value: (c) => c.fuel, text: (c) => c.fuel },
          { label: 'Transmission', value: (c) => c.transmission, text: (c) => c.transmission },
          { label: 'Body type', value: (c) => c.bodyType, text: (c) => c.bodyType },
          { label: 'Seats', value: (c) => c.seats ?? '—', text: (c) => String(c.seats ?? '') },
          { label: 'Colour', value: (c) => c.color || '—', text: (c) => c.color },
          { label: 'Registration', value: (c) => c.registration || '—', text: (c) => c.registration },
          { label: 'Insurance', value: (c) => c.insuranceValidity || '—', text: (c) => c.insuranceValidity },
        ],
      },
      {
        id: 'engine',
        title: 'Engine & performance',
        Icon: Gauge,
        rows: [
          { label: 'Engine', value: (c) => engine(c) || '—', text: engine },
          { label: 'Max power', value: (c) => withUnit(c.power, 'bhp') || '—', text: (c) => c.power, score: (c) => num(c.power), bestLabel: 'Most powerful' },
          { label: 'Max torque', value: (c) => withUnit(c.torque, 'Nm') || '—', text: (c) => c.torque, score: (c) => num(c.torque), bestLabel: 'Most torque' },
          {
            label: 'Mileage / range',
            value: (c) => withUnit(c.mileage, c.fuel === 'Electric' ? 'km' : 'kmpl') || '—',
            text: (c) => c.mileage,
            // EV range and kmpl aren't comparable — only score like with like.
            score: (c) => (cars.every((x) => (x.fuel === 'Electric') === (c.fuel === 'Electric')) ? num(c.mileage) : null),
            bestLabel: 'Best mileage',
          },
          { label: 'Drivetrain', value: (c) => c.drivetrain.split(' ')[0] || '—', text: (c) => c.drivetrain },
        ],
      },
      {
        id: 'condition',
        title: 'Condition & inspection',
        Icon: ClipboardCheck,
        rows: [
          {
            label: 'Overall score',
            value: (c) => {
              const a = avgInspection(c);
              return a == null ? '—' : <ScoreBar score={a} bold />;
            },
            text: (c) => String(avgInspection(c) ?? ''),
            score: avgInspection,
            bestLabel: 'Best condition',
          },
          ...areas.map<Row>((area) => ({
            label: area,
            value: (c) => {
              const it = c.inspection.find((i) => i.area === area);
              return it ? <ScoreBar score={it.score} note={it.note} /> : '—';
            },
            text: (c) => String(c.inspection.find((i) => i.area === area)?.score ?? ''),
            score: (c) => c.inspection.find((i) => i.area === area)?.score ?? null,
          })),
        ],
      },
      {
        id: 'features',
        title: 'Features',
        Icon: ListChecks,
        kind: 'features',
        rows: [
          { label: 'Total features', value: (c) => <span className="font-semibold">{c.features.length}</span>, text: (c) => String(c.features.length), score: (c) => c.features.length || null, bestLabel: 'Most features' },
          ...featureNames.map<Row>((f) => ({
            label: f,
            value: (c) => (c.features.includes(f) ? <Tick /> : <Missing />),
            text: (c) => (c.features.includes(f) ? 'yes' : 'no'),
          })),
        ],
      },
      ...(specLabels.length
        ? [
            {
              id: 'more',
              title: 'More details',
              Icon: Sparkles,
              rows: specLabels.map<Row>((l) => ({ label: l, value: (c) => spec(c, l) || '—', text: (c) => spec(c, l) })),
            },
          ]
        : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars, rate]);

  // Rows with no data for any car are hidden; "only differences" also hides identical rows.
  const visibleRows = (s: Section) =>
    s.rows.filter((r) => {
      const texts = cars.map((c) => r.text(c));
      if (texts.every((t) => !t || t === '0' || t === 'no') && s.kind !== 'features') return false;
      if (onlyDiff && cars.length > 1 && texts.every((t) => t === texts[0])) return false;
      return true;
    });

  // "Best for" summary: which badges each car collected.
  const wins = useMemo(() => {
    const out = new Map<number, string[]>();
    for (const s of sections)
      for (const r of s.rows) {
        if (!r.bestLabel) continue;
        const w = winners(r, cars);
        w?.forEach((id) => out.set(id, [...(out.get(id) ?? []), r.bestLabel!]));
      }
    return out;
  }, [sections, cars]);

  const diffCount = useMemo(
    () => (cars.length < 2 ? 0 : sections.reduce((n, s) => n + s.rows.filter((r) => new Set(cars.map((c) => r.text(c))).size > 1).length, 0)),
    [sections, cars],
  );

  // Narrow label column + car columns on phones so ~2 cars are visible; full width on desktop.
  const cols = 'grid-cols-[96px_repeat(3,minmax(165px,1fr))] md:grid-cols-[minmax(150px,220px)_repeat(3,minmax(210px,1fr))]';
  const slots = Array.from({ length: MAX }, (_, i) => cars[i] ?? null);

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* -------------------------------------------------------------- empty state */
  if (!cars.length) {
    return (
      <div className="rd-container py-12">
        <div className="rd-card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <LayoutList className="size-7" />
          </span>
          <h2 className="text-[22px] font-semibold text-ink">Pick up to 3 cars to compare</h2>
          <p className="max-w-md text-[14px] text-muted-foreground">See price, condition, engine and features side by side — with the best value in each row highlighted.</p>
          <button type="button" onClick={() => setPicker(true)} className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-dark">
            <Plus className="size-4" /> Add a car
          </button>
        </div>
        {picker && <Picker cars={allCars} selected={cars} onPick={add} onClose={() => setPicker(false)} />}
      </div>
    );
  }

  return (
    <div className="rd-container py-10">
      {/* Compact sticky bar */}
      <div
        className={`fixed inset-x-0 top-[100px] z-30 border-b border-border bg-white/95 shadow-sm backdrop-blur transition-[transform,opacity] duration-300 max-md:top-16 ${
          showBar ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
        }`}
        aria-hidden={!showBar}
      >
        <div className="rd-container overflow-x-auto">
          <div className={`grid min-w-[600px] items-center gap-3 py-2.5 md:min-w-[780px] ${cols}`}>
            <span className="text-[12px] font-semibold tracking-wider text-muted-foreground uppercase">Comparing</span>
            {slots.map((c, i) =>
              c ? (
                <div key={c.id} className="flex min-w-0 items-center gap-2.5">
                  <CarImage car={c} className="h-9 w-12 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {c.brand} {c.model}
                    </p>
                    <p className="text-[12px] font-semibold text-brand">{formatPrice(c.final)}</p>
                  </div>
                </div>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3 select-none">
          <span className="relative inline-flex">
            <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="peer sr-only" disabled={cars.length < 2} />
            <span className="h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-blue-600 peer-disabled:opacity-50" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
          <span className="text-[14px] font-medium text-ink">
            Show only differences
            {cars.length > 1 && <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[12px] font-semibold text-blue-700">{diffCount}</span>}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[13px] text-muted-foreground sm:flex">
            <BadgeCheck className="size-4 fill-blue-600 text-white" /> = best in row
          </span>
          <button type="button" onClick={share} className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-[13px] font-medium text-ink transition hover:border-blue-600 hover:text-blue-700">
            <Link2 className="size-4" />
            {copied ? 'Link copied' : 'Share comparison'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-[0_24px_48px_-32px_rgba(16,18,24,0.35)]">
        <div className="min-w-[600px] md:min-w-[780px]">
          {/* Car header row */}
          <div ref={headRef} className={`grid border-b border-border ${cols}`}>
            <div className="sticky left-0 z-10 flex flex-col justify-end bg-white p-3 md:p-5">
              <p className="text-[12px] font-semibold tracking-[0.16em] text-brand uppercase">Side by side</p>
              <p className="mt-1 font-heading text-[16px] leading-tight font-semibold text-ink md:text-[20px]">
                {cars.length} of {MAX} cars
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">*EMI: 20% down, 5 years, {rate}% p.a.</p>
            </div>
            {slots.map((c, i) =>
              c ? (
                <div key={c.id} className="animate-rd-rise group relative border-l border-border p-3 md:p-4">
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={`Remove ${c.model}`}
                    className="absolute top-5 right-5 z-10 flex size-8 md:top-6 md:right-6 items-center justify-center rounded-full bg-white/95 text-ink shadow transition hover:bg-brand hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                  <Link href={`/cars/${c.slug}`} className="block overflow-hidden rounded-xl">
                    <CarImage car={c} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </Link>
                  <p className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{c.brand}</p>
                  <Link href={`/cars/${c.slug}`} className="font-heading text-[18px] leading-snug font-semibold text-ink hover:text-brand">
                    {c.model}
                  </Link>
                  <p className="truncate text-[13px] text-muted-foreground">{c.variant}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-heading text-[22px] font-semibold text-ink">{formatPrice(c.final)}</span>
                    {c.saving > 0 && <span className="text-[13px] text-muted-foreground line-through">{formatPrice(c.price)}</span>}
                  </div>
                  {(wins.get(c.id)?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {wins
                        .get(c.id)!
                        .slice(0, 3)
                        .map((w) => (
                          <span key={w} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            <BadgeCheck className="size-3.5 fill-blue-600 text-white" />
                            {w}
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href={`/cars/${c.slug}`} className="flex h-9 items-center justify-center rounded-lg border border-border text-[13px] font-semibold text-ink transition hover:border-ink">
                      Details
                    </Link>
                    <Link href={`/cars/${c.slug}#book`} className="flex h-9 items-center justify-center rounded-lg bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-dark">
                      Test drive
                    </Link>
                  </div>
                </div>
              ) : (
                <div key={`empty-${i}`} className="border-l border-border p-4">
                  <button
                    type="button"
                    onClick={() => setPicker(true)}
                    className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input text-center transition hover:border-blue-600 hover:bg-blue-50/50"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                      <Plus className="size-6" />
                    </span>
                    <span className="text-[14px] font-semibold text-ink">Add a car</span>
                    <span className="px-4 text-[12px] text-muted-foreground">Choose from {allCars.length} cars in stock</span>
                  </button>
                </div>
              ),
            )}
          </div>

          {/* Sections */}
          {sections.map((s) => {
            const rows = visibleRows(s);
            if (!rows.length) return null;
            return (
              <section key={s.id}>
                <div className="sticky left-0 flex items-center gap-2.5 border-b border-border bg-page/80 px-5 py-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-ink text-white">
                    <s.Icon className="size-4" />
                  </span>
                  <h3 className="text-[15px] font-semibold text-ink">{s.title}</h3>
                </div>
                {rows.map((r) => {
                  const w = winners(r, cars);
                  return (
                    <div key={r.label} className={`grid border-b border-border transition-colors last:border-b-0 hover:bg-page/40 ${cols}`}>
                      <div className="sticky left-0 z-10 flex items-center bg-white px-3 py-3.5 text-[12px] font-medium text-muted-foreground md:px-5 md:text-[13px]">{r.label}</div>
                      {slots.map((c, i) => {
                        if (!c) return <div key={`e-${i}`} className="border-l border-border" />;
                        const best = w?.has(c.id);
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-2 border-l border-border px-3 py-3.5 text-[13px] transition-colors md:px-4 md:text-[14px] ${best ? 'bg-blue-50/70 font-semibold text-ink' : 'text-ink-2'}`}
                          >
                            <span className="min-w-0 flex-1 break-words">{r.value(c)}</span>
                            {best && (
                              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-blue-700" title={r.bestLabel ?? 'Best in this row'}>
                                <BadgeCheck className="size-[18px] fill-blue-600 text-white" />
                                <span className="hidden lg:inline">Best</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>

      {/* Verdict */}
      {cars.length > 1 && (
        <div className="mt-8 overflow-hidden rounded-2xl bg-ink text-white">
          <div className="rd-dots relative p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              <h3 className="text-[18px] font-semibold">Quick verdict</h3>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {cars.map((c) => {
                const list = wins.get(c.id) ?? [];
                return (
                  <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-heading text-[16px] font-semibold">
                      {c.year} {c.brand} {c.model}
                    </p>
                    {list.length ? (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {list.map((w) => (
                          <li key={w} className="flex items-center gap-2 text-[13px] text-white/80">
                            <CheckCircle2 className="size-4 shrink-0 fill-blue-500 text-ink" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[13px] text-white/60">No category wins — but it may suit your needs best. Ask us!</p>
                    )}
                    <Link href={`/cars/${c.slug}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF6B7F] hover:text-white">
                      View this car <ArrowRight className="size-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {picker && <Picker cars={allCars} selected={cars} onPick={add} onClose={() => setPicker(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ small pieces */

function Tick() {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-blue-700">
      <CheckCircle2 className="size-5 fill-blue-600 text-white" />
      <span className="sr-only">Yes</span>
    </span>
  );
}

function Missing() {
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
      <Minus className="size-3.5" />
      <span className="sr-only">No</span>
    </span>
  );
}

function ScoreBar({ score, note, bold }: { score: number; note?: string; bold?: boolean }) {
  const color = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-400' : 'bg-brand';
  return (
    <span className="block">
      <span className="flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span className={`block h-full rounded-full ${color}`} style={{ width: `${(score / 5) * 100}%` }} />
        </span>
        <span className={`text-[13px] ${bold ? 'font-semibold' : ''}`}>{Number.isInteger(score) ? score : score.toFixed(1)}/5</span>
      </span>
      {note && <span className="mt-1 block text-[12px] font-normal text-muted-foreground">{note}</span>}
    </span>
  );
}

function Picker({ cars, selected, onPick, onClose }: { cars: CarView[]; selected: CarView[]; onPick: (c: CarView) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  const term = q.trim().toLowerCase();
  const list = cars.filter((c) => !selected.some((s) => s.id === c.id) && (!term || `${c.brand} ${c.model} ${c.variant} ${c.year}`.toLowerCase().includes(term)));

  return (
    <div className="animate-rd-fade fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add a car to compare" className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-[18px] font-semibold text-ink">Add a car to compare</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, model, year…" className="rd-input pl-9" />
          </div>
        </div>
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-blue-50/60">
                <CarImage car={c} className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {c.year} {c.brand} {c.model}
                  </span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {c.variant} · {formatKm(c.km)} · {c.fuel}
                  </span>
                </span>
                <span className="text-[14px] font-semibold text-ink">{formatPrice(c.final)}</span>
                <Plus className="size-4 shrink-0 text-blue-600" />
              </button>
            </li>
          ))}
          {!list.length && <li className="p-8 text-center text-[14px] text-muted-foreground">No cars match.</li>}
        </ul>
      </div>
    </div>
  );
}
