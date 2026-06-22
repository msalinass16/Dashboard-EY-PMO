import type {
  Holding,
  QuoteData,
  PortfolioPosition,
  PortfolioSummaryMetrics,
  ConcentrationMetrics,
  WeightedValuationMetrics,
  FundamentalData,
  MarketCapCategory,
  AllocationEntry,
  SectorAllocation,
} from '@/types';

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#38bdf8',
  'Communication Services': '#a855f7',
  Industrials: '#f59e0b',
  'Health Care': '#22c55e',
  Financials: '#fb923c',
  'Consumer Discretionary': '#e879f9',
  Energy: '#fbbf24',
  'Consumer Staples': '#34d399',
  Materials: '#94a3b8',
  'Real Estate': '#60a5fa',
  Utilities: '#c084fc',
  ETF: '#64748b',
  Other: '#475569',
};

const MARKET_CAP_COLORS: Record<MarketCapCategory, string> = {
  'Mega Cap': '#38bdf8',
  'Large Cap': '#6366f1',
  'Mid Cap': '#a855f7',
  'Small Cap': '#f59e0b',
  ETF: '#64748b',
};

export function classifyMarketCap(marketCap?: number, isETF?: boolean): MarketCapCategory {
  if (isETF) return 'ETF';
  if (marketCap == null) return 'Mid Cap';
  if (marketCap >= 200e9) return 'Mega Cap';
  if (marketCap >= 10e9) return 'Large Cap';
  if (marketCap >= 2e9) return 'Mid Cap';
  return 'Small Cap';
}

export function buildPortfolioPositions(
  holdings: Holding[],
  quotes: Map<string, QuoteData>
): PortfolioPosition[] {
  const positions = holdings.map((h) => {
    const q = quotes.get(h.ticker);
    const price = q?.price ?? 0;
    const prevClose = q?.previousClose ?? price;
    const totalCost = h.shares * h.avgCost;
    const marketValue = h.shares * price;
    const gainLoss = marketValue - totalCost;
    const gainLossPercent = totalCost > 0 ? gainLoss / totalCost : 0;
    const dailyChange = h.shares * (price - prevClose);
    const dailyChangePercent = prevClose > 0 ? (price - prevClose) / prevClose : 0;
    const isETF = h.isETF ?? false;

    return {
      ticker: h.ticker,
      name: q?.name ?? h.name,
      shares: h.shares,
      avgCost: h.avgCost,
      totalCost,
      currentPrice: price,
      marketValue,
      gainLoss,
      gainLossPercent,
      dailyChange,
      dailyChangePercent,
      weight: 0, // filled below
      marketCap: q?.marketCap,
      sector: q?.sector ?? h.sector,
      industry: q?.industry,
      beta: q?.beta,
      pe: q?.pe,
      marketCapCategory: classifyMarketCap(q?.marketCap, isETF),
      isETF,
    } satisfies PortfolioPosition;
  });

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  return positions.map((p) => ({
    ...p,
    weight: totalValue > 0 ? p.marketValue / totalValue : 0,
  }));
}

export function calcPortfolioSummary(positions: PortfolioPosition[]): PortfolioSummaryMetrics {
  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? totalGainLoss / totalCost : 0;
  const dailyGainLoss = positions.reduce((s, p) => s + p.dailyChange, 0);
  const dailyGainLossPercent =
    totalValue > 0 ? dailyGainLoss / (totalValue - dailyGainLoss) : 0;
  return { totalValue, totalCost, totalGainLoss, totalGainLossPercent, dailyGainLoss, dailyGainLossPercent };
}

export function calcConcentrationMetrics(positions: PortfolioPosition[]): ConcentrationMetrics {
  const sorted = [...positions].sort((a, b) => b.weight - a.weight);
  const top1Ticker = sorted[0]?.ticker ?? '';
  const top1Weight = sorted[0]?.weight ?? 0;
  const top3Weight = sorted.slice(0, 3).reduce((s, p) => s + p.weight, 0);
  const top5Weight = sorted.slice(0, 5).reduce((s, p) => s + p.weight, 0);
  const hhi = positions.reduce((s, p) => s + p.weight ** 2, 0);
  const n = positions.length;
  const diversificationScore = n > 1 ? Math.round((1 - hhi) * 100) : 0;
  const effectiveN = hhi > 0 ? 1 / hhi : n;
  return { top1Ticker, top1Weight, top3Weight, top5Weight, hhi, diversificationScore, effectiveN };
}

export function calcSectorAllocation(positions: PortfolioPosition[]): SectorAllocation[] {
  const map = new Map<string, number>();
  for (const p of positions) {
    const sector = p.sector ?? 'Other';
    map.set(sector, (map.get(sector) ?? 0) + p.marketValue);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([sector, value]) => ({
      sector,
      value,
      weight: total > 0 ? value / total : 0,
      color: SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calcMarketCapAllocation(positions: PortfolioPosition[]): AllocationEntry[] {
  const map = new Map<MarketCapCategory, number>();
  for (const p of positions) {
    const cat = p.marketCapCategory;
    map.set(cat, (map.get(cat) ?? 0) + p.marketValue);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([name, value]) => ({
      name,
      value,
      weight: total > 0 ? value / total : 0,
      color: MARKET_CAP_COLORS[name],
    }))
    .sort((a, b) => b.value - a.value);
}

export function calcPositionAllocation(positions: PortfolioPosition[]): AllocationEntry[] {
  const colors = [
    '#38bdf8', '#6366f1', '#a855f7', '#f59e0b', '#22c55e',
    '#ef4444', '#fb923c', '#e879f9', '#34d399', '#60a5fa',
    '#fbbf24', '#c084fc', '#94a3b8',
  ];
  return [...positions]
    .sort((a, b) => b.weight - a.weight)
    .map((p, i) => ({
      name: p.ticker,
      value: p.marketValue,
      weight: p.weight,
      color: colors[i % colors.length],
    }));
}

export function calcWeightedValuation(
  positions: PortfolioPosition[],
  fundamentals: Map<string, FundamentalData>
): WeightedValuationMetrics {
  const equity = positions.filter((p) => !p.isETF);
  const totalEquityValue = equity.reduce((s, p) => s + p.marketValue, 0);

  function weightedAvg(getter: (f: FundamentalData) => number | undefined): number | null {
    let sum = 0;
    let sumWeight = 0;
    for (const p of equity) {
      const f = fundamentals.get(p.ticker);
      if (!f) continue;
      const val = getter(f);
      if (val == null || !isFinite(val) || val <= 0) continue;
      const w = totalEquityValue > 0 ? p.marketValue / totalEquityValue : 0;
      sum += val * w;
      sumWeight += w;
    }
    return sumWeight > 0.1 ? sum / sumWeight : null;
  }

  return {
    weightedPE: weightedAvg((f) => f.pe),
    weightedForwardPE: weightedAvg((f) => f.forwardPE),
    weightedPEG: weightedAvg((f) => f.pegRatio),
    weightedEVEBITDA: weightedAvg((f) => f.evToEbitda),
    weightedRevenueGrowth: weightedAvg((f) => f.revenueGrowth),
    weightedEarningsGrowth: weightedAvg((f) => f.earningsGrowth),
    weightedROIC: weightedAvg((f) => f.roic),
    weightedGrossMargin: weightedAvg((f) => f.grossMargin),
    weightedOperatingMargin: weightedAvg((f) => f.operatingMargin),
    weightedFCFYield: weightedAvg((f) => f.freeCashflowYield),
    weightedDividendYield: weightedAvg((f) => f.dividendYield),
  };
}
