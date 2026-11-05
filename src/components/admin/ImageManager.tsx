'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, UploadCloud } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';

async function upload(file: File, folder: string): Promise<string> {
  const body = new FormData();
  body.append('file', await compressImage(file));
  body.append('folder', folder);
  const res = await fetch('/api/admin/upload', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url as string;
}

// Each slot is either an uploaded image (url) or one still uploading (preview).
type Slot = { key: string; url?: string; preview?: string };

export default function ImageManager({
  name,
  initial,
  max = 12,
  folder = 'cars',
  single = false,
}: {
  name: string;
  initial: string[];
  max?: number;
  folder?: string;
  single?: boolean;
}) {
  const [slots, setSlots] = useState<Slot[]>(() => initial.map((url) => ({ key: url, url })));
  const urls = slots.filter((x) => x.url).map((x) => x.url!);
  const pendingCount = slots.length - urls.length;
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const guard = useRef<HTMLInputElement>(null);
  const limit = single ? 1 : max;

  const addFiles = async (files: FileList | File[]) => {
    setErrors([]);
    let list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    const room = single ? 1 : limit - slots.length;
    if (room <= 0) {
      setErrors([`Maximum ${limit} photos`]);
      return;
    }
    if (list.length > room) {
      setErrors([`Only the first ${room} photo(s) were added — maximum is ${limit}.`]);
      list = list.slice(0, room);
    }
    // Placeholders are added in selection order, so finished uploads keep that order.
    const items = list.map((file) => ({ file, slot: { key: crypto.randomUUID(), preview: URL.createObjectURL(file) } as Slot }));
    setSlots((cur) => (single ? items.map((i) => i.slot) : [...cur, ...items.map((i) => i.slot)]));

    // Upload three at a time.
    const queue = [...items];
    const worker = async () => {
      while (queue.length) {
        const { file, slot } = queue.shift()!;
        try {
          const url = await upload(file, folder);
          setSlots((cur) => cur.map((x) => (x.key === slot.key ? { key: slot.key, url } : x)));
        } catch (e) {
          setErrors((er) => [...er, e instanceof Error ? e.message : `Failed: ${file.name}`]);
          setSlots((cur) => cur.filter((x) => x.key !== slot.key));
        } finally {
          URL.revokeObjectURL(slot.preview!);
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  const move = (from: number, to: number) =>
    setSlots((u) => {
      if (to < 0 || to >= u.length) return u;
      const next = [...u];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });

  // Block form submission while photos are still uploading, with a clear message.
  useEffect(() => {
    guard.current?.setCustomValidity(pendingCount > 0 ? 'Please wait — photos are still uploading.' : '');
  }, [pendingCount]);

  const remove = (i: number) => setSlots((u) => u.filter((_, idx) => idx !== i));
  const full = slots.length >= limit;

  return (
    <div>
      <input type="hidden" name={name} value={single ? (urls[0] ?? '') : JSON.stringify(urls)} />
      <input ref={guard} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute h-px w-px opacity-0" defaultValue="" />
      <div className={`grid gap-3 ${single ? 'grid-cols-1 sm:max-w-sm' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {slots.map((slot, i) =>
          !slot.url ? (
            <div key={slot.key} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <img src={slot.preview} alt="" className="h-full w-full object-cover opacity-50" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[12px] font-medium text-ink">
                <Loader2 className="size-5 animate-spin" />
                Uploading…
              </span>
            </div>
          ) : (
          <div
            key={slot.key}
            draggable={!single}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (drag !== null && drag !== i) move(drag, i);
              setDrag(null);
            }}
            onDragEnd={() => setDrag(null)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-muted ${i === 0 && !single ? 'border-brand' : 'border-transparent'} ${drag === i ? 'opacity-40' : ''} ${single ? '' : 'cursor-move'}`}
          >
            <img src={slot.url} alt="" className="h-full w-full object-cover" />
            {i === 0 && !single && (
              <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                <Star className="size-3 fill-current" /> Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {!single ? (
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded bg-white/90 p-1 text-ink disabled:opacity-40" aria-label="Move left">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === slots.length - 1} className="rounded bg-white/90 p-1 text-ink disabled:opacity-40" aria-label="Move right">
                    <ArrowRight className="size-3.5" />
                  </button>
                  {i !== 0 && (
                    <button type="button" onClick={() => move(i, 0)} className="rounded bg-white/90 px-1.5 text-[11px] font-semibold text-ink">
                      Make cover
                    </button>
                  )}
                </div>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => remove(i)} className="rounded bg-white/90 p-1 text-brand" aria-label="Remove photo">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          ),
        )}

        {!full && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={`flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center transition ${over ? 'border-brand bg-brand-soft' : 'border-input hover:border-brand hover:bg-brand-soft/40'}`}
          >
            {urls.length ? <ImagePlus className="size-6 text-muted-foreground" /> : <UploadCloud className="size-7 text-muted-foreground" />}
            <span className="text-[13px] font-semibold text-ink">{single ? 'Upload image' : urls.length ? 'Add more photos' : 'Upload photos'}</span>
            <span className="px-2 text-[11px] text-muted-foreground">{single ? 'Click or drop an image' : `Click or drop · up to ${limit}`}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {!single && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          {urls.length}/{limit} photos{pendingCount > 0 && ` · ${pendingCount} uploading`} · Drag to reorder · The first photo is the cover shown in listings. Photos are compressed automatically.
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {errors.map((e, i) => (
            <li key={i} className="rounded-md bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand">
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
