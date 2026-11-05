import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rd-container flex min-h-screen flex-col items-center justify-center gap-3 bg-page py-24 text-center">
      <img src="/images/logo-dark.png" alt="REDRIVE INDIA" className="mb-4 h-14" />
      <span className="rd-eyebrow">404</span>
      <h1 className="text-[30px] font-semibold text-ink">Page not found</h1>
      <p className="text-muted-foreground">The page you’re looking for doesn’t exist or the car has been sold.</p>
      <Link href="/buy-cars" className="mt-3 flex h-11 items-center rounded-lg bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-dark">
        Browse cars
      </Link>
    </div>
  );
}
