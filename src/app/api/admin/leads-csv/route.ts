import { desc } from 'drizzle-orm';
import { db, schema } from '@/db';
import { isAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const esc = (v: unknown) => {
  let s = String(v ?? '');
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  const rows = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));
  const header = ['Date', 'Type', 'Status', 'Name', 'Phone', 'Car', 'Referral code', 'Reward paid', 'Details', 'Notes', 'Photos'];
  const lines = rows.map((l) =>
    [
      l.createdAt.toLocaleString('en-IN'),
      l.type,
      l.status,
      l.name,
      l.phone,
      l.carLabel,
      l.referralCode ?? '',
      l.rewardPaid ? 'yes' : '',
      Object.entries(l.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; '),
      l.notes,
      l.images.join(' '),
    ]
      .map(esc)
      .join(','),
  );
  const csv = '﻿' + [header.join(','), ...lines].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="redrive-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
