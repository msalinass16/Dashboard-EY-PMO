import type { QuoteData, HistoricalDataPoint, FundamentalData } from '@/types';

const YF_BASE = 'https://query1.finance.yahoo.com';
const TIMEOUT_MS = 12_000;

// Build a URL for the given Yahoo Finance path.
// Dev  → Vite dev-server proxy  (/api/yahoo/…)
// Prod → Vercel Edge function    (/api/yahoo/…)  [same path, different handler]
function yfUrl(path: string): string {
  return `/api/yahoo/${path}`;
}

// Public CORS proxy fallback — used only when the primary route returns blocked HTML.
function corsProxyUrl(path: string): string {
  return `https://corsproxy.io/?url=${encodeURIComponent(`${YF_BASE}/${path}`)}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function attemptFetch(url: string): Promise<unknown> {
  const res = await withTimeout(fetch(url), TIMEOUT_MS);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // Yahoo Finance sometimes returns an HTML consent/block page with 200 status
  if (text.trimStart().startsWith('<')) throw new Error('Blocked — received HTML');
  return JSON.parse(text);
}

// Try Edge function first; fall back to public CORS proxy if blocked.
async function yfetch(path: string): Promise<unknown> {
  try {
    return await attemptFetch(yfUrl(path));
  } catch {
    // Edge function blocked or failed — try public CORS proxy
    return await attemptFetch(corsProxyUrl(path));
  }
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

// Uses v8/finance/chart per ticker — more reliable than v7/finance/quote batch
// which now requires Yahoo authentication in many regions.
async function fetchSingleQuote(ticker: string): Promise<QuoteData> {
  const data = (await yfetch(`v8/finance/chart/${ticker}?interval=1d&range=5d&includeAdjustedClose=true`)) as {
    chart?: { result?: Array<{
      meta?: {
        symbol?: string;
        longName?: string;
        shortName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketVolume?: number;
        marketCap?: number;
        trailingPE?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        dividendYield?: number;
        exchangeTimezoneName?: string;
      };
      indicators?: { adjclose?: Array<{ adjclose?: number[] }> };
    }> };
  };

  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${ticker}`);

  const meta = result.meta ?? {};
  const closes = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? closes[closes.length - 2] ?? price;
  const change = price - prevClose;

  return {
    ticker,
    name: meta.longName ?? meta.shortName ?? ticker,
    price,
    previousClose: prevClose,
    change,
    changePercent: prevClose > 0 ? change / prevClose : 0,
    marketCap: meta.marketCap,
    volume: meta.regularMarketVolume,
    pe: meta.trailingPE,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    dividendYield: meta.dividendYield,
  };
}

export async function fetchQuotes(tickers: string[]): Promise<QuoteData[]> {
  const results = await Promise.allSettled(tickers.map(fetchSingleQuote));
  return results
    .filter((r): r is PromiseFulfilledResult<QuoteData> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// ─── Historical ───────────────────────────────────────────────────────────────

type YFRange = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

export async function fetchHistorical(
  ticker: string,
  range: YFRange = '1y'
): Promise<HistoricalDataPoint[]> {
  const data = (await yfetch(`v8/finance/chart/${ticker}?interval=1d&range=${range}&includeAdjustedClose=true`)) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          adjclose?: Array<{ adjclose?: number[] }>;
          quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }>;
        };
      }>;
    };
  };

  const result = data?.chart?.result?.[0];
  if (!result) return [];

  const timestamps = result.timestamp ?? [];
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const open = result.indicators?.quote?.[0]?.open ?? [];
  const high = result.indicators?.quote?.[0]?.high ?? [];
  const low = result.indicators?.quote?.[0]?.low ?? [];
  const volume = result.indicators?.quote?.[0]?.volume ?? [];

  const points: HistoricalDataPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = adjclose[i];
    if (close == null) continue;
    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      timestamp: timestamps[i] * 1000,
      close,
      open: open[i] ?? undefined,
      high: high[i] ?? undefined,
      low: low[i] ?? undefined,
      volume: volume[i] ?? undefined,
    });
  }
  return points;
}

// ─── Fundamentals ─────────────────────────────────────────────────────────────

interface YFSummary {
  price?: {
    marketCap?: { raw?: number };
    regularMarketPrice?: { raw?: number };
    beta?: { raw?: number };
    fiftyTwoWeekHigh?: { raw?: number };
    fiftyTwoWeekLow?: { raw?: number };
  };
  summaryDetail?: {
    trailingPE?: { raw?: number };
    dividendYield?: { raw?: number };
    payoutRatio?: { raw?: number };
    marketCap?: { raw?: number };
  };
  defaultKeyStatistics?: {
    forwardPE?: { raw?: number };
    pegRatio?: { raw?: number };
    enterpriseToEbitda?: { raw?: number };
    enterpriseToRevenue?: { raw?: number };
    priceToBook?: { raw?: number };
    beta?: { raw?: number };
    enterpriseValue?: { raw?: number };
  };
  financialData?: {
    currentPrice?: { raw?: number };
    revenueGrowth?: { raw?: number };
    earningsGrowth?: { raw?: number };
    grossMargins?: { raw?: number };
    operatingMargins?: { raw?: number };
    profitMargins?: { raw?: number };
    returnOnEquity?: { raw?: number };
    returnOnAssets?: { raw?: number };
    totalRevenue?: { raw?: number };
    netIncome?: { raw?: number };
    totalDebt?: { raw?: number };
    totalCash?: { raw?: number };
    freeCashflow?: { raw?: number };
    targetHighPrice?: { raw?: number };
    targetLowPrice?: { raw?: number };
    targetMeanPrice?: { raw?: number };
    recommendationMean?: { raw?: number };
    recommendationKey?: string;
    numberOfAnalystOpinions?: { raw?: number };
  };
  assetProfile?: {
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
    fullTimeEmployees?: number;
    website?: string;
  };
}

export async function fetchFundamentals(ticker: string): Promise<FundamentalData | null> {
  const modules = [
    'price',
    'summaryDetail',
    'defaultKeyStatistics',
    'financialData',
    'assetProfile',
  ].join(',');

  try {
    const data = (await yfetch(`v10/finance/quoteSummary/${ticker}?modules=${modules}`)) as { quoteSummary?: { result?: YFSummary[] } };

    const s = data?.quoteSummary?.result?.[0];
    if (!s) return null;

    const price = s.price;
    const summary = s.summaryDetail;
    const stats = s.defaultKeyStatistics;
    const fin = s.financialData;
    const profile = s.assetProfile;

    const marketCap = price?.marketCap?.raw ?? summary?.marketCap?.raw;
    const freeCashflow = fin?.freeCashflow?.raw;
    const fcfYield =
      freeCashflow != null && marketCap != null && marketCap > 0
        ? freeCashflow / marketCap
        : undefined;

    return {
      ticker,
      pe: summary?.trailingPE?.raw,
      forwardPE: stats?.forwardPE?.raw,
      pegRatio: stats?.pegRatio?.raw,
      evToEbitda: stats?.enterpriseToEbitda?.raw,
      priceToBook: stats?.priceToBook?.raw,
      priceToSales: stats?.enterpriseToRevenue?.raw,
      revenueGrowth: fin?.revenueGrowth?.raw,
      earningsGrowth: fin?.earningsGrowth?.raw,
      grossMargin: fin?.grossMargins?.raw,
      operatingMargin: fin?.operatingMargins?.raw,
      netMargin: fin?.profitMargins?.raw,
      roe: fin?.returnOnEquity?.raw,
      roic: fin?.returnOnAssets?.raw, // approximation when ROIC unavailable
      freeCashflowYield: fcfYield,
      dividendYield: summary?.dividendYield?.raw,
      description: profile?.longBusinessSummary,
      sector: profile?.sector,
      industry: profile?.industry,
      employees: profile?.fullTimeEmployees,
      website: profile?.website,
      marketCap,
      beta: price?.beta?.raw ?? stats?.beta?.raw,
      fiftyTwoWeekHigh: price?.fiftyTwoWeekHigh?.raw,
      fiftyTwoWeekLow: price?.fiftyTwoWeekLow?.raw,
      analystTargetPrice: fin?.targetMeanPrice?.raw,
      analystRating: fin?.recommendationKey,
      numberOfAnalysts: fin?.numberOfAnalystOpinions?.raw,
      totalRevenue: fin?.totalRevenue?.raw,
      netIncome: fin?.netIncome?.raw,
      totalDebt: fin?.totalDebt?.raw,
      totalCash: fin?.totalCash?.raw,
      enterpriseValue: stats?.enterpriseValue?.raw,
    };
  } catch {
    return null;
  }
}
