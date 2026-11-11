// Download a backup file (admin only — also protected by middleware).
import { isAdmin } from '@/lib/admin-guard';
import { readBackup } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  try {
    const text = await readBackup(params.name);
    return new Response(text, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="redrive-${params.name}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Backup not found', { status: 404 });
  }
}
