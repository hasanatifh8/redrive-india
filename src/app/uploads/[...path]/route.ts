// Serves locally uploaded images during development (production uses Vercel Blob URLs).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { LOCAL_UPLOAD_DIR } from '@/lib/storage';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const target = path.join(LOCAL_UPLOAD_DIR, ...params.path);
  if (!target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(target);
    const ext = path.extname(target).slice(1).toLowerCase();
    return new Response(data, {
      headers: { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
