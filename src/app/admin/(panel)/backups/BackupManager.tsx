'use client';

import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarClock, CloudUpload, Database, Download, History, Loader2, RotateCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { backupNow, deleteBackup, restoreBackup, restoreUploadedBackup, type ActionResult } from '@/app/admin/actions';
import { SubmitButton, Toast } from '@/components/admin/client';
import { Badge, Card, btn } from '@/components/admin/ui';

type Entry = { name: string; size: number; createdAt: string };

const KINDS: Record<string, { label: string; cls: string }> = {
  daily: { label: 'Daily (automatic)', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  'pre-deploy': { label: 'Before deploy', cls: 'border-sky-200 bg-sky-50 text-sky-700' },
  manual: { label: 'Manual', cls: 'border-zinc-200 bg-zinc-100 text-zinc-700' },
  'before-restore': { label: 'Before a restore', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
};
const kindOf = (name: string) => Object.keys(KINDS).find((k) => name.startsWith(k)) ?? 'manual';
const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function BackupManager({
  backups,
  counts,
  databaseHost,
  cronConfigured,
}: {
  backups: Entry[] | null;
  counts: Record<string, number>;
  databaseHost: string;
  cronConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const [uploadState, uploadAction] = useFormState<ActionResult, FormData>(restoreUploadedBackup, null);

  const run = (key: string, fn: () => Promise<ActionResult | void>) => {
    setBusy(key);
    start(async () => {
      const res = await fn();
      if (res) setToast({ message: res.message, ok: res.ok });
      setBusy(null);
      router.refresh();
    });
  };

  const confirmRestore = (label: string) =>
    window.prompt(`Restore the backup from ${label}?\n\nThis REPLACES all current cars, leads, offers, codes and settings with the backup's. (A copy of the current data is saved first, so you can undo.)\n\nType RESTORE to continue:`) === 'RESTORE';

  const last = backups?.[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {toast && <Toast message={toast.message} ok={toast.ok} />}
      {uploadState && <Toast key={uploadState.message} message={uploadState.message} ok={uploadState.ok} />}

      <div className="flex flex-col gap-6">
        {!cronConfigured && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>Nightly backups are not switched on yet.</strong> In Vercel → Settings → Environment Variables, add <code className="rounded bg-white px-1">CRON_SECRET</code> (any long random text)
              and redeploy. Backups before every deploy already work.
            </span>
          </div>
        )}

        <Card
          title="Saved backups"
          description="Stored privately in your Blob storage. Daily backups keep 30 days; before-deploy backups keep the last 20."
          actions={
            <button type="button" disabled={pending} onClick={() => run('now', backupNow)} className={btn.primary}>
              {busy === 'now' ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
              Back up now
            </button>
          }
        >
          {backups === null ? (
            <p className="rounded-lg bg-brand-soft px-3 py-2 text-[14px] text-brand">Could not read the backup list — is Blob storage connected?</p>
          ) : backups.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-muted-foreground">No backups yet. Click “Back up now” to make the first one.</p>
          ) : (
            <ul className="divide-y divide-border">
              {backups.map((b) => {
                const k = KINDS[kindOf(b.name)];
                return (
                  <li key={b.name} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-page text-muted-foreground">
                      <History className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink">{fmt(b.createdAt)}</p>
                      <p className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                        <Badge className={k.cls}>{k.label}</Badge>
                        {size(b.size)}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      <a href={`/api/admin/backups/${b.name}`} className={btn.ghost} title="Download to your computer">
                        <Download className="size-3.5" /> Download
                      </a>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => confirmRestore(fmt(b.createdAt)) && run(b.name, () => restoreBackup(b.name))}
                        className={btn.ghost}
                      >
                        {busy === b.name ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Restore
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => window.confirm('Delete this backup permanently?') && run(`del-${b.name}`, () => deleteBackup(b.name))}
                        className={btn.danger}
                        title="Delete backup"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card title="Right now">
          <dl className="grid grid-cols-2 gap-3 text-[14px]">
            {[
              ['Cars', counts.cars],
              ['Photos', counts.car_images],
              ['Leads', counts.leads],
              ['Offers', counts.offers],
              ['Referral codes', counts.referral_codes],
              ['Settings', counts.settings],
            ].map(([l, n]) => (
              <div key={l as string} className="rounded-lg bg-page p-3">
                <dt className="text-[12px] text-muted-foreground">{l}</dt>
                <dd className="font-heading text-[20px] font-semibold text-ink">{n ?? 0}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Database className="size-3.5" /> {databaseHost}
          </p>
          {last && (
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarClock className="size-3.5" /> Last backup: {fmt(last.createdAt)}
            </p>
          )}
        </Card>

        <Card title="How you’re protected">
          <ul className="flex flex-col gap-2.5 text-[13px] text-ink-2">
            {[
              'A full copy is saved automatically before every deploy.',
              'A deploy is cancelled if it would ever remove data.',
              'Nightly backups keep the last 30 days.',
              'Every restore first saves a copy of the current data, so it can be undone.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Restore from a file" description="Use a backup you downloaded earlier.">
          <form
            action={uploadAction}
            onSubmit={(e) => {
              if (!confirmRestore('the uploaded file')) e.preventDefault();
            }}
            className="flex flex-col gap-3"
          >
            <input type="file" name="file" accept="application/json,.json" required className="text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-white" />
            <SubmitButton className={btn.outline}>
              <Upload className="size-4" />
              Restore this file
            </SubmitButton>
            <p className="text-[12px] text-muted-foreground">Replaces current data. A copy of the current data is saved first.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
