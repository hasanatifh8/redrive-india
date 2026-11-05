// Pure pricing helpers, safe for client and server.

export type Discountable = { price: number; discountType: string; discountValue: number };

export function finalPrice(c: Discountable) {
  if (c.discountType === 'flat') return Math.max(0, c.price - c.discountValue);
  if (c.discountType === 'percent') return Math.max(0, Math.round(c.price * (1 - Math.min(c.discountValue, 100) / 100)));
  return c.price;
}

export const savings = (c: Discountable) => c.price - finalPrice(c);

export function codeDiscount(price: number, code: { discountType: string; discountValue: number; maxDiscount: number | null }) {
  const raw = code.discountType === 'percent' ? Math.round((price * code.discountValue) / 100) : code.discountValue;
  return Math.min(price, code.maxDiscount ? Math.min(raw, code.maxDiscount) : raw);
}

export function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export const formatRupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const formatKm = (km: number) => `${km.toLocaleString('en-IN')} km`;

/** Monthly EMI for a reducing-balance loan. */
export function emi(principal: number, annualRatePct: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}
