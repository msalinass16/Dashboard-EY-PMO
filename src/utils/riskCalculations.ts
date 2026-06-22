import type { HistoricalDataPoint, PerformancePoint, RiskMetrics } from '@/types';
import { RISK_FREE_RATE } from '@/data/holdings';

export function calcDailyReturns(prices: HistoricalDataPoint[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1].close;
    const curr = prices[i].close;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  return returns;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  return a.slice(0, n).reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0) / (n - 1);
}

export function correlation(a: number[], b: number[]): number {
  const sdA = stdDev(a);
  const sdB = stdDev(b);
  if (sdA === 0 || sdB === 0) return 0;
  return covariance(a, b) / (sdA * sdB);
}

export function calcBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  const varBench = stdDev(benchmarkReturns) ** 2;
  if (varBench === 0) return 1;
  return covariance(portfolioReturns, benchmarkReturns) / varBench;
}

export function calcMaxDrawdown(prices: HistoricalDataPoint[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const p of prices) {
    if (p.close > peak) peak = p.close;
    const dd = peak > 0 ? (peak - p.close) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcAnnualizedReturn(prices: HistoricalDataPoint[]): number {
  if (prices.length < 2) return 0;
  const start = prices[0].close;
  const end = prices[prices.length - 1].close;
  const days = (prices[prices.length - 1].timestamp - prices[0].timestamp) / 86_400_000;
  const years = days / 365;
  if (start <= 0 || years <= 0) return 0;
  return (end / start) ** (1 / years) - 1;
}

export function calcSharpe(
  annualizedReturn: number,
  annualizedVolatility: number,
  riskFreeRate = RISK_FREE_RATE
): number {
  if (annualizedVolatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

export function calcAlpha(
  portfolioReturn: number,
  benchmarkReturn: number,
  beta: number,
  riskFreeRate = RISK_FREE_RATE
): number {
  return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
}

export function buildPortfolioHistory(
  holdings: Array<{ ticker: string; shares: number }>,
  historicalMap: Map<string, HistoricalDataPoint[]>
): HistoricalDataPoint[] {
  // Collect dates common to all holdings
  const dateSets = holdings
    .map((h) => new Set((historicalMap.get(h.ticker) ?? []).map((d) => d.date)))
    .filter((s) => s.size > 0);

  if (dateSets.length === 0) return [];

  const commonDates = [...dateSets[0]].filter((d) => dateSets.every((s) => s.has(d))).sort();

  return commonDates.map((date) => {
    let totalValue = 0;
    for (const h of holdings) {
      const series = historicalMap.get(h.ticker) ?? [];
      const point = series.find((d) => d.date === date);
      if (point) totalValue += h.shares * point.close;
    }
    const ts = new Date(date + 'T00:00:00').getTime();
    return { date, timestamp: ts, close: totalValue };
  });
}

export function normalizeToBase100(series: HistoricalDataPoint[]): HistoricalDataPoint[] {
  if (series.length === 0) return [];
  const base = series[0].close;
  if (base === 0) return series;
  return series.map((d) => ({ ...d, close: (d.close / base) * 100 }));
}

export function buildSpyDcaHistory(
  spyHistory: HistoricalDataPoint[],
  cashFlows: ReadonlyArray<{ date: string; amount: number }>
): HistoricalDataPoint[] {
  const spyPriceMap = new Map(spyHistory.map((d) => [d.date, d.close]));
  const sortedDates = spyHistory.map((d) => d.date).sort();

  // Find the first available trading date on or after each cash flow date
  const purchases: Array<{ date: string; shares: number }> = [];
  for (const cf of cashFlows) {
    const tradingDate = sortedDates.find((d) => d >= cf.date);
    if (!tradingDate) continue;
    const price = spyPriceMap.get(tradingDate) ?? 0;
    if (price > 0) purchases.push({ date: tradingDate, shares: cf.amount / price });
  }

  let cumulativeShares = 0;
  const result: HistoricalDataPoint[] = [];
  for (const point of spyHistory) {
    for (const purchase of purchases) {
      if (purchase.date === point.date) cumulativeShares += purchase.shares;
    }
    if (cumulativeShares > 0) {
      result.push({ date: point.date, timestamp: point.timestamp, close: cumulativeShares * point.close });
    }
  }
  return result;
}

export function buildPerformanceChart(
  portfolioHistory: HistoricalDataPoint[],
  spyHistory: HistoricalDataPoint[],
  spyDcaHistory: HistoricalDataPoint[]
): PerformancePoint[] {
  if (portfolioHistory.length === 0) return [];

  const firstDate = portfolioHistory[0].date;
  const portfolioBase = portfolioHistory[0].close;

  const spyMap = new Map(spyHistory.map((d) => [d.date, d.close]));
  const spyDcaMap = new Map(spyDcaHistory.map((d) => [d.date, d.close]));
  // Normalize SPY to 100 on the same date the portfolio starts, not SPY's earliest data
  const spyBase = spyMap.get(firstDate) ?? spyHistory[0]?.close ?? 1;

  return portfolioHistory.map((p) => ({
    date: p.date,
    portfolio: portfolioBase > 0 ? (p.close / portfolioBase) * 100 : 100,
    portfolioValue: p.close,
    spy: spyBase > 0 && spyMap.has(p.date) ? (spyMap.get(p.date)! / spyBase) * 100 : null,
    spyDcaValue: spyDcaMap.get(p.date) ?? null,
  }));
}

export function filterByPeriod<T extends { date: string }>(
  data: T[],
  period: '1M' | '3M' | '6M' | '1Y' | 'ALL',
  minDate?: string
): T[] {
  if (data.length === 0) return data;

  const floors: string[] = [];
  if (minDate) floors.push(minDate);

  if (period !== 'ALL') {
    const months = period === '1M' ? 1 : period === '3M' ? 3 : period === '6M' ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    floors.push(cutoff.toISOString().slice(0, 10));
  }

  if (floors.length === 0) return data;
  // Use the most recent floor so both minDate and period are respected
  const effectiveCutoff = floors.reduce((a, b) => (a > b ? a : b));
  return data.filter((d) => d.date >= effectiveCutoff);
}

export function calcRiskMetrics(
  portfolioHistory: HistoricalDataPoint[],
  spyHistory: HistoricalDataPoint[]
): RiskMetrics | null {
  if (portfolioHistory.length < 20) return null;

  const portfolioReturns = calcDailyReturns(portfolioHistory);
  const spyReturns = calcDailyReturns(spyHistory);

  const n = Math.min(portfolioReturns.length, spyReturns.length);
  const pRet = portfolioReturns.slice(-n);
  const sRet = spyReturns.slice(-n);

  const vol = stdDev(pRet) * Math.sqrt(252);
  const annReturn = calcAnnualizedReturn(portfolioHistory);
  const betaSPY = calcBeta(pRet, sRet);
  const sharpe = calcSharpe(annReturn, vol);
  const maxDD = calcMaxDrawdown(portfolioHistory);

  const spyAnnReturn = calcAnnualizedReturn(spyHistory);
  const alphaSPY = calcAlpha(annReturn, spyAnnReturn, betaSPY);

  return {
    portfolioBeta: betaSPY,
    portfolioVolatility: vol,
    annualizedReturn: annReturn,
    sharpeRatio: sharpe,
    maxDrawdown: maxDD,
    alphaSPY,
    excessReturnSPY: annReturn - spyAnnReturn,
    correlationSPY: correlation(pRet, sRet),
  };
}
