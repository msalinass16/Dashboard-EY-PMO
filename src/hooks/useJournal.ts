import { useState, useCallback } from 'react';
import type { JournalEntry } from '@/types';

const STORAGE_KEY = 'pf_journal_v1';

function load(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: JournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(load);

  const add = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    setEntries((prev) => {
      const next = [{ ...entry, id: uid() }, ...prev];
      save(next);
      return next;
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<JournalEntry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { entries, add, update, remove };
}
