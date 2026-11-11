// READ-ONLY: shows which database a set of credentials points at and what's inside it.
// Usage:  npm run db:info                      → uses .env.local (or the local SQLite file)
//         npm run db:info -- .env.vercel.local → uses credentials pulled from Vercel
import { createClient } from '@libsql/client';
import { resolveDatabase } from '../src/lib/db-config.ts';

const envFile = process.argv[2] ?? '.env.local';
try {
  process.loadEnvFile(envFile);
  console.log(`Loaded credentials from ${envFile}`);
} catch {
  console.log(`(No ${envFile} found — checking the local database file)`);
}

const { url, authToken, host, perDeployment } = resolveDatabase();
console.log(`\nDatabase: ${host}${perDeployment ? '  ⚠ TEMPORARY per-deployment database!' : ''}\n`);

const db = createClient({ url, authToken });
const count = async (table: string) => {
  try {
    const r = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    return Number(r.rows[0].n);
  } catch {
    return 'missing';
  }
};

for (const t of ['cars', 'car_images', 'leads', 'offers', 'referral_codes', 'settings', '__drizzle_migrations']) {
  console.log(`  ${t.padEnd(22)} ${await count(t)}`);
}

try {
  const recent = await db.execute('SELECT id, year, brand, model, status, created_at FROM cars ORDER BY created_at DESC LIMIT 10');
  if (recent.rows.length) {
    console.log('\nNewest cars:');
    for (const r of recent.rows) console.log(`  #${r.id}  ${r.year} ${r.brand} ${r.model}  [${r.status}]  added ${new Date(Number(r.created_at)).toLocaleString('en-IN')}`);
  }
} catch {
  /* no cars table */
}
db.close();
