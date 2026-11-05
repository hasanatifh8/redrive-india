import Link from 'next/link';
import { MapPin, Navigation } from 'lucide-react';
import { getSettings } from '@/lib/data';

export default async function LocationCard({ showContactLink = true }: { showContactLink?: boolean }) {
  const s = await getSettings();
  return (
    <div className="rd-card grid overflow-hidden lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col justify-center p-6 md:p-10">
        <span className="rd-eyebrow mb-3">Location</span>
        <h2 className="text-[24px] font-semibold text-ink md:text-[28px]">Find us on 120 Feet Road</h2>
        <p className="mt-3 flex items-start gap-2 text-[15px] text-ink-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
          {s.address}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={s.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            <Navigation className="size-4" />
            Get Directions
          </a>
          {showContactLink && (
            <Link
              href="/contact"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Contact page
            </Link>
          )}
        </div>
      </div>
      {s.mapEmbedUrl ? (
        <iframe src={s.mapEmbedUrl} title="Map" loading="lazy" className="min-h-[260px] w-full border-0 lg:min-h-[340px]" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
      <div className="rd-grid-bg relative flex min-h-[260px] items-center justify-center overflow-hidden bg-[#ECEEF1] lg:min-h-[340px]">
        <div className="absolute top-1/2 left-0 h-6 w-full -translate-y-1/2 -rotate-6 bg-white/80" aria-hidden="true" />
        <div className="absolute top-0 left-1/3 h-full w-4 rotate-12 bg-white/70" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="relative flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
            <MapPin className="relative size-6" />
          </span>
          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
            <p className="text-[13px] font-semibold text-ink">{s.businessName}</p>
            <p className="text-[12px] text-muted-foreground">{s.address}</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
