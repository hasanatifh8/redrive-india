import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Locally this is a SQLite file. On Vercel set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// Never silently fall back to a local file on Vercel — that would look like "all data vanished".
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set for this deployment. Connect the Turso database in Vercel → Storage.');
}
const url = process.env.TURSO_DATABASE_URL || 'file:local.db';

/** Hostname of the connected database (safe to display — no credentials). */
export const databaseHost = url.startsWith('file:') ? `${url} (local file)` : new URL(url.replace(/^libsql:/, 'https:')).host;

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };
const client = globalForDb.libsql ?? createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
