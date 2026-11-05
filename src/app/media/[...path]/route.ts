// Serves images from a *private* Vercel Blob store. Public stores return direct blob URLs instead.
import { get } from '@vercel/blob';

export const runtime = 'nodejs';

const ALLOWED_FOLDERS = ['cars', 'offers', 'sell-leads'];

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const parts = params.path;
  if (parts.length < 2 || !ALLOWED_FOLDERS.includes(parts[0]) || parts.some((p) => p === '..' || p.includes('\\'))) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const res = await get(parts.join('/'), { access: 'private' });
    if (!res || res.statusCode !== 200) return new Response('Not found', { status: 404 });
    return new Response(res.stream, {
      headers: {
        'Content-Type': res.blob.contentType || 'image/jpeg',
        // File names are unique per upload, so they can be cached forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
