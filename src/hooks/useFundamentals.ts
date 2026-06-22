import { useState, useEffect, useCallback } from 'react';
import type { FundamentalData } from '@/types';
import { fetchFundamentals } from '@/services/yahooFinance';
import { getMockFundamentals } from '@/services/mockData';
import config from '@/config/dataProviders';

interface UseFundamentalsResult {
  fundamentals: FundamentalData | null;
  isLoading: boolean;
  error: string | null;
  usingMock: boolean;
}

export function useFundamentals(ticker: string): UseFundamentalsResult {
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    if (!ticker) return;
    setIsLoading(true);
    try {
      const data = await fetchFundamentals(ticker);
      if (data) {
        setFundamentals(data);
        setUsingMock(false);
        setError(null);
      } else {
        throw new Error('No data');
      }
    } catch {
      if (config.enableMockFallback) {
        setFundamentals(getMockFundamentals(ticker));
        setUsingMock(true);
        setError(null);
      } else {
        setError('Failed to fetch fundamentals');
      }
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    load();
  }, [load]);

  return { fundamentals, isLoading, error, usingMock };
}

// Batch version for all holdings
export function usePortfolioFundamentals(tickers: string[]): {
  fundamentals: Map<string, FundamentalData>;
  isLoading: boolean;
  usingMock: boolean;
} {
  const [fundamentals, setFundamentals] = useState<Map<string, FundamentalData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const key = tickers.join(',');

  const load = useCallback(async () => {
    if (tickers.length === 0) return;
    setIsLoading(true);

    const results = await Promise.allSettled(
      tickers.map((t) => fetchFundamentals(t).catch(() => null))
    );

    let anyReal = false;
    const map = new Map<string, FundamentalData>();
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        map.set(tickers[i], r.value);
        anyReal = true;
      }
    });

    if (!anyReal && config.enableMockFallback) {
      for (const t of tickers) {
        map.set(t, getMockFundamentals(t));
      }
      setUsingMock(true);
    } else {
      // Fill gaps
      for (const t of tickers) {
        if (!map.has(t) && config.enableMockFallback) {
          map.set(t, getMockFundamentals(t));
        }
      }
      setUsingMock(!anyReal);
    }

    setFundamentals(map);
    setIsLoading(false);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { fundamentals, isLoading, usingMock };
}
