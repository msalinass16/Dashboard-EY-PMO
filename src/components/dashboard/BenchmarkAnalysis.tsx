import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PerformancePoint, TimePeriod, RiskMetrics } from '@/types';
import { PORTFOLIO_INCEPTION } from '@/data/holdings';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatPercent, formatPercentRaw, formatShortDate } from '@/utils/formatters';
import { clsx } from 'clsx';

const PERIODS: TimePeriod[] = ['1M', '3M', '6M', '1Y', 'ALL'];

function PeriodToggle({ period, active, onClick }: { period: TimePeriod; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1 text-xs rounded font-medium transition-colors',
        active
          ? 'bg-accent/20 text-accent'
          : 'text-slate-500 hover:text-slate-300'
      )}
    >
      {period}
    </button>
  );
}

function CustomTooltip({ active, payload, label }: {
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
            {p.value != null ? `${(p.value - 100).toFixed(2)}%` : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
}

function RelativeMetric({ label, value, format = 'percent' }: {
  label: string;
  value: number | undefined;
  format?: 'percent' | 'raw';
}) {
  if (value == null || !isFinite(value)) return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-600 font-mono">N/A</div>
    </div>
  );
  const color = value >= 0 ? 'text-gain' : 'text-loss';
  const formatted = format === 'percent' ? formatPercent(value) : formatPercentRaw(value);
  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={clsx('text-sm font-semibold font-mono', color)}>{formatted}</div>
    </div>
  );
}

interface BenchmarkAnalysisProps {
  performanceData: PerformancePoint[];
  riskMetrics: RiskMetrics | null;
  isLoading: boolean;
  period: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;
  totalDeposited: number;
  portfolioCurrentValue: number | null;
  spyDcaCurrentValue: number | null;
  portfolioGainLossPercent: number | null;
}

export function BenchmarkAnalysis({
  performanceData: rawData,
  riskMetrics,
  isLoading,
  period,
  onPeriodChange,
  totalDeposited,
  portfolioCurrentValue,
  spyDcaCurrentValue,
  portfolioGainLossPercent,
}: BenchmarkAnalysisProps) {
  // Hard guard: never display data before portfolio inception regardless of what upstream passes
  const performanceData = rawData.filter((d) => d.date >= PORTFOLIO_INCEPTION);

  const lastPoint = performanceData[performanceData.length - 1];
  const portReturn = portfolioGainLossPercent ?? (lastPoint ? (lastPoint.portfolio - 100) / 100 : 0);
  const spyReturn = lastPoint?.spy != null ? (lastPoint.spy - 100) / 100 : undefined;

  // SPY DCA comparison
  const spyDcaReturn = spyDcaCurrentValue != null && totalDeposited > 0
    ? (spyDcaCurrentValue - totalDeposited) / totalDeposited
    : null;
  const vsSpyDca = portfolioCurrentValue != null && spyDcaCurrentValue != null
    ? portfolioCurrentValue - spyDcaCurrentValue
    : null;
  const vsSpyDcaPct = vsSpyDca != null && spyDcaCurrentValue != null && spyDcaCurrentValue > 0
    ? vsSpyDca / spyDcaCurrentValue
    : null;

  return (
    <Card
      title="Benchmark Analysis"
      subtitle="Portfolio vs SPY — since May 11, 2025"
      action={
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <PeriodToggle key={p} period={p} active={p === period} onClick={() => onPeriodChange(p)} />
          ))}
        </div>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-bg-secondary/50 rounded-lg">
        <RelativeMetric label="Portfolio (since May 11)" value={portReturn} />
        <RelativeMetric label="SPY (since May 11)" value={spyReturn} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2d42" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={{ stroke: '#1a2d42' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `${(v - 100).toFixed(0)}%`}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
              formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="portfolio"
              name="Portfolio"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#portGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="spy"
              name="SPY"
              stroke="#a855f7"
              strokeWidth={1.5}
              fill="url(#spyGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              strokeDasharray="4 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* SPY DCA Comparison — "what if you bought SPY on each deposit date?" */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wide">
          vs SPY DCA — What if you bought SPY on each deposit date?
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-bg-secondary/60 rounded-lg p-3">
            <div className="text-2xs text-slate-500 mb-1">Total Deposited</div>
            <div className="text-sm font-mono font-semibold text-slate-200">
              {formatCurrency(totalDeposited)}
            </div>
          </div>
          <div className="bg-bg-secondary/60 rounded-lg p-3">
            <div className="text-2xs text-slate-500 mb-1">Your Portfolio</div>
            <div className={clsx(
              'text-sm font-mono font-semibold',
              portfolioCurrentValue != null && portfolioCurrentValue > totalDeposited ? 'text-gain' : 'text-loss'
            )}>
              {portfolioCurrentValue != null ? formatCurrency(portfolioCurrentValue) : 'N/A'}
            </div>
            {portfolioCurrentValue != null && (
              <div className={clsx(
                'text-2xs font-mono mt-0.5',
                portfolioCurrentValue >= totalDeposited ? 'text-gain' : 'text-loss'
              )}>
                {formatPercent((portfolioCurrentValue - totalDeposited) / totalDeposited)}
              </div>
            )}
          </div>
          <div className="bg-bg-secondary/60 rounded-lg p-3">
            <div className="text-2xs text-slate-500 mb-1">SPY DCA Would Be</div>
            <div className={clsx(
              'text-sm font-mono font-semibold',
              spyDcaCurrentValue != null && spyDcaCurrentValue > totalDeposited ? 'text-gain' : 'text-loss'
            )}>
              {spyDcaCurrentValue != null ? formatCurrency(spyDcaCurrentValue) : 'N/A'}
            </div>
            {spyDcaReturn != null && (
              <div className={clsx(
                'text-2xs font-mono mt-0.5',
                spyDcaReturn >= 0 ? 'text-gain' : 'text-loss'
              )}>
                {formatPercent(spyDcaReturn)}
              </div>
            )}
          </div>
          <div className="bg-bg-secondary/60 rounded-lg p-3">
            <div className="text-2xs text-slate-500 mb-1">You vs SPY DCA</div>
            <div className={clsx(
              'text-sm font-mono font-semibold',
              vsSpyDca == null ? 'text-slate-600' : vsSpyDca >= 0 ? 'text-gain' : 'text-loss'
            )}>
              {vsSpyDca != null ? (vsSpyDca >= 0 ? '+' : '') + formatCurrency(vsSpyDca) : 'N/A'}
            </div>
            {vsSpyDcaPct != null && (
              <div className={clsx(
                'text-2xs font-mono mt-0.5',
                vsSpyDcaPct >= 0 ? 'text-gain' : 'text-loss'
              )}>
                {(vsSpyDcaPct >= 0 ? '+' : '') + formatPercentRaw(vsSpyDcaPct)}
              </div>
            )}
          </div>
        </div>
      </div>

    </Card>
  );
}
