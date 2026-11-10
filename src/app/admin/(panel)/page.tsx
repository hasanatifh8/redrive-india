import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { AlertTriangle, ArrowRight, CarFront, Eye, IndianRupee, Inbox, Plus, TrendingUp } from 'lucide-react';
import { databaseHost, db, schema } from '@/db';
import { finalPrice, formatPrice } from '@/lib/pricing';
import { LEAD_STATUSES, LEAD_TYPES } from '@/lib/constants';
import { Badge, Card, PageHeader, btn } from '@/components/admin/ui';

export const metadata = { title: 'Dashboard' };

const DAY = 86400000;
const timeAgo = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

export default async function Dashboard() {
  const [cars, leads, images] = await Promise.all([
    db.select().from(schema.cars),
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)),
    db.select({ carId: schema.carImages.carId }).from(schema.carImages),
  ]);

  const now = Date.now();
  const live = cars.filter((c) => c.status === 'available' || c.status === 'reserved');
  const stockValue = live.reduce((a, c) => a + finalPrice(c), 0);
  const soldThisMonth = cars.filter((c) => c.status === 'sold' && c.soldAt && c.soldAt.getMonth() === new Date().getMonth() && c.soldAt.getFullYear() === new Date().getFullYear());
  const soldValue = soldThisMonth.reduce((a, c) => a + finalPrice(c), 0);
  const newLeads = leads.filter((l) => l.status === 'new');
  const week = leads.filter((l) => now - l.createdAt.getTime() < 7 * DAY);
  const won = leads.filter((l) => l.status === 'won').length;
  const closed = leads.filter((l) => l.status === 'won' || l.status === 'lost').length;
  const withPhotos = new Set(images.map((i) => i.carId));
  const noPhotos = live.filter((c) => !withPhotos.has(c.id));
  const topViewed = [...live].sort((a, b) => b.views - a.views).slice(0, 5);
  const last30 = leads.filter((l) => now - l.createdAt.getTime() < 30 * DAY);
  const byType = LEAD_TYPES.map((t) => ({ ...t, n: last30.filter((l) => l.type === t.value).length }));
  const maxType = Math.max(1, ...byType.map((t) => t.n));

  // Leads per day, last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * DAY);
    start.setHours(0, 0, 0, 0);
    const end = start.getTime() + DAY;
    return { label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), n: leads.filter((l) => l.createdAt.getTime() >= start.getTime() && l.createdAt.getTime() < end).length };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));

  const stats = [
    { label: 'Cars in stock', value: live.length, sub: `${cars.filter((c) => c.status === 'reserved').length} reserved · ${cars.filter((c) => c.status === 'draft').length} drafts`, Icon: CarFront, href: '/admin/cars' },
    { label: 'Stock value', value: formatPrice(stockValue), sub: 'At current selling prices', Icon: IndianRupee, href: '/admin/cars' },
    { label: 'New leads', value: newLeads.length, sub: `${week.length} in the last 7 days`, Icon: Inbox, href: '/admin/leads?status=new' },
    { label: 'Sold this month', value: soldThisMonth.length, sub: `${formatPrice(soldValue)} · ${closed ? Math.round((won / closed) * 100) : 0}% lead win rate`, Icon: TrendingUp, href: '/admin/cars?status=sold' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Database: ${databaseHost}`}
        actions={
          <Link href="/admin/cars/new" className={btn.primary}>
            <Plus className="size-4" />
            Add car
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, href }) => (
          <Link key={label} href={href} className="rd-card group p-5 transition hover:border-brand/40">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="size-[18px]" />
              </span>
            </div>
            <p className="mt-2 font-heading text-[28px] leading-tight font-semibold text-ink">{value}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{sub}</p>
          </Link>
        ))}
      </div>

      {noPhotos.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            <strong>{noPhotos.length}</strong> live {noPhotos.length === 1 ? 'car has' : 'cars have'} no photos:{' '}
            {noPhotos.slice(0, 4).map((c, i) => (
              <span key={c.id}>
                {i > 0 && ', '}
                <Link href={`/admin/cars/${c.id}`} className="font-semibold underline">
                  {c.brand} {c.model}
                </Link>
              </span>
            ))}
            {noPhotos.length > 4 && ` and ${noPhotos.length - 4} more`}
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card
          title="Latest leads"
          actions={
            <Link href="/admin/leads" className="flex items-center gap-1 text-[13px] font-semibold text-brand">
              All leads <ArrowRight className="size-4" />
            </Link>
          }
        >
          {leads.length ? (
            <ul className="divide-y divide-border">
              {leads.slice(0, 7).map((l) => {
                const st = LEAD_STATUSES.find((s) => s.value === l.status)!;
                return (
                  <li key={l.id}>
                    <Link href={`/admin/leads?open=${l.id}`} className="flex items-center gap-3 py-3 hover:bg-page/60">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">{l.name[0]?.toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {l.name} <span className="font-normal text-muted-foreground">· {LEAD_TYPES.find((t) => t.value === l.type)?.label}</span>
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">{l.carLabel || l.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={st.cls}>{st.label}</Badge>
                        <span className="text-[11px] text-muted-foreground">{timeAgo(l.createdAt)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-[14px] text-muted-foreground">No leads yet. They’ll appear here when customers send enquiries.</p>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Leads — last 14 days">
            <div className="flex h-32 items-end gap-1">
              {days.map((d) => (
                <div key={d.label} className="group relative flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.n}`}>
                  <div className="w-full rounded-t bg-brand/80 transition group-hover:bg-brand" style={{ height: `${Math.max(4, (d.n / maxDay) * 100)}%`, opacity: d.n ? 1 : 0.2 }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{days[0].label}</span>
              <span>Today</span>
            </div>
          </Card>

          <Card title="Leads by type — last 30 days">
            <ul className="flex flex-col gap-2.5">
              {byType.map((t) => (
                <li key={t.value} className="text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-ink">{t.label}</span>
                    <span className="font-semibold text-ink">{t.n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(t.n / maxType) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Most viewed cars">
            <ul className="flex flex-col gap-2">
              {topViewed.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/cars/${c.id}`} className="flex items-center justify-between gap-2 text-[14px] hover:text-brand">
                    <span className="truncate">
                      {c.year} {c.brand} {c.model}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground">
                      <Eye className="size-3.5" />
                      {c.views}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
