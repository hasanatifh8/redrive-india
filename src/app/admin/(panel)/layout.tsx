import type { Metadata } from 'next';
import { count, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireAdmin } from '@/lib/admin-guard';
import AdminNav from '@/components/admin/AdminNav';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.status, 'new'));
  return (
    <div className="min-h-screen bg-page lg:flex">
      <AdminNav newLeads={n} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
