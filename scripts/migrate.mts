// Runs automatically before `next build` (locally and on every Vercel deploy):
//   1. counts every table and saves a full backup of the data (on Vercel → private Blob storage)
//   2. applies pending database migrations
//   3. re-counts every table and FAILS THE DEPLOY if any table lost rows
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { countRows, exportData, totalRows } from '../src/lib/backup.ts';
import { backupStamp, pruneBackups, saveBackup } from '../src/lib/storage.ts';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* no local env file — fine on Vercel */
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
  console.error('✗ TURSO_DATABASE_URL is not set. Connect the Turso database to this Vercel project.');
  process.exit(1);
}
// Log the host (never the token) so each deploy log shows exactly which database it touched.
const host = url.startsWith('file:') ? url : new URL(url.replace(/^libsql:/, 'https:')).host;
console.log(`→ Database: ${host}`);

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const before = await countRows(client);
console.log(`→ Rows before: ${JSON.stringify(before)}`);

// Safety copy before touching anything (skipped for an empty database).
if (totalRows(before) > 0) {
  try {
    const data = await exportData(client);
    await saveBackup(`pre-deploy-${backupStamp()}.json`, JSON.stringify(data));
    await pruneBackups('pre-deploy-', 20);
    console.log('✓ Pre-deploy backup saved');
  } catch (e) {
    console.warn(`⚠ Pre-deploy backup could not be saved: ${e instanceof Error ? e.message : e}`);
  }
}

await migrate(drizzle(client), { migrationsFolder: './drizzle' });

const after = await countRows(client);
const shrunk = Object.entries(before).filter(([t, n]) => (after[t] ?? 0) < n);
if (shrunk.length) {
  console.error('✗ DATA LOSS DETECTED — stopping this deploy so it never goes live.');
  for (const [t, n] of shrunk) console.error(`   ${t}: ${n} → ${after[t] ?? 0} rows`);
  console.error('   Restore from the pre-deploy backup in Admin → Backups.');
  client.close();
  process.exit(1);
}
console.log(`✓ Database migrated: ${host} · rows after: ${JSON.stringify(after)}`);
client.close();
