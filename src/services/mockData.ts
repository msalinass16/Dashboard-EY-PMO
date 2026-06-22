import type { QuoteData, HistoricalDataPoint, FundamentalData } from '@/types';
import { HOLDINGS } from '@/data/holdings';

const MOCK_PRICES: Record<string, { price: number; prevClose: number; marketCap?: number; pe?: number; beta?: number; sector?: string }> = {
  MU:   { price: 108.50,  prevClose: 106.20,  marketCap: 120e9,  pe: 22.4,  beta: 1.55, sector: 'Technology' },
  WDC:  { price: 58.30,   prevClose: 57.10,   marketCap: 20e9,   pe: null!,  beta: 1.42, sector: 'Technology' },
  CRDO: { price: 72.80,   prevClose: 70.50,   marketCap: 8.2e9,  pe: 95.0,  beta: 1.80, sector: 'Technology' },
  DRAM: { price: 19.45,   prevClose: 19.10,   marketCap: undefined, pe: undefined, beta: 1.50, sector: 'Technology' },
  SMH:  { price: 248.60,  prevClose: 244.20,  marketCap: undefined, pe: 28.5,  beta: 1.38, sector: 'Technology' },
  ARM:  { price: 162.40,  prevClose: 159.80,  marketCap: 170e9,  pe: 185.0, beta: 1.70, sector: 'Technology' },
  NASA: { price: 22.30,   prevClose: 21.95,   marketCap: undefined, pe: undefined, beta: 1.10, sector: 'Industrials' },
  NOK:  { price: 4.72,    prevClose: 4.68,    marketCap: 26e9,   pe: 11.5,  beta: 0.62, sector: 'Communication Services' },
  IONQ: { price: 25.80,   prevClose: 24.90,   marketCap: 5.2e9,  pe: null!,  beta: 1.95, sector: 'Technology' },
  RGTI: { price: 9.85,    prevClose: 9.40,    marketCap: 3.1e9,  pe: null!,  beta: 2.20, sector: 'Technology' },
  QBTS: { price: 10.20,   prevClose: 9.80,    marketCap: 1.6e9,  pe: null!,  beta: 2.10, sector: 'Technology' },
  NVDA: { price: 138.85,  prevClose: 136.60,  marketCap: 3400e9, pe: 46.5,  beta: 1.72, sector: 'Technology' },
  NOW:  { price: 965.40,  prevClose: 952.10,  marketCap: 198e9,  pe: 72.0,  beta: 1.28, sector: 'Technology' },
  SPY:  { price: 548.20,  prevClose: 543.80,  marketCap: undefined, pe: 21.5,  beta: 1.00, sector: 'ETF' },
  QQQ:  { price: 472.80,  prevClose: 468.10,  marketCap: undefined, pe: 28.2,  beta: 1.15, sector: 'ETF' },
};

export function getMockQuotes(tickers: string[]): QuoteData[] {
  return tickers.map((ticker) => {
    const m = MOCK_PRICES[ticker] ?? { price: 50, prevClose: 49, marketCap: undefined, pe: undefined, beta: 1, sector: 'Technology' };
    const holding = HOLDINGS.find((h) => h.ticker === ticker);
    const change = m.price - m.prevClose;
    const changePercent = change / m.prevClose;
    return {
      ticker,
      name: holding?.name ?? ticker,
      price: m.price,
      previousClose: m.prevClose,
      change,
      changePercent,
      marketCap: m.marketCap,
      volume: Math.floor(Math.random() * 10_000_000 + 1_000_000),
      pe: m.pe,
      beta: m.beta,
      sector: m.sector,
    };
  });
}

export function getMockHistorical(ticker: string, days: number): HistoricalDataPoint[] {
  const base = MOCK_PRICES[ticker]?.price ?? 100;
  const volatility = (MOCK_PRICES[ticker]?.beta ?? 1) * 0.015;
  const points: HistoricalDataPoint[] = [];
  let price = base * (1 - Math.random() * 0.3);

  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 86_400_000;
    const date = new Date(ts);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    price *= 1 + (Math.random() - 0.48) * volatility;
    points.push({
      date: date.toISOString().slice(0, 10),
      timestamp: ts,
      close: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export function getMockFundamentals(ticker: string): FundamentalData {
  const holding = HOLDINGS.find((h) => h.ticker === ticker);
  const m = MOCK_PRICES[ticker] ?? {};
  return {
    ticker,
    pe: m.pe,
    forwardPE: m.pe ? m.pe * 0.85 : undefined,
    pegRatio: m.pe ? m.pe / 15 : undefined,
    evToEbitda: m.pe ? m.pe * 0.6 : undefined,
    revenueGrowth: 0.18,
    earningsGrowth: 0.22,
    grossMargin: 0.52,
    operatingMargin: 0.28,
    netMargin: 0.22,
    roic: 0.18,
    freeCashflowYield: 0.025,
    dividendYield: undefined,
    description: `${holding?.name ?? ticker} is a leading company in the ${holding?.sector ?? 'technology'} sector.`,
    sector: holding?.sector ?? m.sector,
    industry: 'Semiconductors',
    beta: m.beta,
    marketCap: m.marketCap,
    analystTargetPrice: m.price ? m.price * 1.18 : undefined,
    analystRating: 'buy',
    numberOfAnalysts: 18,
  };
}
