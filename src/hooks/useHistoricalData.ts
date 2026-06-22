import { useState, useEffect, useCallback } from 'react';
import type { HistoricalDataPoint, TimePeriod } from '@/types';
import { fetchHistorical } from '@/services/yahooFinance';
import { getMockHistorical } from '@/services/mockData';
import config from '@/config/dataProviders';

type YFRange = '1mo' | '3mo' | '6mo' | '1y' | '2y';

function periodToRange(period: TimePeriod): YFRange {
  switch (period) {
    case '1M': return '1mo';
    case '3M': return '3mo';
    case '6M': return '6mo';
    case 'ALL': return '2y';
    default: return '1y';
  }
}

function periodToDays(period: TimePeriod): number {
  switch (period) {
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case 'ALL': return 730;
    default: return 365;
  }
}

interface UseHistoricalDataResult {
  data: Map<string, HistoricalDataPoint[]>;
  isLoading: boolean;
  error: string | null;
  usingMock: boolean;
}

export function useHistoricalData(
  tickers: string[],
  period: TimePeriod
): UseHistoricalDataResult {
  const [data, setData] = useState<Map<string, HistoricalDataPoint[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const tickersKey = tickers.join(',');

  const load = useCallback(async () => {
    if (tickers.length === 0) return;
    setIsLoading(true);

    try {
      const range = periodToRange(period);
      const results = await Promise.allSettled(
        tickers.map((t) => fetchHistorical(t, range))
      );

      let anySuccess = false;
      const map = new Map<string, HistoricalDataPoint[]>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          map.set(tickers[i], r.value);
          anySuccess = true;
        }
      });

      if (!anySuccess) throw new Error('No historical data returned');

      // Fill gaps with mock for missing tickers
      const days = periodToDays(period);
      for (const ticker of tickers) {
        if (!map.has(ticker)) {
          map.set(ticker, getMockHistorical(ticker, days));
        }
      }

      setData(map);
      setUsingMock(false);
      setError(null);
    } catch (err) {
      if (config.enableMockFallback) {
        const days = periodToDays(period);
        const map = new Map(tickers.map((t) => [t, getMockHistorical(t, days)]));
        setData(map);
        setUsingMock(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [tickersKey, period]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, usingMock };
}
