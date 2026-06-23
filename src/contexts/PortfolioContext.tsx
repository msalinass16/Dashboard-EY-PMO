import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type {
  PortfolioPosition,
  PortfolioSummaryMetrics,
  AllocationEntry,
  SectorAllocation,
  ConcentrationMetrics,
  WeightedValuationMetrics,
  PerformancePoint,
  RiskMetrics,
  DrawdownPoint,
  PortfolioHealthMetrics,
  FundamentalData,
  HistoricalDataPoint,
  TimePeriod,
} from '@/types';
import { HOLDINGS, ALL_TICKERS, CASH_FLOWS, PORTFOLIO_INCEPTION } from '@/data/holdings';
import { useQuotes } from '@/hooks/useQuotes';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { usePortfolioFundamentals } from '@/hooks/useFundamentals';
import {
  buildPortfolioPositions,
  calcPortfolioSummary,
  calcConcentrationMetrics,
  calcSectorAllocation,
  calcMarketCapAllocation,
  calcPositionAllocation,
  calcWeightedValuation,
} from '@/utils/portfolioCalculations';
import {
  buildPortfolioHistory,
  buildSpyDcaHistory,
  buildPerformanceChart,
  filterByPeriod,
  calcRiskMetrics,
  calcDrawdownSeries,
  calcPortfolioHealthScore,
  calcAnnualizedReturn,
  calcDailyReturns,
  calcSortino,
  calcInformationRatio,
} from '@/utils/riskCalculations';
import { calcXIRR } from '@/utils/xirr';

interface PortfolioContextValue {
  // Loading / status
  quotesLoading: boolean;
  histLoading: boolean;
  fundLoading: boolean;
  usingMock: boolean;
  lastUpdated: Date | null;
  refresh: () => void;

  // Core data
  positions: PortfolioPosition[];
  summary: PortfolioSummaryMetrics | null;
  fundamentals: Map<string, FundamentalData>;
  histFromInception: Map<string, HistoricalDataPoint[]>;

  // Allocations
  positionAllocation: AllocationEntry[];
  sectorAllocation: SectorAllocation[];
  marketCapAllocation: AllocationEntry[];

  // Concentration
  concentration: ConcentrationMetrics | null;

  // Valuation
  valuationMetrics: WeightedValuationMetrics | null;

  // Period & performance chart
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  performanceData: PerformancePoint[];

  // Risk
  riskMetrics: RiskMetrics | null;
  drawdownSeries: DrawdownPoint[];
  portfolioBetaFromQuotes: number | null;
  sectorConcentrationRisk: number;

  // Derived
  xirr: number | null;
  cagr: number | null;
  sortino: number | null;
  informationRatio: number | null;
  portfolioHealth: PortfolioHealthMetrics | null;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return ctx;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<TimePeriod>('ALL');

  const { quotes, isLoading: quotesLoading, lastUpdated, refresh, usingMock } = useQuotes(ALL_TICKERS);
  const { data: histData, isLoading: histLoading } = useHistoricalData(ALL_TICKERS, period);
  const { fundamentals, isLoading: fundLoading } = usePortfolioFundamentals(
    HOLDINGS.map((h) => h.ticker)
  );

  // Pre-filter every ticker's history to inception so newer ETFs don't pull back the intersection
  const histFromInception = useMemo(() => {
    if (histData.size === 0) return histData;
    return new Map(
      [...histData.entries()].map(([t, d]) => [t, d.filter((p) => p.date >= PORTFOLIO_INCEPTION)])
    );
  }, [histData]);

  const positions = useMemo(() => buildPortfolioPositions(HOLDINGS, quotes), [quotes]);
  const summary = useMemo(() => calcPortfolioSummary(positions), [positions]);

  const positionAllocation = useMemo(() => calcPositionAllocation(positions), [positions]);
  const sectorAllocation = useMemo(() => calcSectorAllocation(positions), [positions]);
  const marketCapAllocation = useMemo(() => calcMarketCapAllocation(positions), [positions]);
  const concentration = useMemo(() => calcConcentrationMetrics(positions), [positions]);
  const valuationMetrics = useMemo(
    () => calcWeightedValuation(positions, fundamentals),
    [positions, fundamentals]
  );

  // Full performance chart (Portfolio vs SPY vs QQQ)
  const performanceData = useMemo(() => {
    if (histFromInception.size === 0) return [];
    const portfolioHistory = buildPortfolioHistory(
      HOLDINGS.map((h) => ({ ticker: h.ticker, shares: h.shares })),
      histFromInception
    );
    const spyHistory = histFromInception.get('SPY') ?? [];
    const qqqHistory = histFromInception.get('QQQ') ?? [];
    const spyDcaHistory = buildSpyDcaHistory(spyHistory, CASH_FLOWS);
    const chart = buildPerformanceChart(portfolioHistory, spyHistory, spyDcaHistory, qqqHistory);
    return filterByPeriod(chart, period, PORTFOLIO_INCEPTION);
  }, [histFromInception, period]);

  // Risk metrics (always uses full inception history regardless of period filter)
  const fullPortfolioHistory = useMemo(() => {
    if (histFromInception.size === 0) return [];
    return buildPortfolioHistory(
      HOLDINGS.map((h) => ({ ticker: h.ticker, shares: h.shares })),
      histFromInception
    );
  }, [histFromInception]);

  const riskMetrics = useMemo(() => {
    if (fullPortfolioHistory.length === 0) return null;
    const spyHistory = histFromInception.get('SPY') ?? [];
    return calcRiskMetrics(fullPortfolioHistory, spyHistory);
  }, [fullPortfolioHistory, histFromInception]);

  const drawdownSeries = useMemo(
    () => (fullPortfolioHistory.length > 0 ? calcDrawdownSeries(fullPortfolioHistory) : []),
    [fullPortfolioHistory]
  );

  const portfolioBetaFromQuotes = useMemo(() => {
    const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
    if (totalValue === 0) return null;
    const weighted = positions.reduce((s, p) => (p.beta != null ? s + p.beta * (p.marketValue / totalValue) : s), 0);
    return weighted > 0 ? weighted : null;
  }, [positions]);

  const sectorConcentrationRisk = useMemo(
    () => Math.max(...sectorAllocation.map((s) => s.weight), 0),
    [sectorAllocation]
  );

  const xirr = useMemo(
    () => (summary ? calcXIRR(CASH_FLOWS, summary.totalValue) : null),
    [summary]
  );

  const cagr = useMemo(
    () => (fullPortfolioHistory.length >= 2 ? calcAnnualizedReturn(fullPortfolioHistory) : null),
    [fullPortfolioHistory]
  );

  const portfolioHealth = useMemo(
    () => calcPortfolioHealthScore(riskMetrics, concentration, valuationMetrics, summary),
    [riskMetrics, concentration, valuationMetrics, summary]
  );

  const sortino = useMemo(() => {
    if (fullPortfolioHistory.length < 20) return null;
    return calcSortino(calcDailyReturns(fullPortfolioHistory));
  }, [fullPortfolioHistory]);

  const informationRatio = useMemo(() => {
    if (fullPortfolioHistory.length < 20) return null;
    const spyHistory = histFromInception.get('SPY') ?? [];
    if (spyHistory.length < 20) return null;
    return calcInformationRatio(calcDailyReturns(fullPortfolioHistory), calcDailyReturns(spyHistory));
  }, [fullPortfolioHistory, histFromInception]);

  const value: PortfolioContextValue = {
    quotesLoading,
    histLoading,
    fundLoading,
    usingMock,
    lastUpdated,
    refresh,
    positions,
    summary,
    fundamentals,
    histFromInception,
    positionAllocation,
    sectorAllocation,
    marketCapAllocation,
    concentration,
    valuationMetrics,
    period,
    setPeriod,
    performanceData,
    riskMetrics,
    drawdownSeries,
    portfolioBetaFromQuotes,
    sectorConcentrationRisk,
    xirr,
    cagr,
    sortino,
    informationRatio,
    portfolioHealth,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
