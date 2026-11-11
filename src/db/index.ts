import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { assertSafeDatabase, resolveDatabase } from '../lib/db-config';

// Locally this is a SQLite file. In production: DATABASE_URL + DATABASE_AUTH_TOKEN (one permanent database).
assertSafeDatabase();
const { url, authToken, host } = resolveDatabase();

/** Hostname of the connected database (safe to display — no credentials). */
export const databaseHost = url.startsWith('file:') ? `${url} (local file)` : host;

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };
const client = globalForDb.libsql ?? createClient({ url, authToken });
if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client;

export const db = drizzle(client, { schema });
/** Raw client, used for backups. */
export const libsql = client;
export { schema };
