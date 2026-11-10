'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CarView } from '@/lib/data';

const MAX_COMPARE = 3;

type ShortlistState = {
  wishlist: number[];
  compare: CarView[];
  toggleWishlist: (id: number) => void;
  toggleCompare: (car: CarView) => void;
  clearCompare: () => void;
  setCompare: (cars: CarView[]) => void;
  maxCompare: number;
};

const ShortlistContext = createContext<ShortlistState | null>(null);

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<CarView[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rd-wishlist-v2') || '[]');
      if (Array.isArray(saved)) setWishlist(saved.filter((x) => typeof x === 'number'));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const toggleWishlist = (id: number) =>
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('rd-wishlist-v2', JSON.stringify(next));
      return next;
    });

  const toggleCompare = (car: CarView) =>
    setCompare((prev) => {
      if (prev.some((c) => c.id === car.id)) return prev.filter((c) => c.id !== car.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, car];
    });

  return (
    <ShortlistContext.Provider
      value={{ wishlist, compare, toggleWishlist, toggleCompare, clearCompare: () => setCompare([]), setCompare: (cars) => setCompare(cars.slice(0, MAX_COMPARE)), maxCompare: MAX_COMPARE }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error('useShortlist must be used inside ShortlistProvider');
  return ctx;
}
