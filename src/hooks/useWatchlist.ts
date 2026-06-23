import { useState, useCallback } from 'react';
import type { WatchlistItem } from '@/types';

const STORAGE_KEY = 'pf_watchlist_v1';

function load(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full — ignore
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(load);

  const add = useCallback((ticker: string, targetBuyPrice?: number, note?: string) => {
    setItems((prev) => {
      if (prev.some((i) => i.ticker === ticker.toUpperCase())) return prev;
      const next = [
        ...prev,
        { ticker: ticker.toUpperCase(), addedAt: new Date().toISOString(), targetBuyPrice, note },
      ];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.ticker !== ticker.toUpperCase());
      save(next);
      return next;
    });
  }, []);

  const update = useCallback((ticker: string, patch: Partial<Pick<WatchlistItem, 'targetBuyPrice' | 'note'>>) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.ticker === ticker ? { ...i, ...patch } : i));
      save(next);
      return next;
    });
  }, []);

  return { items, add, remove, update };
}
