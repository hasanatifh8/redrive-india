import { desc } from 'drizzle-orm';
import { db, schema } from '@/db';
import { PageHeader } from '@/components/admin/ui';
import ReferralManager, { type CodeRow } from './ReferralManager';

export const metadata = { title: 'Referral codes' };

export default async function ReferralsPage() {
  const [codes, leads] = await Promise.all([
    db.select().from(schema.referralCodes).orderBy(desc(schema.referralCodes.createdAt)),
    db.select({ code: schema.leads.referralCode, status: schema.leads.status, rewardPaid: schema.leads.rewardPaid }).from(schema.leads),
  ]);

  const rows: CodeRow[] = codes.map((c) => {
    const mine = leads.filter((l) => l.code === c.code);
    const won = mine.filter((l) => l.status === 'won');
    return {
      ...c,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : '',
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      leadCount: mine.length,
      wonCount: won.length,
      rewardsOwed: won.filter((l) => !l.rewardPaid).length * c.rewardAmount,
    };
  });

  return (
    <>
      <PageHeader
        title="Referral & coupon codes"
        description="Give customers a discount code, track who referred them, and keep tabs on rewards you owe referrers."
      />
      <ReferralManager rows={rows} />
    </>
  );
}
