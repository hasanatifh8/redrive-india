import type { MetadataRoute } from 'next';
import { getPublicCars } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const pages = ['', '/buy-cars', '/sell-your-car', '/exchange', '/offers', '/about', '/contact', '/faq'].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: 'weekly' as const,
    priority: p === '' ? 1 : 0.7,
  }));
  const cars = await getPublicCars();
  return [...pages, ...cars.map((c) => ({ url: `${base}/cars/${c.slug}`, lastModified: c.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 }))];
}
