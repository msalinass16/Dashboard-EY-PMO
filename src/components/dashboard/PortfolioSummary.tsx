import type { PortfolioSummaryMetrics } from '@/types';
import { MetricCard } from '@/components/ui/MetricCard';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatPercent, gainLossClass } from '@/utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart2, Percent } from 'lucide-react';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryMetrics | null;
  isLoading: boolean;
}

export function PortfolioSummary({ summary, isLoading }: PortfolioSummaryProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dailyGainLoss,
    dailyGainLossPercent,
  } = summary;

  const metrics = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue, 2),
      trend: 'neutral' as const,
      icon: <DollarSign className="w-3.5 h-3.5" />,
      highlight: true,
    },
    {
      label: 'Total Invested',
      value: formatCurrency(totalCost, 2),
      trend: 'neutral' as const,
      icon: <BarChart2 className="w-3.5 h-3.5" />,
    },
    {
      label: 'Unrealized P&L',
      value: formatCurrency(totalGainLoss, 2),
      subValue: formatPercent(totalGainLossPercent),
      trend: totalGainLoss >= 0 ? ('up' as const) : ('down' as const),
      icon: totalGainLoss >= 0
        ? <TrendingUp className="w-3.5 h-3.5" />
        : <TrendingDown className="w-3.5 h-3.5" />,
    },
    {
      label: 'Unrealized P&L %',
      value: formatPercent(totalGainLossPercent),
      trend: totalGainLossPercent >= 0 ? ('up' as const) : ('down' as const),
      icon: <Percent className="w-3.5 h-3.5" />,
    },
    {
      label: 'Daily P&L',
      value: formatCurrency(dailyGainLoss, 2),
      subValue: formatPercent(dailyGainLossPercent),
      trend: dailyGainLoss >= 0 ? ('up' as const) : ('down' as const),
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      label: 'Daily P&L %',
      value: formatPercent(dailyGainLossPercent),
      trend: dailyGainLossPercent >= 0 ? ('up' as const) : ('down' as const),
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      label: 'Total Return',
      value: formatCurrency(totalGainLoss, 2),
      trend: totalGainLoss >= 0 ? ('up' as const) : ('down' as const),
    },
    {
      label: 'Total Return %',
      value: formatPercent(totalGainLossPercent),
      trend: totalGainLossPercent >= 0 ? ('up' as const) : ('down' as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics.map((m) => (
        <MetricCard key={m.label} {...m} />
      ))}
    </div>
  );
}
