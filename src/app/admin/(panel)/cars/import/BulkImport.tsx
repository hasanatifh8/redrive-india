'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  ImagePlus,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react';
import { IMPORT_COLUMNS, normalizeRecord, parseTable, rowsToRecords, TEMPLATE_EXAMPLES, toCsv, type ImportCar, type ImportKey } from '@/lib/car-import';
import { formatKm, formatPrice } from '@/lib/pricing';
import { uploadPhoto } from '@/lib/upload-client';
import { importCarRow, type ImportResult } from '@/app/admin/actions';
import { Badge, Card, btn } from '@/components/admin/ui';

type Row = { n: number; record: Partial<Record<ImportKey, string>>; car?: ImportCar; errors: string[] };
type PhotoFile = { file: File; key: string; folder: string; stem: string; url: string };
type RowState = { phase: 'waiting' | 'photos' | 'saving' | 'done' | 'error'; done?: number; total?: number; result?: ImportResult };

const download = (name: string, text: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const trailingNumber = (s: string) => Number(s.match(/(\d+)\D*$/)?.[1] ?? 0);

/** Photos for a car: files in a folder named like the code, or files named code-1.jpg, code_2.jpg, code (3).jpg… */
function photosFor(code: string, photos: PhotoFile[]) {
  const c = code.trim().toLowerCase();
  if (!c) return [];
  return photos
    .filter((p) => p.folder === c || p.stem === c || (p.stem.startsWith(c) && /^[-_ (.]/.test(p.stem.slice(c.length))))
    .sort((a, b) => trailingNumber(a.stem) - trailingNumber(b.stem) || a.stem.localeCompare(b.stem));
}

export default function BulkImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [paste, setPaste] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [asDraft, setAsDraft] = useState(false);
  const [states, setStates] = useState<Record<number, RowState>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // Folder picking needs the non-standard webkitdirectory attribute.
  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '');
    folderInput.current?.setAttribute('directory', '');
  }, []);
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!running) return;
    const stop = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', stop);
    return () => window.removeEventListener('beforeunload', stop);
  }, [running]);

  const load = (text: string) => {
    const table = parseTable(text);
    const { records, unknown, missing } = rowsToRecords(table);
    const w: string[] = [];
    if (!table.length) w.push('No rows found. Make sure the first row has the column names (download the template to see them).');
    if (missing.length) w.push(`Missing required column(s): ${missing.join(', ')}. Check the first row has the column names.`);
    if (unknown.length) w.push(`Ignored unknown column(s): ${unknown.join(', ')}`);
    setWarnings(w);
    setRows(records.map((record, i) => ({ n: i + 2, record, ...normalizeRecord(record) })));
    setStates({});
    setFinished(false);
  };

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const added = Array.from(list)
      .filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))
      .map((file) => {
        const parts = (file.webkitRelativePath || file.name).split('/');
        return {
          file,
          folder: parts.length > 1 ? parts[parts.length - 2].toLowerCase() : '',
          stem: file.name.replace(/\.[^.]+$/, '').toLowerCase(),
          key: `${file.webkitRelativePath || file.name}-${file.size}`,
          url: URL.createObjectURL(file),
        };
      });
    setPhotos((cur) => {
      const seen = new Set(cur.map((p) => p.key));
      return [...cur, ...added.filter((p) => !seen.has(p.key))];
    });
  };

  const matched = useMemo(() => {
    const m = new Map<number, PhotoFile[]>();
    rows.forEach((r) => r.car && m.set(r.n, photosFor(r.car.photoCode, photos)));
    return m;
  }, [rows, photos]);
  const usedPhotos = new Set(Array.from(matched.values()).flat().map((p) => p.key));
  const unmatched = photos.filter((p) => !usedPhotos.has(p.key));

  const valid = rows.filter((r) => r.car);
  const invalid = rows.filter((r) => !r.car);
  const updates = valid.filter((r) => r.car!.id).length;

  const runImport = async () => {
    setRunning(true);
    setFinished(false);
    for (const r of valid) {
      if (states[r.n]?.phase === 'done') continue; // allow "retry failed" without duplicates
      const files = matched.get(r.n) ?? [];
      const urls: string[] = [];
      try {
        if (files.length) {
          setStates((s) => ({ ...s, [r.n]: { phase: 'photos', done: 0, total: files.length } }));
          // Upload 3 at a time, keep the original order.
          const out: string[] = new Array(files.length);
          let next = 0;
          let done = 0;
          const worker = async () => {
            while (next < files.length) {
              const i = next++;
              out[i] = await uploadPhoto(files[i].file);
              done++;
              setStates((s) => ({ ...s, [r.n]: { phase: 'photos', done, total: files.length } }));
            }
          };
          await Promise.all([worker(), worker(), worker()]);
          urls.push(...out);
        }
        setStates((s) => ({ ...s, [r.n]: { phase: 'saving' } }));
        const result = await importCarRow(r.record, urls, asDraft);
        setStates((s) => ({ ...s, [r.n]: { phase: result.ok ? 'done' : 'error', result } }));
      } catch (e) {
        setStates((s) => ({ ...s, [r.n]: { phase: 'error', result: { ok: false, message: e instanceof Error ? e.message : 'Failed' } } }));
      }
    }
    setRunning(false);
    setFinished(true);
  };

  const doneCount = Object.values(states).filter((s) => s.phase === 'done').length;
  const failCount = Object.values(states).filter((s) => s.phase === 'error').length;
  const progress = valid.length ? Math.round(((doneCount + failCount) / valid.length) * 100) : 0;

  const templateCsv = () => toCsv([IMPORT_COLUMNS.map((c) => c.key), ...TEMPLATE_EXAMPLES.map((e) => IMPORT_COLUMNS.map((c) => e[c.key] ?? ''))]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Step 1 */}
      <Card
        title="1. Your spreadsheet"
        description="Start from the template (or export your cars), fill it in Excel / Google Sheets, then upload the CSV — or simply copy the rows and paste them below."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => download('redrive-cars-template.csv', templateCsv())} className={btn.outline}>
              <Download className="size-4" /> Template
            </button>
            <a href="/api/admin/cars-csv" className={btn.outline}>
              <FileSpreadsheet className="size-4" /> Export current cars
            </a>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) load(await f.text());
            }}
            className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-6 text-center transition hover:border-brand hover:bg-brand-soft/40"
          >
            <Upload className="size-7 text-brand" />
            <span className="text-[14px] font-semibold text-ink">Upload CSV file</span>
            <span className="text-[12px] text-muted-foreground">Click or drop · In Excel: File → Save As → CSV</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) load(await f.text());
              e.target.value = '';
            }}
          />
          <div className="flex flex-col gap-2">
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              placeholder="…or paste rows here — select the cells in Excel / Google Sheets INCLUDING the header row, copy, and paste."
              className="rd-input h-auto flex-1 py-2 font-mono text-[12px]"
            />
            <button type="button" disabled={!paste.trim()} onClick={() => load(paste)} className={`${btn.dark} self-start`}>
              <ClipboardPaste className="size-4" /> Read pasted rows
            </button>
          </div>
        </div>
        {warnings.map((w) => (
          <p key={w} className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {w}
          </p>
        ))}
        <details className="mt-4 rounded-lg border border-border px-4 py-3 text-[13px] [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-ink">
            <Info className="size-4 text-muted-foreground" /> Column guide — what to put in each column
          </summary>
          <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {IMPORT_COLUMNS.map((c) => (
              <p key={c.key}>
                <code className="rounded bg-page px-1 font-semibold text-ink">{c.key}</code>
                {'required' in c && <span className="text-brand"> *</span>} <span className="text-muted-foreground">— {c.hint}</span>
              </p>
            ))}
          </div>
        </details>
      </Card>

      {/* Step 2 */}
      <Card
        title="2. Photos (optional)"
        description="Give each car a photo_code in the sheet (e.g. CRETA21). Then either keep its photos in a folder with that name, or name the files CRETA21-1.jpg, CRETA21-2.jpg… — the number sets the order, and the first photo becomes the main photo."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => folderInput.current?.click()} className={btn.outline}>
              <FolderOpen className="size-4" /> Choose folder
            </button>
            <button type="button" onClick={() => photoInput.current?.click()} className={btn.outline}>
              <ImagePlus className="size-4" /> Choose photos
            </button>
          </div>
        }
      >
        <input ref={folderInput} type="file" multiple className="hidden" onChange={(e) => (addPhotos(e.target.files), (e.target.value = ''))} />
        <input ref={photoInput} type="file" multiple accept="image/*" className="hidden" onChange={(e) => (addPhotos(e.target.files), (e.target.value = ''))} />
        {photos.length ? (
          <div className="flex flex-wrap items-center gap-3 text-[14px]">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{photos.length - unmatched.length} matched</Badge>
            {unmatched.length > 0 && <Badge className="border-amber-200 bg-amber-50 text-amber-800">{unmatched.length} not matched to any car</Badge>}
            <button type="button" onClick={() => setPhotos([])} className={btn.ghost}>
              <RotateCcw className="size-3.5" /> Clear photos
            </button>
            {unmatched.length > 0 && (
              <p className="w-full text-[12px] text-muted-foreground">
                Not matched: {unmatched.slice(0, 8).map((p) => p.file.name).join(', ')}
                {unmatched.length > 8 && ` and ${unmatched.length - 8} more`} — check the photo_code column matches the folder or file names.
              </p>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Example folder:&nbsp;
            <code className="rounded bg-page px-1">Cars/CRETA21/1.jpg, 2.jpg…</code>&nbsp;and&nbsp;
            <code className="rounded bg-page px-1">Cars/SWIFT20/…</code> — choose the <strong>Cars</strong> folder.
          </p>
        )}
      </Card>

      {/* Step 3 */}
      {rows.length > 0 && (
        <Card
          title="3. Review & import"
          description={`${valid.length} ready (${valid.length - updates} new, ${updates} updates)${invalid.length ? ` · ${invalid.length} with problems will be skipped — fix them in the sheet and import again` : ''}`}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="bg-page/70 text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-2.5">Row</th>
                  <th className="p-2.5">Car</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5">Photos</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const st = states[r.n];
                  const ph = matched.get(r.n) ?? [];
                  return (
                    <tr key={r.n} className={r.car ? '' : 'bg-brand-soft/30'}>
                      <td className="p-2.5 text-muted-foreground">{r.n}</td>
                      <td className="p-2.5">
                        {r.car ? (
                          <>
                            <span className="font-semibold text-ink">
                              {r.car.year} {r.car.brand} {r.car.model}
                            </span>
                            <span className="block text-[12px] text-muted-foreground">
                              {r.car.variant || '—'} · {formatKm(r.car.km)} · {r.car.fuel} · {r.car.transmission}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-ink">{[r.record.brand, r.record.model].filter(Boolean).join(' ') || '(no name)'}</span>
                        )}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">{r.car ? formatPrice(r.car.price) : r.record.price || '—'}</td>
                      <td className="min-w-[170px] p-2.5">
                        {ph.length ? (
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            {ph.slice(0, 3).map((p) => (
                              <img key={p.key} src={p.url} alt="" className="h-8 w-11 rounded object-cover" />
                            ))}
                            {ph.length > 3 && <span className="text-[12px] text-muted-foreground">+{ph.length - 3}</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{r.car?.photoCode ? 'No match' : '—'}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {r.car ? (
                          r.car.id ? (
                            <Badge className="border-sky-200 bg-sky-50 text-sky-700">Update #{r.car.id}</Badge>
                          ) : (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">New{asDraft ? ' (draft)' : ''}</Badge>
                          )
                        ) : (
                          <Badge className="border-brand/20 bg-brand-soft text-brand">Skip</Badge>
                        )}
                      </td>
                      <td className="p-2.5">
                        {!r.car ? (
                          <span className="flex items-start gap-1 text-[12px] text-brand">
                            <XCircle className="mt-0.5 size-3.5 shrink-0" /> {r.errors.join(' · ')}
                          </span>
                        ) : st?.phase === 'photos' ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> Photos {st.done}/{st.total}
                          </span>
                        ) : st?.phase === 'saving' ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> Saving…
                          </span>
                        ) : st?.phase === 'done' ? (
                          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                            <CheckCircle2 className="size-4" /> {st.result?.action === 'updated' ? 'Updated' : 'Added'}
                            <Link href={`/admin/cars/${st.result?.id}`} className="ml-1 text-brand" title="Open">
                              <ExternalLink className="size-3.5" />
                            </Link>
                          </span>
                        ) : st?.phase === 'error' ? (
                          <span className="flex items-start gap-1 text-[12px] text-brand">
                            <XCircle className="mt-0.5 size-3.5 shrink-0" /> {st.result?.message}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[12px] text-emerald-700">
                            <CheckCircle2 className="size-3.5" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[14px] font-medium text-ink">
              <input type="checkbox" checked={asDraft} onChange={(e) => setAsDraft(e.target.checked)} disabled={running} className="size-4 accent-[var(--brand)]" />
              Import as hidden drafts (review before publishing)
            </label>
            <button type="button" disabled={running || !valid.length || (finished && failCount === 0)} onClick={runImport} className={`${btn.primary} ml-auto h-11 px-6`}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {running ? `Importing… ${progress}%` : finished && failCount ? `Retry ${failCount} failed` : `Import ${valid.length} car${valid.length === 1 ? '' : 's'}`}
            </button>
          </div>
          {(running || finished) && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              {finished && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-ink">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <strong>{doneCount}</strong> saved{failCount > 0 && <>, <strong className="text-brand">{failCount}</strong> failed (see Status)</>}.
                  <Link href="/admin/cars" className="font-semibold text-brand">
                    Go to Cars →
                  </Link>
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
