import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  highlight?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  highlight,
  className,
}: MetricCardProps) {
  const trendColor =
    trend === 'up' ? 'text-gain' : trend === 'down' ? 'text-loss' : 'text-slate-300';
  const subColor =
    trend === 'up' ? 'text-gain' : trend === 'down' ? 'text-loss' : 'text-slate-400';

  return (
    <div
      className={clsx(
        'bg-surface border rounded-xl p-4 flex flex-col gap-1',
        highlight
          ? 'border-accent/30 bg-accent/5'
          : 'border-border hover:border-border-bright',
        'transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xs font-medium text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <div className={clsx('text-lg font-semibold font-mono', trendColor)}>{value}</div>
      {subValue && <div className={clsx('text-xs font-mono', subColor)}>{subValue}</div>}
    </div>
  );
}
