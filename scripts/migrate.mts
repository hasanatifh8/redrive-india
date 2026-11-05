// Applies pending database migrations. Runs automatically before `next build` on Vercel.
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* no local env file — fine on Vercel */
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  console.error('✗ TURSO_DATABASE_URL is not set. Connect a Turso database to this Vercel project.');
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
await migrate(drizzle(client), { migrationsFolder: './drizzle' });
console.log(`✓ Database migrated (${url.startsWith('file:') ? url : 'remote Turso database'})`);
client.close();
