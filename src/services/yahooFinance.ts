import type { QuoteData, HistoricalDataPoint, FundamentalData } from '@/types';

const BASE = '/api/yahoo';
const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function yfetch(url: string): Promise<unknown> {
  const res = await withTimeout(fetch(url), TIMEOUT_MS);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

interface YFv7Result {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  dividendYield?: number;
  epsTrailingTwelveMonths?: number;
  sector?: string;
  industry?: string;
}

export async function fetchQuotes(tickers: string[]): Promise<QuoteData[]> {
  const symbols = tickers.join(',');
  const url = `${BASE}/v7/finance/quote?symbols=${symbols}&fields=shortName,longName,regularMarketPrice,regularMarketPreviousClose,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,trailingPE,forwardPE,beta,fiftyTwoWeekHigh,fiftyTwoWeekLow,dividendYield,epsTrailingTwelveMonths,sector,industry`;

  const data = (await yfetch(url)) as {
    quoteResponse?: { result?: YFv7Result[]; error?: unknown };
  };

  const results = data?.quoteResponse?.result ?? [];
  return results.map((r) => ({
    ticker: r.symbol,
    name: r.longName ?? r.shortName ?? r.symbol,
    price: r.regularMarketPrice ?? 0,
    previousClose: r.regularMarketPreviousClose ?? 0,
    change: r.regularMarketChange ?? 0,
    changePercent: (r.regularMarketChangePercent ?? 0) / 100,
    marketCap: r.marketCap,
    volume: r.regularMarketVolume,
    pe: r.trailingPE,
    forwardPE: r.forwardPE,
    beta: r.beta,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    dividendYield: r.dividendYield,
    eps: r.epsTrailingTwelveMonths,
    sector: r.sector,
    industry: r.industry,
  }));
}

// ─── Historical ───────────────────────────────────────────────────────────────

type YFRange = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

export async function fetchHistorical(
  ticker: string,
  range: YFRange = '1y'
): Promise<HistoricalDataPoint[]> {
  const url = `${BASE}/v8/finance/chart/${ticker}?interval=1d&range=${range}&includeAdjustedClose=true`;
  const data = (await yfetch(url)) as {
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
    const url = `${BASE}/v10/finance/quoteSummary/${ticker}?modules=${modules}`;
    const data = (await yfetch(url)) as { quoteSummary?: { result?: YFSummary[] } };

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
