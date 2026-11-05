'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useFormState } from 'react-dom';
import { CheckCircle2, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { submitLead, type LeadState } from '@/app/(site)/actions';
import { BRANDS, FUELS, OWNERS, TRANSMISSIONS } from '@/lib/constants';
import { compressImage } from '@/lib/compress-image';
import { telHref, waHref } from '@/lib/settings-defaults';
import { useSettings } from './SettingsProvider';
import { WhatsAppIcon } from './BrandIcons';

const MAX_PHOTOS = 8;
const MAX_TOTAL = 3.6 * 1024 * 1024; // stay under the server's 4 MB request limit

type Photo = { id: string; file: File; preview: string };

const Label = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
    {children}
    {required && <span className="text-brand"> *</span>}
  </label>
);

export default function SellForm() {
  const [round, setRound] = useState(0);
  return <SellFormInner key={round} onReset={() => setRound((r) => r + 1)} />;
}

function SellFormInner({ onReset }: { onReset: () => void }) {
  const s = useSettings();
  const [state, dispatch] = useFormState<LeadState, FormData>(submitLead, null);
  const [pending, start] = useTransition();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [processing, setProcessing] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1994 }, (_, i) => thisYear - i);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state?.ok) top.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state]);

  const addPhotos = async (files: FileList) => {
    setPhotoError('');
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`);
    setProcessing((n) => n + list.length);
    for (const f of list) {
      try {
        const small = await compressImage(f, 1280, 0.72);
        setPhotos((p) => [...p, { id: crypto.randomUUID(), file: small, preview: URL.createObjectURL(small) }]);
      } catch (e) {
        setPhotoError(e instanceof Error ? e.message : 'Could not read one of the photos');
      } finally {
        setProcessing((n) => n - 1);
      }
    }
  };

  const removePhoto = (id: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.preview);
      return p.filter((x) => x.id !== id);
    });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (processing) return setPhotoError('Please wait — photos are still being prepared.');
    const total = photos.reduce((a, p) => a + p.file.size, 0);
    if (total > MAX_TOTAL) return setPhotoError('Photos are too large together — please remove one or two.');
    const fd = new FormData(e.currentTarget);
    photos.forEach((p) => fd.append('photos', p.file, p.file.name));
    start(() => dispatch(fd));
  };

  if (state?.ok) {
    return (
      <div ref={top} className="rd-card flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="size-14 text-emerald-600" />
        <h2 className="text-[22px] font-semibold text-ink">Thanks! We’ve received your car’s details.</h2>
        <p className="max-w-md text-[14px] text-muted-foreground">
          Our team will call you shortly to discuss your car and fix a time for inspection. Need it faster? Call{' '}
          <a href={telHref(s.phonePrimary)} className="font-semibold text-brand">
            {s.phonePrimary}
          </a>
          .
        </p>
        {state.summary && (
          <a href={waHref(s, state.summary)} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-[14px] font-semibold text-white">
            <WhatsAppIcon /> Also send on WhatsApp
          </a>
        )}
        <button type="button" onClick={onReset} className="mt-1 text-[14px] font-semibold text-brand hover:text-brand-dark">
          Sell another car
        </button>
      </div>
    );
  }

  const input = 'rd-input h-10 text-[14px]';
  const select = 'rd-select h-10 text-[14px]';

  return (
    <form onSubmit={onSubmit} className="rd-card flex flex-col gap-8 p-5 md:p-7">
      <input type="hidden" name="type" value="sell" />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {/* 1. Car details */}
      <section>
        <h2 className="text-[18px] font-semibold text-ink">1. Car details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-brand" required>Brand</Label>
            <select id="sell-brand" name="brand" required className={select} defaultValue="">
              <option value="" disabled>Select brand</option>
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
              <option>Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-model" required>Model</Label>
            <input id="sell-model" name="model" required placeholder="e.g. Creta" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-variant">Variant</Label>
            <input id="sell-variant" name="variant" placeholder="e.g. SX (O)" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-mfg" required>Manufacturing year</Label>
            <select id="sell-mfg" name="manufacturingYear" required className={select} defaultValue="">
              <option value="" disabled>Select year</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-reg">Registration year</Label>
            <select id="sell-reg" name="registrationYear" className={select} defaultValue="">
              <option value="">Select year</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-km" required>Kilometres driven</Label>
            <input id="sell-km" name="kilometres" type="number" min={0} required inputMode="numeric" placeholder="e.g. 35000" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-fuel" required>Fuel type</Label>
            <select id="sell-fuel" name="fuel" required className={select} defaultValue="">
              <option value="" disabled>Select fuel</option>
              {FUELS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-trans" required>Transmission</Label>
            <select id="sell-trans" name="transmission" required className={select} defaultValue="">
              <option value="" disabled>Select</option>
              {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-owner" required>Ownership</Label>
            <select id="sell-owner" name="ownership" required className={select} defaultValue="">
              <option value="" disabled>Select</option>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-city" required>Registration city</Label>
            <input id="sell-city" name="registrationCity" required defaultValue="Prayagraj" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-price">Expected selling price (₹)</Label>
            <input id="sell-price" name="expectedPrice" type="number" min={0} inputMode="numeric" placeholder="e.g. 650000" className={input} />
            <p className="text-[12px] text-muted-foreground">Optional — we discuss price after inspection.</p>
          </div>
        </div>
      </section>

      {/* 2. Photos */}
      <section>
        <h2 className="text-[18px] font-semibold text-ink">2. Upload car photos</h2>
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-brand"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {Array.from({ length: processing }).map((_, i) => (
              <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
        {photos.length + processing < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addPhotos(e.dataTransfer.files);
            }}
            className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-page/60 px-4 py-10 text-center transition hover:border-brand hover:bg-brand-soft/40"
          >
            <ImagePlus className="size-7 text-brand" />
            <span className="text-[14px] font-medium text-ink">
              {photos.length ? `Add more photos (${photos.length}/${MAX_PHOTOS})` : `Tap to add photos (up to ${MAX_PHOTOS})`}
            </span>
            <span className="text-[12px] text-muted-foreground">Front, rear, sides, interior &amp; odometer.</span>
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addPhotos(e.target.files);
            e.target.value = '';
          }}
        />
        {photoError && <p className="mt-2 text-[13px] font-medium text-brand">{photoError}</p>}
      </section>

      {/* 3. Your details */}
      <section>
        <h2 className="text-[18px] font-semibold text-ink">3. Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-name" required>Customer name</Label>
            <input id="sell-name" name="name" required autoComplete="name" placeholder="Your full name" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sell-phone" required>Mobile number</Label>
            <input id="sell-phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" className={input} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="sell-notes">Additional details</Label>
            <textarea id="sell-notes" name="notes" rows={3} placeholder="Service history, accident history, insurance, loan status…" className="rd-input h-auto py-2 text-[14px]" />
          </div>
        </div>
      </section>

      {state && !state.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">{state.message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? (photos.length ? 'Uploading photos…' : 'Sending…') : 'Submit Sell Enquiry'}
        </button>
        <p className="text-[12px] text-muted-foreground">We’ll only use your number to contact you about this car.</p>
      </div>
    </form>
  );
}
