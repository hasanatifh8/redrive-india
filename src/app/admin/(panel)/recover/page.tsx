import { getOrphanPhotos } from '@/app/admin/actions';
import { PageHeader } from '@/components/admin/ui';
import RecoverPhotos, { type PhotoGroup } from './RecoverPhotos';

export const metadata = { title: 'Recover from photos' };

const GAP_MS = 20 * 60 * 1000; // a pause of 20+ minutes between uploads starts a new car

export default async function RecoverPage() {
  const photos = await getOrphanPhotos().catch(() => null);

  const groups: PhotoGroup[] = [];
  for (const p of photos ?? []) {
    const last = groups[groups.length - 1];
    if (last && p.uploadedAt.getTime() - new Date(last.end).getTime() <= GAP_MS) {
      last.urls.push(p.url);
      last.end = p.uploadedAt.toISOString();
    } else {
      groups.push({ start: p.uploadedAt.toISOString(), end: p.uploadedAt.toISOString(), urls: [p.url] });
    }
  }

  return (
    <>
      <PageHeader
        title="Recover from photos"
        description="Car photos that are still in storage but not attached to any car — grouped by when they were uploaded. Turn each group back into a car and just re-type the details."
      />
      <RecoverPhotos groups={groups.reverse()} error={photos === null} />
    </>
  );
}
