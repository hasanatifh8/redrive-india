import { put, del } from '@vercel/blob';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.uploads');

/**
 * Vercel Blob credentials come either as BLOB_READ_WRITE_TOKEN (older stores) or as
 * BLOB_STORE_ID + Vercel's automatic OIDC token (newer stores). The SDK handles both.
 */
const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/** Private-store images are served through our own route at this prefix. */
export const PRIVATE_MEDIA_PREFIX = '/media/';

// Remembers whether the store accepts public uploads, so we only probe once per server instance.
let storeAccess: 'public' | 'private' | null = null;

/** Stores an image and returns its URL (Vercel Blob in production, local folder in dev). */
export async function saveImage(file: File, folder: string) {
  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
  const name = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  if (useBlob()) {
    if (storeAccess !== 'private') {
      try {
        const blob = await put(name, file, { access: 'public', contentType: file.type });
        storeAccess = 'public';
        return blob.url;
      } catch (e) {
        if (storeAccess === 'public') throw e;
        // Could be a private store — try that before giving up.
        try {
          await put(name, file, { access: 'private', contentType: file.type });
          storeAccess = 'private';
          return PRIVATE_MEDIA_PREFIX + name;
        } catch {
          throw e;
        }
      }
    }
    await put(name, file, { access: 'private', contentType: file.type });
    return PRIVATE_MEDIA_PREFIX + name;
  }

  if (process.env.VERCEL) throw new Error('Photo storage is not connected — connect a Vercel Blob store to this project.');
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
        } else if (url.startsWith(PRIVATE_MEDIA_PREFIX)) {
          if (useBlob()) await del(url.slice(PRIVATE_MEDIA_PREFIX.length));
        } else if (url.startsWith('/uploads/')) {
          const target = path.join(LOCAL_UPLOAD_DIR, url.slice('/uploads/'.length));
          if (target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) await unlink(target);
        }
      } catch {
        /* already gone */
      }
    }),
  );
}
