import type { ConcentrationMetrics } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatPercentRaw, formatNumber } from '@/utils/formatters';
import { clsx } from 'clsx';

interface ConcentrationMetricsProps {
  metrics: ConcentrationMetrics | null;
}

function GaugeBar({ value, max = 1, color = 'bg-accent' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ConcentrationMetricsCard({ metrics }: ConcentrationMetricsProps) {
  if (!metrics) return null;

  const hhi100 = metrics.hhi * 100;
  const hhiRisk =
    hhi100 < 15 ? { label: 'Diversified', color: 'text-gain' }
    : hhi100 < 25 ? { label: 'Moderate', color: 'text-gold' }
    : { label: 'Concentrated', color: 'text-loss' };

  const scoreColor =
    metrics.diversificationScore >= 70
      ? 'text-gain'
      : metrics.diversificationScore >= 50
      ? 'text-gold'
      : 'text-loss';

  return (
    <Card title="Concentration Metrics">
      <div className="space-y-4">
        {/* Diversification Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">Diversification Score</div>
            <div className={clsx('text-2xl font-bold font-mono', scoreColor)}>
              {metrics.diversificationScore}
              <span className="text-sm text-slate-500 font-normal">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">HHI Index</div>
            <div className={clsx('text-lg font-semibold font-mono', hhiRisk.color)}>
              {(metrics.hhi * 10000).toFixed(0)}
              <span className="text-xs text-slate-500 font-normal"> /10k</span>
            </div>
            <div className={clsx('text-2xs font-medium', hhiRisk.color)}>{hhiRisk.label}</div>
          </div>
        </div>

        <GaugeBar
          value={metrics.diversificationScore}
          max={100}
          color={
            metrics.diversificationScore >= 70
              ? 'bg-gain'
              : metrics.diversificationScore >= 50
              ? 'bg-gold'
              : 'bg-loss'
          }
        />

        <div className="border-t border-border pt-4 space-y-3">
          {[
            { label: 'Largest Position', ticker: metrics.top1Ticker, value: metrics.top1Weight },
            { label: 'Top 3 Holdings', ticker: '', value: metrics.top3Weight },
            { label: 'Top 5 Holdings', ticker: '', value: metrics.top5Weight },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">
                  {item.label}
                  {item.ticker && (
                    <span className="ml-1.5 text-accent font-mono">{item.ticker}</span>
                  )}
                </span>
                <span className="text-xs font-semibold font-mono text-slate-200">
                  {formatPercentRaw(item.value, 1)}
                </span>
              </div>
              <GaugeBar
                value={item.value}
                max={1}
                color={item.value > 0.4 ? 'bg-loss' : item.value > 0.25 ? 'bg-gold' : 'bg-accent'}
              />
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Effective N (positions)</span>
            <span className="text-slate-300 font-mono font-semibold">
              {formatNumber(metrics.effectiveN, 1)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
