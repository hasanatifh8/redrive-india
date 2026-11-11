// Full-database backup / restore. Self-contained (relative imports only) so the
// deploy script can use it too.
import type { Client, InStatement } from '@libsql/client';

/** Insert order respects foreign keys (parents first). */
export const BACKUP_TABLES = ['settings', 'referral_codes', 'cars', 'car_images', 'offers', 'leads'] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

export type BackupFile = {
  app: 'redrive';
  version: 1;
  createdAt: string;
  counts: Record<string, number>;
  tables: Record<string, Record<string, unknown>[]>;
};

const plain = (v: unknown) => (typeof v === 'bigint' ? Number(v) : v instanceof ArrayBuffer ? null : v);

export async function countRows(client: Client) {
  const out: Record<string, number> = {};
  for (const t of BACKUP_TABLES) {
    try {
      const r = await client.execute(`SELECT COUNT(*) AS n FROM ${t}`);
      out[t] = Number(r.rows[0].n);
    } catch {
      /* table doesn't exist yet */
    }
  }
  return out;
}

export async function exportData(client: Client): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {};
  for (const t of BACKUP_TABLES) {
    try {
      const r = await client.execute(`SELECT * FROM ${t}`);
      tables[t] = r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, plain(row[i])])));
    } catch {
      tables[t] = [];
    }
  }
  const counts = Object.fromEntries(Object.entries(tables).map(([t, rows]) => [t, rows.length]));
  return { app: 'redrive', version: 1, createdAt: new Date().toISOString(), counts, tables };
}

export function parseBackup(text: string): BackupFile {
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup (not JSON).');
  }
  if (data?.app !== 'redrive' || data.version !== 1 || typeof data.tables !== 'object') throw new Error('This file is not a REDRIVE backup.');
  return data;
}

/**
 * Replaces ALL data with the backup's, atomically (all or nothing).
 * Only columns that exist in the current schema are restored, so older backups still work.
 */
export async function restoreData(client: Client, data: BackupFile) {
  const columns: Record<string, Set<string>> = {};
  for (const t of BACKUP_TABLES) {
    const info = await client.execute(`PRAGMA table_info(${t})`);
    columns[t] = new Set(info.rows.map((r) => String(r.name)));
  }

  const stmts: InStatement[] = [];
  for (const t of [...BACKUP_TABLES].reverse()) stmts.push(`DELETE FROM ${t}`);
  for (const t of BACKUP_TABLES) {
    for (const row of data.tables[t] ?? []) {
      const cols = Object.keys(row).filter((c) => columns[t].has(c));
      if (!cols.length) continue;
      stmts.push({
        sql: `INSERT INTO ${t} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        args: cols.map((c) => (row[c] ?? null) as string | number | null),
      });
    }
  }
  await client.batch(stmts, 'write');
  return countRows(client);
}

export const totalRows = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0);
