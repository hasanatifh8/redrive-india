'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { SearchItem } from '@/lib/search';
import { getSearchIndex } from '@/app/(site)/actions';
import CarSearchBox from './CarSearchBox';

// Loaded once per visit, then reused every time the window opens.
let cache: SearchItem[] | null = null;

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<SearchItem[] | null>(cache);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    if (!cache) getSearchIndex().then((r) => setItems((cache = r)));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = (query: string) => {
    onClose();
    router.push(query.trim() ? `/buy-cars?q=${encodeURIComponent(query.trim())}` : '/buy-cars');
  };

  return (
    <div className="animate-rd-fade fixed inset-0 z-[70] flex items-start justify-center bg-ink/70 p-3 pt-[8vh] backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Search cars" className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="flex-1">
            <CarSearchBox items={items} value={q} onChange={setQ} onSubmit={submit} autoFocus mode="panel" onNavigate={onClose} />
          </div>
          <button type="button" onClick={onClose} aria-label="Close search" className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 bg-page/70 px-4 py-2 text-[12px] text-muted-foreground">
          <span className="hidden sm:inline">
            <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-sans">↑</kbd>{' '}
            <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-sans">↓</kbd> to move ·{' '}
            <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-sans">Enter</kbd> to open ·{' '}
            <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-sans">Esc</kbd> to close
          </span>
          <span>Try “Creta”, “automatic diesel” or “SUV under 15 lakh”</span>
        </div>
      </div>
    </div>
  );
}
