import { clsx } from 'clsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DrawdownChart } from '@/components/performance/DrawdownChart';
import { HealthScore } from '@/components/performance/HealthScore';
import { PORTFOLIO_INCEPTION } from '@/data/holdings';
import { formatPercent, formatPercentRaw, formatShortDate } from '@/utils/formatters';

const PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

function PeriodBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={clsx('px-3 py-1 text-xs rounded font-medium transition-colors', active ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:text-slate-300')}>
      {label}
    </button>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-2">{label}</div>
      {payload.map((p) => p.value != null && (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {`${(p.value - 100).toFixed(2)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

interface MetricGridItemProps {
  label: string;
  value: string | number | null | undefined;
  subLabel?: string;
  positive?: boolean;
  neutral?: boolean;
}

function MetricGridItem({ label, value, subLabel, positive, neutral }: MetricGridItemProps) {
  const display = value != null ? String(value) : '—';
  let color = 'text-slate-300';
  if (!neutral && value != null && typeof value === 'string') {
    const num = parseFloat(value.replace(/[^-\d.]/g, ''));
    if (!isNaN(num)) {
      color = positive === undefined ? 'text-slate-200' : (positive ? (num >= 0 ? 'text-gain' : 'text-loss') : (num <= 0 ? 'text-gain' : 'text-loss'));
    }
  }

  return (
    <div className="bg-bg-secondary/60 rounded-lg p-3">
      <div className="text-2xs text-slate-500 mb-1 uppercase tracking-wide">{label}</div>
      <div className={clsx('text-base font-bold font-mono', neutral ? 'text-slate-200' : color)}>{display}</div>
      {subLabel && <div className="text-2xs text-slate-600 mt-0.5">{subLabel}</div>}
    </div>
  );
}

export function PerformancePage() {
  const {
    histLoading,
    period,
    setPeriod,
    performanceData,
    riskMetrics,
    drawdownSeries,
    portfolioBetaFromQuotes,
    xirr,
    cagr,
    sortino,
    informationRatio,
    portfolioHealth,
    summary,
  } = usePortfolio();

  const beta = riskMetrics?.portfolioBeta ?? portfolioBetaFromQuotes;
  const totalReturn = summary ? summary.totalGainLossPercent : null;

  return (
    <div className="space-y-6">
      {/* Performance chart */}
      <Card
        title="Performance — Portfolio vs Benchmarks"
        subtitle={`Normalized to 100 at ${PORTFOLIO_INCEPTION}`}
        action={
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => <PeriodBtn key={p} label={p} active={p === period} onClick={() => setPeriod(p)} />)}
          </div>
        }
      >
        {histLoading ? (
          <div className="flex items-center justify-center h-72"><LoadingSpinner size="lg" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="pfPortGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: '#1a2d42' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `${(v - 100).toFixed(0)}%`} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
              <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke="#38bdf8" strokeWidth={2} fill="url(#pfPortGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="spy" name="SPY" stroke="#a855f7" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="qqq" name="QQQ" stroke="#f59e0b" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns */}
        <Card title="Returns">
          <div className="grid grid-cols-2 gap-3">
            <MetricGridItem label="Total Return" value={totalReturn != null ? formatPercent(totalReturn) : null} positive subLabel="vs cost basis" />
            <MetricGridItem label="CAGR" value={cagr != null ? formatPercent(cagr) : null} positive subLabel="since inception" />
            <MetricGridItem label="XIRR" value={xirr != null ? formatPercent(xirr) : null} positive subLabel="cash-weighted return" />
            <MetricGridItem label="Alpha vs SPY" value={riskMetrics?.alphaSPY != null ? formatPercentRaw(riskMetrics.alphaSPY) : null} positive subLabel="CAPM alpha (annualized)" />
            <MetricGridItem label="Excess vs SPY" value={riskMetrics?.excessReturnSPY != null ? formatPercentRaw(riskMetrics.excessReturnSPY) : null} positive subLabel="annualized excess return" />
          </div>
        </Card>

        {/* Risk */}
        <Card title="Risk Metrics">
          <div className="grid grid-cols-2 gap-3">
            <MetricGridItem label="Annualized Vol" value={riskMetrics?.portfolioVolatility != null ? formatPercentRaw(riskMetrics.portfolioVolatility, 1) : null} neutral subLabel="standard deviation" />
            <MetricGridItem label="Max Drawdown" value={riskMetrics?.maxDrawdown != null ? formatPercentRaw(-riskMetrics.maxDrawdown) : null} subLabel="peak-to-trough" positive={false} />
            <MetricGridItem label="Sharpe Ratio" value={riskMetrics?.sharpeRatio != null ? riskMetrics.sharpeRatio.toFixed(2) : null} positive subLabel="risk-adjusted return" />
            <MetricGridItem label="Sortino Ratio" value={sortino != null ? sortino.toFixed(2) : null} positive subLabel="downside deviation" />
            <MetricGridItem label="Info Ratio" value={informationRatio != null ? informationRatio.toFixed(2) : null} positive subLabel="vs SPY tracking" />
            <MetricGridItem label="Beta vs SPY" value={beta != null ? beta.toFixed(2) : null} neutral subLabel="market sensitivity" />
            <MetricGridItem label="Correlation" value={riskMetrics?.correlationSPY != null ? riskMetrics.correlationSPY.toFixed(2) : null} neutral subLabel="vs SPY" />
          </div>
        </Card>
      </div>

      {/* Drawdown chart */}
      <Card title="Drawdown Analysis" subtitle="Portfolio drawdown from peak value">
        {histLoading ? (
          <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
        ) : (
          <DrawdownChart data={drawdownSeries} height={240} />
        )}
      </Card>

      {/* Health score */}
      {portfolioHealth && (
        <Card title="Portfolio Health Score" subtitle="Composite risk & performance rating">
          <HealthScore health={portfolioHealth} />
        </Card>
      )}
    </div>
  );
}
