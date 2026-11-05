import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Admin login', robots: { index: false } };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4">
      <div className="rd-dots absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-brand/25 blur-[120px]" aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <img src="/images/logo-light.png" alt="REDRIVE INDIA" className="mx-auto mb-8 h-16" />
        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
