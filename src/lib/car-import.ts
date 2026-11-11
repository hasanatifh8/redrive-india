// Bulk car import: CSV parsing + forgiving normalisation of spreadsheet values.
// Pure (no DB) so the browser preview and the server use exactly the same rules.
import { BODY_TYPES, FUELS, MONTHS, OWNERS } from './constants';

export const IMPORT_COLUMNS = [
  { key: 'id', label: 'id', hint: 'Leave empty for new cars. Fill to UPDATE an existing car (from Export).' },
  { key: 'photo_code', label: 'photo_code', hint: 'Short code that matches this car’s photo files/folder, e.g. CRETA21' },
  { key: 'brand', label: 'brand', required: true, hint: 'e.g. Hyundai' },
  { key: 'model', label: 'model', required: true, hint: 'e.g. Creta' },
  { key: 'variant', label: 'variant', hint: 'e.g. SX (O) 1.5 Diesel AT' },
  { key: 'year', label: 'year', required: true, hint: 'e.g. 2021' },
  { key: 'month', label: 'month', hint: 'Jan–Dec or 1–12' },
  { key: 'km', label: 'km', required: true, hint: 'e.g. 38500 or 38,500 km' },
  { key: 'fuel', label: 'fuel', required: true, hint: FUELS.join(' / ') },
  { key: 'transmission', label: 'transmission', required: true, hint: 'Manual / Automatic (MT, AT, AMT, CVT also work)' },
  { key: 'body_type', label: 'body_type', hint: BODY_TYPES.join(' / ') },
  { key: 'owner', label: 'owner', hint: '1, 2, 3… or 1st Owner' },
  { key: 'price', label: 'price', required: true, hint: '1475000, 14,75,000 or 14.75 lakh' },
  { key: 'discount_type', label: 'discount_type', hint: 'none / flat / percent' },
  { key: 'discount_value', label: 'discount_value', hint: '25000 (flat) or 5 (percent)' },
  { key: 'discount_label', label: 'discount_label', hint: 'e.g. Festive offer' },
  { key: 'status', label: 'status', hint: 'available / reserved / sold / draft' },
  { key: 'featured', label: 'featured', hint: 'yes / no' },
  { key: 'new_arrival', label: 'new_arrival', hint: 'yes / no' },
  { key: 'color', label: 'color', hint: 'e.g. Polar White' },
  { key: 'seats', label: 'seats', hint: 'e.g. 5' },
  { key: 'registration', label: 'registration', hint: 'e.g. UP-70 · Prayagraj' },
  { key: 'insurance', label: 'insurance', hint: 'e.g. Comprehensive till Mar 2027' },
  { key: 'engine_type', label: 'engine_type', hint: 'e.g. 1.5L Turbo Petrol' },
  { key: 'engine_cc', label: 'engine_cc', hint: 'e.g. 1497' },
  { key: 'power', label: 'power', hint: 'bhp, e.g. 113' },
  { key: 'torque', label: 'torque', hint: 'Nm, e.g. 250' },
  { key: 'mileage', label: 'mileage', hint: 'kmpl (or km range for EVs)' },
  { key: 'drivetrain', label: 'drivetrain', hint: 'FWD / RWD / AWD / 4WD' },
  { key: 'features', label: 'features', hint: 'Separate with ; e.g. Sunroof; Rear camera' },
  { key: 'description', label: 'description', hint: 'Free text' },
] as const;

export type ImportKey = (typeof IMPORT_COLUMNS)[number]['key'];

export type ImportCar = {
  id?: number;
  photoCode: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  month: number | null;
  km: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  owner: string;
  price: number;
  discountType: 'none' | 'flat' | 'percent';
  discountValue: number;
  discountLabel: string;
  status: 'available' | 'reserved' | 'sold' | 'draft';
  featured: boolean;
  newArrival: boolean;
  color: string;
  seats: number | null;
  registration: string;
  insuranceValidity: string;
  engineType: string;
  engineCc: number | null;
  power: string;
  torque: string;
  mileage: string;
  drivetrain: string;
  features: string[];
  description: string;
};

/* ------------------------------------------------------------------ CSV / TSV */

/** Parses CSV or tab-separated text (pasted from Excel / Google Sheets). Handles quotes and newlines in cells. */
export function parseTable(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const headerKey = (h: string) => h.trim().toLowerCase().replace(/\*$/, '').replace(/[\s-]+/g, '_');

/** Turns table rows into objects keyed by column, ignoring unknown columns. */
export function rowsToRecords(table: string[][]) {
  const [header, ...body] = table;
  if (!header) return { records: [], unknown: [] as string[], missing: IMPORT_COLUMNS.filter((c) => 'required' in c).map((c) => c.key) as string[] };
  const keys = header.map(headerKey);
  const known = new Set<string>(IMPORT_COLUMNS.map((c) => c.key));
  const unknown = header.filter((_, i) => keys[i] && !known.has(keys[i]));
  const missing = IMPORT_COLUMNS.filter((c) => 'required' in c && !keys.includes(c.key)).map((c) => c.key) as string[];
  const records = body.map((cells) => {
    const r: Partial<Record<ImportKey, string>> = {};
    keys.forEach((k, i) => {
      if (known.has(k)) r[k as ImportKey] = (cells[i] ?? '').trim();
    });
    return r;
  });
  return { records, unknown, missing };
}

/* ------------------------------------------------------------------ value parsing */

const num = (s: string) => {
  const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

export function parsePrice(s: string) {
  const t = s.toLowerCase().replace(/[₹,\s]/g, '').replace(/rs\.?/, '');
  const n = num(t);
  if (Number.isNaN(n)) return NaN;
  if (/(cr|crore)/.test(t)) return Math.round(n * 1e7);
  if (/(l|lakh|lac)/.test(t) || n < 1000) return Math.round(n * 1e5); // "14.75" alone = lakh
  return Math.round(n);
}

const yes = (s: string) => /^(y|yes|true|1|✓|x)$/i.test(s.trim());

function pick(value: string, options: readonly string[], aliases: Record<string, string> = {}) {
  const v = value.trim().toLowerCase();
  if (!v) return '';
  if (aliases[v]) return aliases[v];
  return options.find((o) => o.toLowerCase() === v) ?? options.find((o) => o.toLowerCase().startsWith(v)) ?? null;
}

/** Validates + normalises one spreadsheet row. Returns the car or a list of problems. */
export function normalizeRecord(r: Partial<Record<ImportKey, string>>): { car?: ImportCar; errors: string[] } {
  const errors: string[] = [];
  const g = (k: ImportKey) => (r[k] ?? '').trim();
  const thisYear = new Date().getFullYear();

  const id = g('id') ? num(g('id')) : undefined;
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) errors.push('id must be a number (leave empty for new cars)');

  const brand = g('brand');
  const model = g('model');
  if (!brand) errors.push('brand is missing');
  if (!model) errors.push('model is missing');

  const year = num(g('year'));
  if (!g('year')) errors.push('year is missing');
  else if (!Number.isInteger(year) || year < 1990 || year > thisYear + 1) errors.push(`year “${g('year')}” looks wrong`);

  let month: number | null = null;
  if (g('month')) {
    const m = g('month').toLowerCase();
    const idx = MONTHS.findIndex((x) => m.startsWith(x.toLowerCase()));
    month = idx >= 0 ? idx + 1 : num(m);
    if (!Number.isInteger(month) || month < 1 || month > 12) errors.push(`month “${g('month')}” should be Jan–Dec or 1–12`);
  }

  const km = num(g('km'));
  if (!g('km')) errors.push('km is missing');
  else if (Number.isNaN(km) || km < 0) errors.push(`km “${g('km')}” is not a number`);

  const fuel = pick(g('fuel'), FUELS, { ev: 'Electric', 'petrol+cng': 'CNG', 'petrol + cng': 'CNG' });
  if (!g('fuel')) errors.push('fuel is missing');
  else if (!fuel) errors.push(`fuel “${g('fuel')}” should be ${FUELS.join('/')}`);

  const transmission = pick(g('transmission'), ['Manual', 'Automatic'], { mt: 'Manual', at: 'Automatic', amt: 'Automatic', cvt: 'Automatic', dct: 'Automatic', ivt: 'Automatic', auto: 'Automatic' });
  if (!g('transmission')) errors.push('transmission is missing');
  else if (!transmission) errors.push(`transmission “${g('transmission')}” should be Manual or Automatic`);

  const bodyType = g('body_type') ? pick(g('body_type'), BODY_TYPES, { hatch: 'Hatchback', 'compact-suv': 'Compact SUV', crossover: 'Compact SUV', van: 'MUV', mpv: 'MUV' }) : 'SUV';
  if (bodyType === null) errors.push(`body_type “${g('body_type')}” should be ${BODY_TYPES.join('/')}`);

  let owner = OWNERS[0];
  if (g('owner')) {
    const o = num(g('owner'));
    const word = { first: 1, second: 2, third: 3 }[g('owner').toLowerCase().split(' ')[0] as 'first'];
    const n = Number.isNaN(o) ? word : o;
    if (!n || n < 1) errors.push(`owner “${g('owner')}” should be 1, 2, 3…`);
    else owner = OWNERS[Math.min(n, OWNERS.length) - 1];
  }

  const price = parsePrice(g('price'));
  if (!g('price')) errors.push('price is missing');
  else if (Number.isNaN(price) || price <= 0) errors.push(`price “${g('price')}” is not a valid amount`);

  const dt = (g('discount_type') || 'none').toLowerCase();
  const discountType = dt === '%' || dt.startsWith('perc') ? 'percent' : dt.startsWith('flat') || dt === '₹' || dt === 'rs' ? 'flat' : dt === 'none' || dt === '' ? 'none' : null;
  if (!discountType) errors.push('discount_type should be none, flat or percent');
  const discountValue = g('discount_value') ? (discountType === 'flat' ? parsePrice(g('discount_value')) : num(g('discount_value'))) : 0;
  if (discountType && discountType !== 'none') {
    if (Number.isNaN(discountValue) || discountValue <= 0) errors.push('discount_value is missing or not a number');
    else if (discountType === 'percent' && discountValue > 90) errors.push('percent discount cannot exceed 90');
    else if (discountType === 'flat' && price > 0 && discountValue >= price) errors.push('flat discount must be less than the price');
  }

  const st = (g('status') || 'available').toLowerCase();
  const status = (['available', 'reserved', 'sold', 'draft'] as const).find((s) => s.startsWith(st.slice(0, 3))) ?? null;
  if (!status) errors.push('status should be available, reserved, sold or draft');

  const seats = g('seats') ? num(g('seats')) : null;
  if (seats !== null && (!Number.isInteger(seats) || seats < 2 || seats > 12)) errors.push(`seats “${g('seats')}” looks wrong`);
  const engineCc = g('engine_cc') ? num(g('engine_cc')) : null;
  if (engineCc !== null && (Number.isNaN(engineCc) || engineCc < 50 || engineCc > 10000)) errors.push(`engine_cc “${g('engine_cc')}” looks wrong`);

  const dtRaw = g('drivetrain').toUpperCase();
  const drivetrain = dtRaw ? ({ FWD: 'FWD (front-wheel drive)', RWD: 'RWD (rear-wheel drive)', AWD: 'AWD (all-wheel drive)', '4WD': '4WD (four-wheel drive)', '4X4': '4WD (four-wheel drive)' } as Record<string, string>)[dtRaw.split(' ')[0]] ?? g('drivetrain') : '';

  if (errors.length) return { errors };
  return {
    errors,
    car: {
      id,
      photoCode: g('photo_code'),
      brand,
      model,
      variant: g('variant'),
      year,
      month,
      km: Math.round(km),
      fuel: fuel!,
      transmission: transmission!,
      bodyType: bodyType || 'SUV',
      owner,
      price,
      discountType: discountType!,
      discountValue: discountType === 'none' ? 0 : Math.round(discountValue),
      discountLabel: g('discount_label'),
      status: status!,
      featured: yes(g('featured')),
      newArrival: g('new_arrival') ? yes(g('new_arrival')) : !id,
      color: g('color'),
      seats,
      registration: g('registration'),
      insuranceValidity: g('insurance'),
      engineType: g('engine_type'),
      engineCc: engineCc === null ? null : Math.round(engineCc),
      power: g('power'),
      torque: g('torque'),
      mileage: g('mileage'),
      drivetrain,
      features: g('features')
        .split(/[;|\n]/)
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 60),
      description: g('description'),
    },
  };
}

/* ------------------------------------------------------------------ CSV writing */

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n');

export const TEMPLATE_EXAMPLES: Partial<Record<ImportKey, string>>[] = [
  { photo_code: 'CRETA21', brand: 'Hyundai', model: 'Creta', variant: 'SX (O) 1.5 Diesel AT', year: '2021', month: 'Mar', km: '38500', fuel: 'Diesel', transmission: 'Automatic', body_type: 'SUV', owner: '1', price: '14.75 lakh', discount_type: 'flat', discount_value: '25000', discount_label: 'Festive offer', status: 'available', featured: 'yes', color: 'Fiery Red', seats: '5', registration: 'UP-70 · Prayagraj', engine_type: '1.5L CRDi Diesel', engine_cc: '1493', power: '113', torque: '250', mileage: '18.5', drivetrain: 'FWD', features: 'Sunroof; Ventilated seats; Rear camera', description: 'Single owner, full service history.' },
  { photo_code: 'SWIFT20', brand: 'Maruti Suzuki', model: 'Swift', variant: 'ZXi 1.2 Petrol', year: '2020', km: '41,000', fuel: 'Petrol', transmission: 'MT', body_type: 'Hatchback', owner: '1', price: '5.60 lakh', status: 'available', color: 'Solid Fire Red', features: 'Touchscreen infotainment; Push-button start' },
];
