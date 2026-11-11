import { put, del, list, get } from '@vercel/blob';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
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

/** Every stored image in a folder, with the URL format the site uses for it. */
export async function listStoredImages(folder: string): Promise<{ url: string; uploadedAt: Date; size: number }[]> {
  if (useBlob()) {
    const out: { url: string; uploadedAt: Date; size: number }[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${folder}/`, cursor, limit: 1000 });
      for (const b of page.blobs) {
        // Public stores serve the blob URL directly; private stores go through our /media route.
        const url = b.url.includes('.public.blob.vercel-storage.com') ? b.url : PRIVATE_MEDIA_PREFIX + b.pathname;
        out.push({ url, uploadedAt: new Date(b.uploadedAt), size: b.size });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  try {
    const dir = path.join(LOCAL_UPLOAD_DIR, folder);
    const files = await readdir(dir);
    return Promise.all(
      files.map(async (f) => {
        const st = await stat(path.join(dir, f));
        return { url: `/uploads/${folder}/${f}`, uploadedAt: st.mtime, size: st.size };
      }),
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ backups */
// Backups contain customer phone numbers, so in Blob they are always stored privately.

export const LOCAL_BACKUP_DIR = path.join(process.cwd(), '.backups');
export type BackupEntry = { name: string; size: number; createdAt: Date };
const safeName = (name: string) => {
  if (!/^[a-z0-9-]+\.json$/i.test(name)) throw new Error('Invalid backup name');
  return name;
};

export async function saveBackup(name: string, json: string) {
  safeName(name);
  if (useBlob()) {
    await put(`backups/${name}`, json, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  if (process.env.VERCEL) throw new Error('Blob storage is not connected — cannot save backups.');
  await mkdir(LOCAL_BACKUP_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_BACKUP_DIR, name), json);
}

export async function listBackups(): Promise<BackupEntry[]> {
  if (useBlob()) {
    const out: BackupEntry[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: 'backups/', cursor, limit: 1000 });
      for (const b of page.blobs) out.push({ name: b.pathname.slice('backups/'.length), size: b.size, createdAt: new Date(b.uploadedAt) });
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  try {
    const files = (await readdir(LOCAL_BACKUP_DIR)).filter((f) => f.endsWith('.json'));
    const out = await Promise.all(
      files.map(async (f) => {
        const st = await stat(path.join(LOCAL_BACKUP_DIR, f));
        return { name: f, size: st.size, createdAt: st.mtime };
      }),
    );
    return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

export async function readBackup(name: string) {
  safeName(name);
  if (useBlob()) {
    const res = await get(`backups/${name}`, { access: 'private' });
    if (!res || res.statusCode !== 200) throw new Error('Backup not found');
    return new Response(res.stream).text();
  }
  return readFile(path.join(LOCAL_BACKUP_DIR, name), 'utf8');
}

export async function deleteBackup(name: string) {
  safeName(name);
  if (useBlob()) return del(`backups/${name}`);
  await unlink(path.join(LOCAL_BACKUP_DIR, name)).catch(() => {});
}

/** Keeps the newest `keep` backups whose names start with `prefix`. */
export async function pruneBackups(prefix: string, keep: number) {
  const old = (await listBackups()).filter((b) => b.name.startsWith(prefix)).slice(keep);
  await Promise.all(old.map((b) => deleteBackup(b.name)));
}

export const backupStamp = (d = new Date()) => d.toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
