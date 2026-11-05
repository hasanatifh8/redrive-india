import { put, del } from '@vercel/blob';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.uploads');
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** Stores an image and returns its public URL (Vercel Blob in production, local folder in dev). */
export async function saveImage(file: File, folder: string) {
  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
  const name = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  if (useBlob()) {
    const blob = await put(name, file, { access: 'public', contentType: file.type });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error('BLOB_READ_WRITE_TOKEN is not set — connect a Vercel Blob store to this project.');
  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Best-effort delete of images we stored; bundled /images/* assets are left alone. */
export async function deleteImages(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        if (url.includes('.blob.vercel-storage.com')) {
          if (useBlob()) await del(url);
        } else if (url.startsWith('/uploads/')) {
          const rel = url.slice('/uploads/'.length);
          const target = path.join(LOCAL_UPLOAD_DIR, rel);
          if (target.startsWith(LOCAL_UPLOAD_DIR)) await unlink(target);
        }
      } catch {
        /* already gone */
      }
    }),
  );
}
