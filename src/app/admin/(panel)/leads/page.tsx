import { desc } from 'drizzle-orm';
import { Download } from 'lucide-react';
import { db, schema } from '@/db';
import { PageHeader, btn } from '@/components/admin/ui';
import LeadsBoard, { type LeadRow } from './LeadsBoard';

export const metadata = { title: 'Leads' };

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string; type?: string; car?: string; open?: string } }) {
  const [rows, codes, cars] = await Promise.all([
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)),
    db.select().from(schema.referralCodes),
    db.select({ id: schema.cars.id, slug: schema.cars.slug, status: schema.cars.status }).from(schema.cars),
  ]);

  const leads: LeadRow[] = rows.map((l) => {
    const rc = l.referralCode ? codes.find((c) => c.code === l.referralCode) : undefined;
    const car = l.carId ? cars.find((c) => c.id === l.carId) : undefined;
    return {
      id: l.id,
      type: l.type,
      name: l.name,
      phone: l.phone,
      carId: l.carId,
      carLabel: l.carLabel,
      carSlug: car && car.status !== 'draft' ? car.slug : null,
      referralCode: l.referralCode,
      referrer: rc ? { name: rc.referrerName, phone: rc.referrerPhone, reward: rc.rewardAmount } : null,
      details: l.details,
      images: l.images,
      status: l.status,
      notes: l.notes,
      rewardPaid: l.rewardPaid,
      createdAt: l.createdAt.toISOString(),
    };
  });

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry, test-drive request, sell and exchange request from the website."
        actions={
          <a href="/api/admin/leads-csv" className={btn.outline}>
            <Download className="size-4" />
            Export CSV
          </a>
        }
      />
      <LeadsBoard
        leads={leads}
        initial={{ status: searchParams.status ?? 'all', type: searchParams.type ?? 'all', car: searchParams.car ? Number(searchParams.car) : null, open: searchParams.open ? Number(searchParams.open) : null }}
      />
    </>
  );
}
