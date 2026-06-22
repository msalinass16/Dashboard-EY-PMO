import { useState, useMemo } from 'react';
import type { TimePeriod } from '@/types';
import { HOLDINGS, ALL_TICKERS, CASH_FLOWS, PORTFOLIO_INCEPTION, TOTAL_DEPOSITED } from '@/data/holdings';
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
} from '@/utils/riskCalculations';
import { Layout } from '@/components/layout/Layout';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { HoldingsTable } from '@/components/dashboard/HoldingsTable';
import { AllocationCharts } from '@/components/dashboard/AllocationCharts';
import { ValuationMetrics } from '@/components/dashboard/ValuationMetrics';
import { ConcentrationMetricsCard } from '@/components/dashboard/ConcentrationMetrics';
import { BenchmarkAnalysis } from '@/components/dashboard/BenchmarkAnalysis';
import { RiskAnalytics } from '@/components/dashboard/RiskAnalytics';

export function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>('ALL');

  const { quotes, isLoading: quotesLoading, lastUpdated, refresh, usingMock } = useQuotes(ALL_TICKERS);
  const { data: histData, isLoading: histLoading } = useHistoricalData(ALL_TICKERS, period);
  const { fundamentals, isLoading: fundLoading } = usePortfolioFundamentals(
    HOLDINGS.map((h) => h.ticker)
  );

  // Build portfolio positions
  const positions = useMemo(
    () => buildPortfolioPositions(HOLDINGS, quotes),
    [quotes]
  );

  // Summary
  const summary = useMemo(() => calcPortfolioSummary(positions), [positions]);

  // Allocation
  const positionAllocation = useMemo(() => calcPositionAllocation(positions), [positions]);
  const sectorAllocation = useMemo(() => calcSectorAllocation(positions), [positions]);
  const marketCapAllocation = useMemo(() => calcMarketCapAllocation(positions), [positions]);

  // Concentration
  const concentration = useMemo(() => calcConcentrationMetrics(positions), [positions]);

  // Valuation
  const valuationMetrics = useMemo(
    () => calcWeightedValuation(positions, fundamentals),
    [positions, fundamentals]
  );

  // Clip every ticker's history to inception so newer ETFs (DRAM, NASA)
  // don't pull the common-date intersection back before May 11
  const histFromInception = useMemo(() => {
    if (histData.size === 0) return histData;
    return new Map(
      [...histData.entries()].map(([t, d]) => [t, d.filter((p) => p.date >= PORTFOLIO_INCEPTION)])
    );
  }, [histData]);

  // Performance chart — always starts from portfolio inception date
  const performanceData = useMemo(() => {
    if (histFromInception.size === 0) return [];
    const portfolioHistory = buildPortfolioHistory(
      HOLDINGS.map((h) => ({ ticker: h.ticker, shares: h.shares })),
      histFromInception
    );
    const spyHistory = histFromInception.get('SPY') ?? [];
    const spyDcaHistory = buildSpyDcaHistory(spyHistory, CASH_FLOWS);
    const chart = buildPerformanceChart(portfolioHistory, spyHistory, spyDcaHistory);
    return filterByPeriod(chart, period, PORTFOLIO_INCEPTION);
  }, [histFromInception, period]);

  // Risk metrics
  const riskMetrics = useMemo(() => {
    if (histFromInception.size === 0) return null;
    const portfolioHistory = buildPortfolioHistory(
      HOLDINGS.map((h) => ({ ticker: h.ticker, shares: h.shares })),
      histFromInception
    );
    const spyHistory = histFromInception.get('SPY') ?? [];
    return calcRiskMetrics(portfolioHistory, spyHistory);
  }, [histFromInception]);

  // Weighted portfolio beta from quotes as quick fallback
  const portfolioBetaFromQuotes = useMemo(() => {
    const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
    if (totalValue === 0) return null;
    const weightedBeta = positions.reduce((s, p) => {
      if (p.beta == null) return s;
      return s + p.beta * (p.marketValue / totalValue);
    }, 0);
    return weightedBeta > 0 ? weightedBeta : null;
  }, [positions]);

  // Sector concentration risk (largest sector weight)
  const sectorConcentrationRisk = useMemo(
    () => Math.max(...sectorAllocation.map((s) => s.weight), 0),
    [sectorAllocation]
  );

  return (
    <Layout
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      isLoading={quotesLoading}
      usingMock={usingMock}
    >
      <div className="space-y-6">
        {/* Summary bar */}
        <PortfolioSummary summary={quotesLoading ? null : summary} isLoading={quotesLoading} />

        {/* Holdings table */}
        <HoldingsTable positions={positions} isLoading={quotesLoading} />

        {/* Allocation charts */}
        <AllocationCharts
          positionAllocation={positionAllocation}
          sectorAllocation={sectorAllocation}
          marketCapAllocation={marketCapAllocation}
        />

        {/* Benchmark + Valuation + Concentration + Risk */}
        <BenchmarkAnalysis
          performanceData={performanceData}
          riskMetrics={riskMetrics}
          isLoading={histLoading}
          period={period}
          onPeriodChange={setPeriod}
          totalDeposited={TOTAL_DEPOSITED}
          portfolioCurrentValue={summary?.totalValue ?? null}
          spyDcaCurrentValue={
            performanceData.length > 0
              ? (performanceData[performanceData.length - 1].spyDcaValue ?? null)
              : null
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <ValuationMetrics metrics={valuationMetrics} isLoading={fundLoading} />
          </div>
          <div className="lg:col-span-1">
            <ConcentrationMetricsCard metrics={concentration} />
          </div>
          <div className="lg:col-span-1">
            <RiskAnalytics
              metrics={riskMetrics}
              portfolioBetaFromQuotes={portfolioBetaFromQuotes}
              sectorConcentrationRisk={sectorConcentrationRisk}
              isLoading={histLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
