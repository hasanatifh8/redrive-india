// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'rd_admin';
const SESSION_DAYS = 7;

const isProd = process.env.NODE_ENV === 'production';

function secretKey() {
  const secret = process.env.AUTH_SECRET || (isProd ? '' : 'dev-only-secret-change-me-dev-only-secret');
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set (at least 32 characters).');
  return new TextEncoder().encode(secret);
}

export function adminPassword() {
  const pw = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin123');
  if (!pw) throw new Error('ADMIN_PASSWORD must be set.');
  return pw;
}

export async function createSession() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export const sessionMaxAge = SESSION_DAYS * 24 * 60 * 60;

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}
