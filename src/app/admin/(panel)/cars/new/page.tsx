import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CarForm from '@/components/admin/CarForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Add car' };

export default function NewCarPage() {
  return (
    <>
      <Link href="/admin/cars" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-brand">
        <ChevronLeft className="size-4" /> Cars
      </Link>
      <PageHeader title="Add a car" description="Fill in the details, upload photos, set the price — it goes live as soon as you publish." />
      <CarForm />
    </>
  );
}
