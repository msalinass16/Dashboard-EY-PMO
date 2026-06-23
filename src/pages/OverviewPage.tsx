import { useMemo } from 'react';
import { clsx } from 'clsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { PortfolioSummary } from '@/components/dashboard/PortfolioSummary';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HealthScore } from '@/components/performance/HealthScore';
import { PORTFOLIO_INCEPTION } from '@/data/holdings';
import {
  formatPercent,
  formatPercentRaw,
  formatShortDate,
} from '@/utils/formatters';

const PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

function PeriodBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1 text-xs rounded font-medium transition-colors',
        active ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:text-slate-300'
      )}
    >
      {label}
    </button>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-2">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {p.value != null ? `${(p.value - 100).toFixed(2)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OverviewPage() {
  const {
    summary,
    quotesLoading,
    histLoading,
    period,
    setPeriod,
    performanceData,
    riskMetrics,
    portfolioBetaFromQuotes,
    xirr,
    cagr,
    portfolioHealth,
  } = usePortfolio();

  const lastPoint = performanceData[performanceData.length - 1];
  const portReturnSinceInception = summary
    ? (summary.totalGainLossPercent)
    : null;
  const spyReturnSinceInception = lastPoint?.spy != null ? (lastPoint.spy - 100) / 100 : null;

  const beta = riskMetrics?.portfolioBeta ?? portfolioBetaFromQuotes;
  const vol = riskMetrics?.portfolioVolatility;

  // KPI cards for new metrics
  const extraKpis = useMemo(() => [
    {
      label: 'XIRR',
      value: xirr != null ? formatPercent(xirr) : '—',
      trend: xirr != null ? (xirr >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const,
    },
    {
      label: 'CAGR',
      value: cagr != null ? formatPercent(cagr) : '—',
      trend: cagr != null ? (cagr >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const,
    },
    {
      label: 'Portfolio Beta',
      value: beta != null ? beta.toFixed(2) : '—',
      trend: 'neutral' as const,
    },
    {
      label: 'Annualized Vol',
      value: vol != null ? formatPercentRaw(vol, 1) : '—',
      trend: 'neutral' as const,
    },
  ], [xirr, cagr, beta, vol]);

  return (
    <div className="space-y-6">
      {/* KPI summary bar */}
      <PortfolioSummary summary={quotesLoading ? null : summary} isLoading={quotesLoading} />

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {extraKpis.map((k) => (
          <MetricCard key={k.label} label={k.label} value={k.value} trend={k.trend} />
        ))}
      </div>

      {/* Performance chart */}
      <Card
        title="Performance"
        subtitle={`Portfolio vs SPY — since ${PORTFOLIO_INCEPTION}`}
        action={
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => (
              <PeriodBtn key={p} label={p} active={p === period} onClick={() => setPeriod(p)} />
            ))}
          </div>
        }
      >
        {/* Benchmark summary */}
        <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-bg-secondary/50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Portfolio (since {PORTFOLIO_INCEPTION})</div>
            <div className={clsx(
              'text-sm font-semibold font-mono',
              portReturnSinceInception != null && portReturnSinceInception >= 0 ? 'text-gain' : 'text-loss'
            )}>
              {portReturnSinceInception != null ? formatPercent(portReturnSinceInception) : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">SPY (since {PORTFOLIO_INCEPTION})</div>
            <div className={clsx(
              'text-sm font-semibold font-mono',
              spyReturnSinceInception != null && spyReturnSinceInception >= 0 ? 'text-gain' : 'text-loss'
            )}>
              {spyReturnSinceInception != null ? formatPercent(spyReturnSinceInception) : '—'}
            </div>
          </div>
        </div>

        {histLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="ovPortGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: '#1a2d42' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `${(v - 100).toFixed(0)}%`} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
              <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke="#38bdf8" strokeWidth={2} fill="url(#ovPortGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="spy" name="SPY" stroke="#a855f7" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Health score */}
      {portfolioHealth && (
        <Card title="Portfolio Health Score" subtitle="Proprietary composite rating">
          <HealthScore health={portfolioHealth} />
        </Card>
      )}
    </div>
  );
}
