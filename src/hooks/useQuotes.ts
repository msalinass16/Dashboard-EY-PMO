import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuoteData } from '@/types';
import { fetchQuotes } from '@/services/yahooFinance';
import { getMockQuotes } from '@/services/mockData';
import config from '@/config/dataProviders';

interface UseQuotesResult {
  quotes: Map<string, QuoteData>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  usingMock: boolean;
}

export function useQuotes(tickers: string[]): UseQuotesResult {
  const [quotes, setQuotes] = useState<Map<string, QuoteData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickersKey = tickers.join(',');

  const load = useCallback(async () => {
    if (tickers.length === 0) return;
    try {
      const data = await fetchQuotes(tickers);
      if (data.length > 0) {
        setQuotes(new Map(data.map((q) => [q.ticker, q])));
        setUsingMock(false);
        setError(null);
      } else {
        throw new Error('No data returned');
      }
    } catch (err) {
      if (config.enableMockFallback) {
        const mock = getMockQuotes(tickers);
        setQuotes(new Map(mock.map((q) => [q.ticker, q])));
        setUsingMock(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
      }
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [tickersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsLoading(true);
    load();
    intervalRef.current = setInterval(load, config.refreshIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { quotes, isLoading, error, lastUpdated, refresh: load, usingMock };
}
