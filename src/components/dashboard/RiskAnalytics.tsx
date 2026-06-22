import type { RiskMetrics } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatPercent, formatPercentRaw, formatNumber } from '@/utils/formatters';
import { clsx } from 'clsx';

interface RiskAnalyticsProps {
  metrics: RiskMetrics | null;
  portfolioBetaFromQuotes: number | null;
  sectorConcentrationRisk: number;
  isLoading: boolean;
}

function RiskRow({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description: string;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <div className="text-xs font-medium text-slate-300">{label}</div>
        <div className="text-2xs text-slate-600 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <div className={clsx('text-sm font-semibold font-mono shrink-0', color ?? 'text-slate-200')}>
        {value}
      </div>
    </div>
  );
}

export function RiskAnalytics({
  metrics,
  portfolioBetaFromQuotes,
  sectorConcentrationRisk,
  isLoading,
}: RiskAnalyticsProps) {
  if (isLoading) {
    return (
      <Card title="Risk Analytics">
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2.5">
              <div className="h-3 bg-surface-raised rounded w-28" />
              <div className="h-3 bg-surface-raised rounded w-14" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const beta = metrics?.portfolioBeta ?? portfolioBetaFromQuotes ?? null;
  const vol = metrics?.portfolioVolatility;
  const sharpe = metrics?.sharpeRatio;
  const maxDD = metrics?.maxDrawdown;

  const betaColor = beta == null ? undefined : beta > 1.5 ? 'text-loss' : beta > 1.0 ? 'text-gold' : 'text-gain';
  const volColor = vol == null ? undefined : vol > 0.35 ? 'text-loss' : vol > 0.2 ? 'text-gold' : 'text-gain';
  const sharpeColor = sharpe == null ? undefined : sharpe > 1 ? 'text-gain' : sharpe > 0.5 ? 'text-gold' : 'text-loss';
  const ddColor = maxDD == null ? undefined : maxDD > 0.3 ? 'text-loss' : maxDD > 0.15 ? 'text-gold' : 'text-gain';
  const sectorColor = sectorConcentrationRisk > 0.8 ? 'text-loss' : sectorConcentrationRisk > 0.6 ? 'text-gold' : 'text-gain';

  const rows = [
    {
      label: 'Portfolio Beta',
      value: beta != null ? formatNumber(beta, 2) : 'N/A',
      description: 'Sensitivity to market (SPY) — >1 means more volatile',
      color: betaColor,
    },
    {
      label: 'Annualized Volatility',
      value: vol != null ? formatPercentRaw(vol) : 'N/A',
      description: 'Standard deviation of daily returns × √252',
      color: volColor,
    },
    {
      label: 'Annualized Return',
      value: metrics?.annualizedReturn != null ? formatPercent(metrics.annualizedReturn) : 'N/A',
      description: 'Compound annual growth rate of portfolio',
      color: metrics?.annualizedReturn != null ? (metrics.annualizedReturn >= 0 ? 'text-gain' : 'text-loss') : undefined,
    },
    {
      label: 'Sharpe Ratio',
      value: sharpe != null ? formatNumber(sharpe, 2) : 'N/A',
      description: 'Risk-adjusted return above risk-free rate (5.25%)',
      color: sharpeColor,
    },
    {
      label: 'Max Drawdown',
      value: maxDD != null ? `-${formatPercentRaw(maxDD)}` : 'N/A',
      description: 'Largest peak-to-trough decline in the period',
      color: ddColor,
    },
    {
      label: 'Alpha vs SPY',
      value: metrics?.alphaSPY != null ? formatPercent(metrics.alphaSPY) : 'N/A',
      description: "Jensen's alpha — excess return adjusted for systematic risk",
      color: metrics?.alphaSPY != null ? (metrics.alphaSPY >= 0 ? 'text-gain' : 'text-loss') : undefined,
    },
    {
      label: 'Sector Concentration',
      value: formatPercentRaw(sectorConcentrationRisk),
      description: 'Proportion of portfolio in the largest single sector',
      color: sectorColor,
    },
  ];

  return (
    <Card title="Risk Analytics">
      {rows.map((r) => (
        <RiskRow key={r.label} {...r} />
      ))}
      {metrics == null && beta == null && (
        <p className="text-xs text-slate-600 mt-3 italic">
          Full risk metrics require at least 20 days of historical data.
        </p>
      )}
    </Card>
  );
}
