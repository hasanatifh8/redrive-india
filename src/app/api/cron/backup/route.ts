// Daily automatic backup, triggered by Vercel Cron (see vercel.json).
import { NextResponse } from 'next/server';
import { libsql } from '@/db';
import { exportData } from '@/lib/backup';
import { backupStamp, pruneBackups, saveBackup } from '@/lib/storage';
import { safeEqual } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await exportData(libsql);
  const name = `daily-${backupStamp()}.json`;
  await saveBackup(name, JSON.stringify(data));
  await pruneBackups('daily-', 30);
  return NextResponse.json({ ok: true, name, counts: data.counts });
}
