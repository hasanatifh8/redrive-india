import { databaseHost, libsql } from '@/db';
import { countRows } from '@/lib/backup';
import { listBackups } from '@/lib/storage';
import { PageHeader } from '@/components/admin/ui';
import BackupManager from './BackupManager';

export const metadata = { title: 'Backups' };

export default async function BackupsPage() {
  const [backups, counts] = await Promise.all([listBackups().catch(() => null), countRows(libsql)]);
  return (
    <>
      <PageHeader
        title="Backups"
        description="Your data is copied automatically every night and before every deploy. Download a copy any time, or restore with one click."
      />
      <BackupManager
        backups={backups?.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })) ?? null}
        counts={counts}
        databaseHost={databaseHost}
        cronConfigured={!!process.env.CRON_SECRET || !process.env.VERCEL}
      />
    </>
  );
}
