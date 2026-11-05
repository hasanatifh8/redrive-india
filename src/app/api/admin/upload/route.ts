import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-guard';
import { saveImage } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB; the browser compresses first.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') || 'cars').replace(/[^a-z0-9-]/gi, '') || 'cars';

  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP or AVIF images' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image is larger than 4 MB after compression' }, { status: 400 });

  try {
    const url = await saveImage(file, folder);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
  }
}
