import type { WeightedValuationMetrics } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatMultiple, formatPercentRaw, formatPercent } from '@/utils/formatters';
import { clsx } from 'clsx';

interface ValuationMetricsProps {
  metrics: WeightedValuationMetrics | null;
  isLoading: boolean;
}

interface MetricRowProps {
  label: string;
  value: string;
  description: string;
  positive?: boolean | null;
}

function MetricRow({ label, value, description, positive }: MetricRowProps) {
  const valColor =
    positive === true
      ? 'text-gain'
      : positive === false
      ? 'text-loss'
      : 'text-slate-200';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <div className="text-xs font-medium text-slate-300">{label}</div>
        <div className="text-2xs text-slate-600 mt-0.5">{description}</div>
      </div>
      <div className={clsx('text-sm font-semibold font-mono', valColor)}>{value}</div>
    </div>
  );
}

export function ValuationMetrics({ metrics, isLoading }: ValuationMetricsProps) {
  if (isLoading || !metrics) {
    return (
      <Card title="Portfolio Valuation Metrics" subtitle="Weighted by market value (equity only)">
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-3 bg-surface-raised rounded w-32" />
              <div className="h-3 bg-surface-raised rounded w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const rows = [
    {
      label: 'Weighted P/E',
      value: formatMultiple(metrics.weightedPE),
      description: 'Trailing 12-month price-to-earnings',
      positive: null,
    },
    {
      label: 'Weighted Forward P/E',
      value: formatMultiple(metrics.weightedForwardPE),
      description: 'Next 12-month forward price-to-earnings',
      positive: null,
    },
    {
      label: 'Weighted PEG Ratio',
      value: formatMultiple(metrics.weightedPEG),
      description: 'P/E relative to earnings growth',
      positive: metrics.weightedPEG != null ? metrics.weightedPEG < 1.5 : null,
    },
    {
      label: 'Weighted EV/EBITDA',
      value: formatMultiple(metrics.weightedEVEBITDA),
      description: 'Enterprise value to EBITDA',
      positive: null,
    },
    {
      label: 'Weighted Revenue Growth',
      value: metrics.weightedRevenueGrowth != null ? formatPercent(metrics.weightedRevenueGrowth) : 'N/A',
      description: 'YoY revenue growth rate',
      positive: metrics.weightedRevenueGrowth != null ? metrics.weightedRevenueGrowth > 0 : null,
    },
    {
      label: 'Weighted EPS Growth',
      value: metrics.weightedEarningsGrowth != null ? formatPercent(metrics.weightedEarningsGrowth) : 'N/A',
      description: 'YoY earnings-per-share growth',
      positive: metrics.weightedEarningsGrowth != null ? metrics.weightedEarningsGrowth > 0 : null,
    },
    {
      label: 'Weighted ROIC',
      value: metrics.weightedROIC != null ? formatPercentRaw(metrics.weightedROIC) : 'N/A',
      description: 'Return on invested capital',
      positive: metrics.weightedROIC != null ? metrics.weightedROIC > 0.1 : null,
    },
    {
      label: 'Weighted Gross Margin',
      value: metrics.weightedGrossMargin != null ? formatPercentRaw(metrics.weightedGrossMargin) : 'N/A',
      description: 'Revenue minus cost of goods sold',
      positive: metrics.weightedGrossMargin != null ? metrics.weightedGrossMargin > 0.3 : null,
    },
    {
      label: 'Weighted Operating Margin',
      value: metrics.weightedOperatingMargin != null ? formatPercentRaw(metrics.weightedOperatingMargin) : 'N/A',
      description: 'Operating income as % of revenue',
      positive: metrics.weightedOperatingMargin != null ? metrics.weightedOperatingMargin > 0 : null,
    },
    {
      label: 'Weighted FCF Yield',
      value: metrics.weightedFCFYield != null ? formatPercentRaw(metrics.weightedFCFYield) : 'N/A',
      description: 'Free cash flow / market cap',
      positive: metrics.weightedFCFYield != null ? metrics.weightedFCFYield > 0.03 : null,
    },
    {
      label: 'Weighted Dividend Yield',
      value: metrics.weightedDividendYield != null ? formatPercentRaw(metrics.weightedDividendYield) : 'N/A',
      description: 'Annual dividends per share / price',
      positive: null,
    },
  ];

  return (
    <Card title="Portfolio Valuation Metrics" subtitle="Weighted by market value (equity only)">
      <div>
        {rows.map((r) => (
          <MetricRow key={r.label} {...r} />
        ))}
      </div>
    </Card>
  );
}
