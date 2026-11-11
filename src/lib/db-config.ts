// Which database to use — shared by the app, the deploy script and the CLI tools.
//
// IMPORTANT: Vercel's Turso integration can inject a brand-new, empty "per-deployment"
// database (host starting with "dpl-") into TURSO_DATABASE_URL on every deploy. Data written
// there is lost on the next deploy. So we prefer DATABASE_URL / DATABASE_AUTH_TOKEN, which
// point at ONE permanent database, and refuse to run production on a per-deployment database.

export function resolveDatabase() {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = process.env.DATABASE_URL ? process.env.DATABASE_AUTH_TOKEN : process.env.TURSO_AUTH_TOKEN;
  const host = url.startsWith('file:') ? url : new URL(url.replace(/^libsql:/, 'https:')).host;
  const perDeployment = /^dpl-/.test(host);
  return { url, authToken, host, perDeployment };
}

/** Throws a clear error when production would use a missing or throwaway database. */
export function assertSafeDatabase() {
  const { url, host, perDeployment } = resolveDatabase();
  if (!process.env.VERCEL) return;
  if (url.startsWith('file:')) {
    throw new Error('No database configured for this deployment. Set DATABASE_URL and DATABASE_AUTH_TOKEN in Vercel → Settings → Environment Variables.');
  }
  if (perDeployment && process.env.VERCEL_ENV === 'production') {
    throw new Error(
      `Refusing to use a temporary per-deployment database (${host}) in production — its data would be lost on the next deploy. ` +
        'Set DATABASE_URL and DATABASE_AUTH_TOKEN (Vercel → Settings → Environment Variables) to your permanent Turso database.',
    );
  }
}
