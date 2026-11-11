// Browser-only: compress a photo and upload it through the admin upload API.
import { compressImage } from './compress-image';

export async function uploadPhoto(file: File, folder = 'cars'): Promise<string> {
  const body = new FormData();
  body.append('file', await compressImage(file));
  body.append('folder', folder);
  const res = await fetch('/api/admin/upload', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.url as string;
}
