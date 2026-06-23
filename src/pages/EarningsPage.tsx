import { clsx } from 'clsx';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card } from '@/components/ui/Card';
import { formatPercent, formatPercentRaw } from '@/utils/formatters';

// We derive earnings proximity from fundamentals — Yahoo often includes earningsTimestamp
// Since FundamentalData doesn't include it directly, we'll display what we can
// and show a helpful "check broker" message for missing dates

interface EarningsRowProps {
  ticker: string;
  name: string;
  weight: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  sector?: string;
  analystRating?: string;
  numberOfAnalysts?: number;
}

function RatingBadge({ rating }: { rating?: string }) {
  if (!rating) return <span className="text-slate-600">—</span>;
  const normalized = rating.toLowerCase();
  const color = normalized.includes('buy') || normalized.includes('outperform') || normalized.includes('overweight')
    ? 'text-gain bg-gain/10'
    : normalized.includes('hold') || normalized.includes('neutral') || normalized.includes('equal')
    ? 'text-gold bg-gold/10'
    : 'text-loss bg-loss/10';
  return (
    <span className={clsx('text-2xs font-medium px-1.5 py-0.5 rounded uppercase tracking-wide', color)}>
      {rating.toUpperCase()}
    </span>
  );
}

export function EarningsPage() {
  const { positions, fundamentals, quotesLoading } = usePortfolio();

  const rows = positions.map((pos) => {
    const f = fundamentals.get(pos.ticker);
    return {
      ticker: pos.ticker,
      name: pos.name,
      weight: pos.weight,
      sector: pos.sector,
      revenueGrowth: f?.revenueGrowth,
      earningsGrowth: f?.earningsGrowth,
      grossMargin: f?.grossMargin,
      operatingMargin: f?.operatingMargin,
      forwardPE: f?.forwardPE,
      analystRating: f?.analystRating,
      numberOfAnalysts: f?.numberOfAnalysts,
      analystTargetPrice: f?.analystTargetPrice,
      currentPrice: pos.currentPrice,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-bg-secondary/40 border border-border/60 rounded-lg px-4 py-3 text-xs text-slate-500">
        Earnings dates are not available directly from Yahoo Finance's free-tier API. Use your broker or
        <span className="text-accent"> earnings.com / earningswhispers.com </span>
        for precise upcoming earnings schedules.
      </div>

      {/* Analyst consensus table */}
      <Card title="Analyst Consensus" subtitle="Coverage and ratings per holding">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Ticker', 'Company', 'Sector', 'Wt%', 'Rating', '# Analysts', 'Target', 'Implied Upside', 'Rev Growth', 'EPS Growth', 'Fwd P/E'].map((h) => (
                  <th key={h} className={clsx('pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide', ['Ticker', 'Company', 'Sector'].includes(h) ? 'text-left' : 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row) => {
                const upside = row.analystTargetPrice != null
                  ? (row.analystTargetPrice - row.currentPrice) / row.currentPrice
                  : null;
                return (
                  <tr key={row.ticker} className="hover:bg-surface-raised">
                    <td className="py-2.5 font-semibold text-accent font-mono">{row.ticker}</td>
                    <td className="py-2.5 text-slate-300 max-w-[140px] truncate">{row.name}</td>
                    <td className="py-2.5 text-slate-500">{row.sector ?? '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">{formatPercentRaw(row.weight, 1)}</td>
                    <td className="py-2.5 text-right"><RatingBadge rating={row.analystRating} /></td>
                    <td className="py-2.5 text-right font-mono text-slate-400">{row.numberOfAnalysts ?? '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-400">
                      {row.analystTargetPrice != null ? `$${row.analystTargetPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className={clsx('py-2.5 text-right font-mono font-medium', upside != null ? (upside >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {upside != null ? formatPercent(upside) : '—'}
                    </td>
                    <td className={clsx('py-2.5 text-right font-mono', row.revenueGrowth != null ? (row.revenueGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {row.revenueGrowth != null ? formatPercent(row.revenueGrowth) : '—'}
                    </td>
                    <td className={clsx('py-2.5 text-right font-mono', row.earningsGrowth != null ? (row.earningsGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {row.earningsGrowth != null ? formatPercent(row.earningsGrowth) : '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-300">
                      {row.forwardPE != null ? `${row.forwardPE.toFixed(1)}x` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Growth momentum */}
      <Card title="Growth Momentum" subtitle="Revenue and earnings trajectory per holding">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {rows.map((row) => (
            <div key={row.ticker} className="bg-bg-secondary/60 rounded-lg p-3">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold font-mono text-accent">{row.ticker}</span>
                <span className="text-2xs text-slate-600">{formatPercentRaw(row.weight, 0)}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-2xs text-slate-500">Rev Growth</span>
                  <span className={clsx('text-2xs font-mono font-medium', row.revenueGrowth != null ? (row.revenueGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                    {row.revenueGrowth != null ? formatPercent(row.revenueGrowth) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-2xs text-slate-500">EPS Growth</span>
                  <span className={clsx('text-2xs font-mono font-medium', row.earningsGrowth != null ? (row.earningsGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                    {row.earningsGrowth != null ? formatPercent(row.earningsGrowth) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-2xs text-slate-500">Op Margin</span>
                  <span className="text-2xs font-mono text-slate-400">
                    {row.operatingMargin != null ? formatPercentRaw(row.operatingMargin, 1) : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
