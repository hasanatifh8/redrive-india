import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import BulkImport from './BulkImport';

export const metadata = { title: 'Bulk import cars' };

export default function ImportPage() {
  return (
    <>
      <Link href="/admin/cars" className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-brand">
        <ChevronLeft className="size-4" /> Cars
      </Link>
      <PageHeader
        title="Bulk import cars"
        description="Add many cars at once from Excel or Google Sheets — with all their photos. Or export your current cars, edit prices in a sheet, and import to update them."
      />
      <BulkImport />
    </>
  );
}
