'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Loader2, Lock } from 'lucide-react';
import { login, type ActionResult } from '../actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-semibold text-white hover:bg-brand-dark disabled:opacity-70">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
      Sign in
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState<ActionResult, FormData>(login, null);
  return (
    <form action={action} className="rd-card flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Admin panel</h1>
        <p className="text-[14px] text-muted-foreground">Sign in to manage cars, leads and offers.</p>
      </div>
      <input type="hidden" name="next" value={next ?? '/admin'} />
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-[12px] font-medium text-muted-foreground">
          Password
        </label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="rd-input" />
      </div>
      {state && !state.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">{state.message}</p>}
      <Submit />
    </form>
  );
}
