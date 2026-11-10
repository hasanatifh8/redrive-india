// Shared car search: every word must match, common shorthand is understood,
// and budget phrases ("under 10 lakh", "5-8 lakh", "below 8l") become price limits.

export type Searchable = {
  brand: string;
  model: string;
  variant: string;
  year: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  color: string;
  owner: string;
  final: number;
};

/** Lightweight car record for search suggestions (sent to the browser). */
export type SearchItem = Searchable & { id: number; slug: string; km: number; image: string | null };

export const toSearchItem = (c: Searchable & { id: number; slug: string; km: number; images: string[] }): SearchItem => ({
  id: c.id,
  slug: c.slug,
  brand: c.brand,
  model: c.model,
  variant: c.variant,
  year: c.year,
  km: c.km,
  fuel: c.fuel,
  transmission: c.transmission,
  bodyType: c.bodyType,
  color: c.color,
  owner: c.owner,
  final: c.final,
  image: c.images[0] ?? null,
});

const SYNONYMS: Record<string, string[]> = {
  auto: ['automatic'],
  at: ['automatic'],
  amt: ['automatic', 'amt'],
  cvt: ['automatic', 'cvt'],
  dct: ['automatic', 'dct'],
  mt: ['manual'],
  ev: ['electric'],
  electric: ['electric'],
  hatch: ['hatchback'],
  muv: ['muv'],
  maruti: ['maruti suzuki'],
  suzuki: ['maruti suzuki'],
  vw: ['volkswagen'],
  merc: ['mercedes'],
  benz: ['mercedes'],
  '7': ['7-seater', '7 seater', 'muv'],
};

const LAKH = 100000;
const amount = (n: string, unit?: string) => {
  const v = Number(n);
  if (unit && /^(k|thousand)/.test(unit)) return v * 1000;
  if (unit && /^(cr|crore)/.test(unit)) return v * 100 * LAKH;
  return v < 1000 ? v * LAKH : v; // "8" → 8 lakh, "800000" → rupees
};

export type ParsedQuery = { tokens: string[]; min?: number; max?: number };

export function parseQuery(raw: string): ParsedQuery {
  let q = raw.toLowerCase().replace(/[₹,]/g, ' ').replace(/\s+/g, ' ').trim();
  let min: number | undefined;
  let max: number | undefined;
  const unit = '(l|lakh|lakhs|lac|lacs|k|thousand|cr|crore)?';

  // "5-8 lakh", "5 to 8 lakh"
  q = q.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:-|to)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`), (_, a, b, u) => {
    min = amount(a, u);
    max = amount(b, u);
    return ' ';
  });
  // "under 10 lakh", "below 8l", "upto 6 lakh", "within 12 lakh"
  q = q.replace(new RegExp(`\\b(?:under|below|upto|up to|within|less than|max)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`), (_, a, u) => {
    max = amount(a, u);
    return ' ';
  });
  // "above 10 lakh", "over 15l", "from 5 lakh"
  q = q.replace(new RegExp(`\\b(?:above|over|more than|from|min)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`), (_, a, u) => {
    min = amount(a, u);
    return ' ';
  });
  // A bare "10 lakh" means roughly that budget → treat as a maximum.
  q = q.replace(/\b(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|lac|lacs)\b/, (_, a, u) => {
    max = amount(a, u);
    return ' ';
  });

  const stop = new Set(['car', 'cars', 'a', 'an', 'the', 'for', 'in', 'with', 'and', 'used', 'second', 'hand', 'pre-owned', 'preowned', 'rs', 'price', 'budget']);
  const tokens = q.split(' ').filter((t) => t && !stop.has(t));
  return { tokens, min, max };
}

const haystack = (c: Searchable) =>
  `${c.brand} ${c.model} ${c.variant} ${c.year} ${c.fuel} ${c.transmission} ${c.bodyType} ${c.color} ${c.owner}`.toLowerCase();

/** Filters (and, when there's a query, ranks) cars by a free-text search. */
export function searchCars<T extends Searchable>(items: T[], raw: string): T[] {
  const { tokens, min, max } = parseQuery(raw);
  if (!tokens.length && min == null && max == null) return items;

  const scored: { c: T; score: number }[] = [];
  for (const c of items) {
    if (min != null && c.final < min) continue;
    if (max != null && c.final > max) continue;
    const hay = haystack(c);
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      const options = [t, ...(SYNONYMS[t] ?? [])];
      if (!options.some((o) => hay.includes(o))) {
        ok = false;
        break;
      }
      const model = c.model.toLowerCase();
      const brand = c.brand.toLowerCase();
      if (model === t || model.startsWith(t)) score += 6;
      else if (brand.startsWith(t)) score += 4;
      else score += 1;
    }
    if (ok) scored.push({ c, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.c);
}

/** Human-readable summary of a parsed budget, e.g. "Under ₹10 Lakh". */
export function budgetLabel(min?: number, max?: number) {
  const f = (n: number) => (n >= 100 * LAKH ? `₹${+(n / (100 * LAKH)).toFixed(2)} Cr` : `₹${+(n / LAKH).toFixed(2)} Lakh`);
  if (min != null && max != null) return `${f(min)} – ${f(max)}`;
  if (max != null) return `Under ${f(max)}`;
  if (min != null) return `Above ${f(min)}`;
  return '';
}

export const POPULAR_SEARCHES = ['SUV under 15 lakh', 'Automatic', 'Diesel', 'Hatchback under 8 lakh', 'Creta', '7 seater', 'Electric'];
