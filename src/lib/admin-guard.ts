import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './auth';

export async function isAdmin() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin server action / route — middleware alone doesn't cover actions. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}
