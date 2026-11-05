import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Locally this is a SQLite file. On Vercel set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
const url = process.env.TURSO_DATABASE_URL || 'file:local.db';

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };
const client = globalForDb.libsql ?? createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
