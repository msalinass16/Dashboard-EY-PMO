export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  sector?: string;
  marketCapCategory?: MarketCapCategory;
  isETF?: boolean;
}

export type MarketCapCategory = 'Mega Cap' | 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'ETF';

export interface QuoteData {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  pe?: number;
  forwardPE?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
  eps?: number;
}

export interface HistoricalDataPoint {
  date: string;
  timestamp: number;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface FundamentalData {
  ticker: string;
  pe?: number;
  forwardPE?: number;
  pegRatio?: number;
  evToEbitda?: number;
  priceToBook?: number;
  priceToSales?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roic?: number;
  roe?: number;
  freeCashflowYield?: number;
  dividendYield?: number;
  description?: string;
  sector?: string;
  industry?: string;
  employees?: number;
  website?: string;
  marketCap?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  analystTargetPrice?: number;
  analystRating?: string;
  numberOfAnalysts?: number;
  totalRevenue?: number;
  netIncome?: number;
  totalDebt?: number;
  totalCash?: number;
  enterpriseValue?: number;
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  weight: number;
  marketCap?: number;
  sector?: string;
  industry?: string;
  beta?: number;
  pe?: number;
  marketCapCategory: MarketCapCategory;
  isETF: boolean;
}

export interface PortfolioSummaryMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dailyGainLoss: number;
  dailyGainLossPercent: number;
}

export interface ConcentrationMetrics {
  top1Ticker: string;
  top1Weight: number;
  top3Weight: number;
  top5Weight: number;
  hhi: number;
  diversificationScore: number;
  effectiveN: number;
}

export interface RiskMetrics {
  portfolioBeta: number;
  portfolioVolatility: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  alphaSPY: number;
  excessReturnSPY: number;
  correlationSPY: number;
}

export interface WeightedValuationMetrics {
  weightedPE: number | null;
  weightedForwardPE: number | null;
  weightedPEG: number | null;
  weightedEVEBITDA: number | null;
  weightedRevenueGrowth: number | null;
  weightedEarningsGrowth: number | null;
  weightedROIC: number | null;
  weightedGrossMargin: number | null;
  weightedOperatingMargin: number | null;
  weightedFCFYield: number | null;
  weightedDividendYield: number | null;
}

export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type SortField =
  | 'ticker'
  | 'name'
  | 'shares'
  | 'avgCost'
  | 'currentPrice'
  | 'marketValue'
  | 'gainLoss'
  | 'gainLossPercent'
  | 'dailyChange'
  | 'dailyChangePercent'
  | 'weight';

export type SortDirection = 'asc' | 'desc';

export interface PerformancePoint {
  date: string;
  portfolio: number;
  spy: number | null;
  qqq: number | null;
  spyDcaValue: number | null;
  portfolioValue?: number;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number; // negative decimal, e.g. -0.05 = -5%
  portfolioValue: number;
  peakValue: number;
}

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  targetBuyPrice?: number;
  note?: string;
}

export type JournalAction = 'BUY' | 'SELL' | 'WATCH' | 'NOTE';

export interface JournalEntry {
  id: string;
  date: string;
  ticker: string;
  action: JournalAction;
  price?: number;
  thesis: string;
  catalysts?: string;
  risks?: string;
  expectedReturn?: number;
  conviction: number; // 1-10
  outcome?: string;
}

export interface PortfolioHealthMetrics {
  score: number; // 0-100
  components: {
    diversification: number; // 0-100
    concentration: number;   // 0-100
    performance: number;     // 0-100
    volatility: number;      // 0-100
    valuation: number;       // 0-100
  };
  strengths: string[];
  weaknesses: string[];
}

export interface SectorAllocation {
  sector: string;
  value: number;
  weight: number;
  color: string;
}

export interface AllocationEntry {
  name: string;
  value: number;
  weight: number;
  color: string;
}
