import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'REDRIVE INDIA – Premium Pre-Owned Cars | Kalindipuram, Prayagraj',
    template: '%s | REDRIVE INDIA, Prayagraj',
  },
  description:
    'Buy, sell or exchange pre-owned cars at REDRIVE INDIA, 120 Feet Road, Kalindipuram, Prayagraj. Verified cars, fair deals, transparent process.',
  openGraph: { siteName: 'REDRIVE INDIA', type: 'website', locale: 'en_IN', images: ['/images/signage-gate.jpg'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
