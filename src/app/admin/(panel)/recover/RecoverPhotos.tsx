'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ImageOff, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { deleteOrphanPhotos, recoverCar } from '@/app/admin/actions';
import { Toast } from '@/components/admin/client';
import { btn } from '@/components/admin/ui';

export type PhotoGroup = { start: string; end: string; urls: string[] };

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function Group({ group, onToast }: { group: PhotoGroup; onToast: (m: string, ok: boolean) => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(group.urls);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<'create' | 'delete' | null>(null);
  const toggle = (u: string) => setSelected((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u]));
  const ordered = group.urls.filter((u) => selected.includes(u)); // keep upload order

  return (
    <section className="rd-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Uploaded {fmt(group.start)}</h2>
          <p className="text-[13px] text-muted-foreground">
            {group.urls.length} photo{group.urls.length === 1 ? '' : 's'} · {selected.length} selected · the first selected becomes the main photo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelected(selected.length === group.urls.length ? [] : group.urls)} className={btn.ghost}>
            {selected.length === group.urls.length ? 'Select none' : 'Select all'}
          </button>
          <button
            type="button"
            disabled={pending || !selected.length}
            onClick={() => {
              if (!window.confirm(`Delete ${selected.length} photo(s) permanently?`)) return;
              setBusy('delete');
              start(async () => {
                const r = await deleteOrphanPhotos(ordered);
                onToast(r?.message ?? 'Deleted', !!r?.ok);
                setBusy(null);
                router.refresh();
              });
            }}
            className={btn.danger}
          >
            {busy === 'delete' ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Delete selected
          </button>
          <button
            type="button"
            disabled={pending || !selected.length}
            onClick={() => {
              setBusy('create');
              start(async () => {
                const r = await recoverCar(ordered); // redirects to the edit form on success
                if (r && !r.ok) onToast(r.message, false);
                setBusy(null);
              });
            }}
            className={btn.primary}
          >
            {busy === 'create' ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Create car from {selected.length} photo{selected.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {group.urls.map((u) => {
          const on = selected.includes(u);
          const pos = ordered.indexOf(u);
          return (
            <button
              key={u}
              type="button"
              onClick={() => toggle(u)}
              aria-pressed={on}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${on ? 'border-brand' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span className={`absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${on ? 'bg-brand text-white' : 'bg-white/90 text-transparent'}`}>
                {on ? pos === 0 ? '★' : <Check className="size-3" strokeWidth={3} /> : ''}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function RecoverPhotos({ groups, error }: { groups: PhotoGroup[]; error: boolean }) {
  const [toast, setToast] = useState<{ m: string; ok: boolean } | null>(null);
  if (error) return <p className="rounded-xl bg-brand-soft px-4 py-3 text-[14px] text-brand">Could not read photo storage — is Blob storage connected?</p>;
  if (!groups.length)
    return (
      <div className="rd-card flex flex-col items-center gap-2 px-6 py-14 text-center">
        <ImageOff className="size-9 text-muted-foreground" />
        <p className="text-[16px] font-semibold text-ink">Nothing to recover</p>
        <p className="text-[14px] text-muted-foreground">Every photo in storage is attached to a car.</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast key={toast.m} message={toast.m} ok={toast.ok} />}
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[14px] text-sky-900">
        Tap photos to include or leave them out. Each new car is created as a <strong>hidden draft</strong> with these photos attached — fill in brand, model, price and so on, set
        Status to <strong>Available</strong>, and save.
      </div>
      {groups.map((g) => (
        <Group key={g.start} group={g} onToast={(m, ok) => setToast({ m, ok })} />
      ))}
    </div>
  );
}
