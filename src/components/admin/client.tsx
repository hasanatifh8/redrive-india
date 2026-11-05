'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { btn } from './ui';

export function SubmitButton({ children, className = btn.primary }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Runs a server action after an optional confirm() prompt, then refreshes. */
export function ActionButton({
  action,
  confirm: confirmText,
  children,
  className = btn.ghost,
  title,
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          await action();
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Toast({ message, ok = true }: { message: string; ok?: boolean }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [message]);
  if (!show) return null;
  return (
    <div className="animate-rd-rise fixed right-4 bottom-4 z-[70] flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-[14px] font-medium text-white shadow-2xl">
      {ok ? <CheckCircle2 className="size-5 text-emerald-400" /> : <XCircle className="size-5 text-[#FF6B7F]" />}
      {message}
    </div>
  );
}

/** Shows a toast for ?saved=… in the URL, then strips the param. */
export function SavedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = params.get('saved');
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!saved) return;
    setMsg(`Saved ${saved}`);
    const next = new URLSearchParams(params.toString());
    next.delete('saved');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  }, [saved, params, pathname, router]);
  return msg ? <Toast message={msg} /> : null;
}
