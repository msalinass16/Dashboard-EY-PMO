import { clsx } from 'clsx';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card } from '@/components/ui/Card';
import { formatPercent, formatMultiple, formatPercentRaw, formatLargeNumber } from '@/utils/formatters';
import type { FundamentalData } from '@/types';

// Reference benchmarks for SPY/QQQ (approximate long-run values)
const SPY_BENCHMARKS = {
  forwardPE: 21.5,
  pe: 24.0,
  pegRatio: 2.1,
  evToEbitda: 15.0,
  revenueGrowth: 0.07,
  earningsGrowth: 0.10,
  netMargin: 0.12,
  roe: 0.18,
  freeCashflowYield: 0.035,
  dividendYield: 0.013,
};

const QQQ_BENCHMARKS = {
  forwardPE: 28.0,
  pe: 30.0,
  pegRatio: 2.4,
  evToEbitda: 22.0,
  revenueGrowth: 0.13,
  earningsGrowth: 0.16,
  netMargin: 0.20,
  roe: 0.28,
  freeCashflowYield: 0.025,
  dividendYield: 0.006,
};

interface ValRowProps {
  label: string;
  portfolio: number | null | undefined;
  spy?: number;
  qqq?: number;
  format?: 'multiple' | 'percent' | 'percentRaw';
  higherIsBetter?: boolean;
}

function delta(portfolio: number, benchmark: number, higherIsBetter: boolean): string {
  const pct = (portfolio - benchmark) / Math.abs(benchmark);
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(1)}%`;
}

function deltaColor(portfolio: number, benchmark: number, higherIsBetter: boolean): string {
  const better = portfolio > benchmark ? higherIsBetter : !higherIsBetter;
  return better ? 'text-gain' : 'text-loss';
}

function ValRow({ label, portfolio, spy, qqq, format = 'multiple', higherIsBetter = false }: ValRowProps) {
  const fmt = (v: number | null | undefined) => {
    if (v == null) return '—';
    if (format === 'multiple') return formatMultiple(v);
    if (format === 'percent') return formatPercent(v);
    return formatPercentRaw(v, 1);
  };

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-2.5 text-xs text-slate-400">{label}</td>
      <td className="py-2.5 text-xs font-mono font-semibold text-slate-200 text-right">
        {fmt(portfolio)}
      </td>
      {spy != null && portfolio != null && (
        <td className={clsx('py-2.5 text-xs font-mono text-right', deltaColor(portfolio, spy, higherIsBetter))}>
          {delta(portfolio, spy, higherIsBetter)}
        </td>
      )}
      <td className="py-2.5 text-xs font-mono text-right text-slate-500">{fmt(spy)}</td>
      <td className="py-2.5 text-xs font-mono text-right text-slate-500">{fmt(qqq)}</td>
    </tr>
  );
}

export function ValuationPage() {
  const { positions, fundamentals, valuationMetrics, fundLoading } = usePortfolio();

  const vm = valuationMetrics;

  return (
    <div className="space-y-6">
      {/* Portfolio vs Benchmark comparison */}
      <Card title="Portfolio vs Benchmark Valuation" subtitle="Weighted averages vs SPY and QQQ">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide text-left">Metric</th>
                <th className="pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide text-right">Portfolio</th>
                <th className="pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide text-right">vs SPY</th>
                <th className="pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide text-right">SPY</th>
                <th className="pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide text-right">QQQ</th>
              </tr>
            </thead>
            <tbody>
              <ValRow label="Forward P/E" portfolio={vm?.weightedForwardPE} spy={SPY_BENCHMARKS.forwardPE} qqq={QQQ_BENCHMARKS.forwardPE} higherIsBetter={false} />
              <ValRow label="Trailing P/E" portfolio={vm?.weightedPE} spy={SPY_BENCHMARKS.pe} qqq={QQQ_BENCHMARKS.pe} higherIsBetter={false} />
              <ValRow label="PEG Ratio" portfolio={vm?.weightedPEG} spy={SPY_BENCHMARKS.pegRatio} qqq={QQQ_BENCHMARKS.pegRatio} higherIsBetter={false} />
              <ValRow label="EV/EBITDA" portfolio={vm?.weightedEVEBITDA} spy={SPY_BENCHMARKS.evToEbitda} qqq={QQQ_BENCHMARKS.evToEbitda} higherIsBetter={false} />
              <ValRow label="Revenue Growth" portfolio={vm?.weightedRevenueGrowth} spy={SPY_BENCHMARKS.revenueGrowth} qqq={QQQ_BENCHMARKS.revenueGrowth} format="percent" higherIsBetter={true} />
              <ValRow label="Earnings Growth" portfolio={vm?.weightedEarningsGrowth} spy={SPY_BENCHMARKS.earningsGrowth} qqq={QQQ_BENCHMARKS.earningsGrowth} format="percent" higherIsBetter={true} />
              <ValRow label="Net Margin" portfolio={vm?.weightedOperatingMargin} spy={SPY_BENCHMARKS.netMargin} qqq={QQQ_BENCHMARKS.netMargin} format="percent" higherIsBetter={true} />
              <ValRow label="ROE" portfolio={vm?.weightedROIC} spy={SPY_BENCHMARKS.roe} qqq={QQQ_BENCHMARKS.roe} format="percent" higherIsBetter={true} />
              <ValRow label="FCF Yield" portfolio={vm?.weightedFCFYield} spy={SPY_BENCHMARKS.freeCashflowYield} qqq={QQQ_BENCHMARKS.freeCashflowYield} format="percent" higherIsBetter={true} />
              <ValRow label="Dividend Yield" portfolio={vm?.weightedDividendYield} spy={SPY_BENCHMARKS.dividendYield} qqq={QQQ_BENCHMARKS.dividendYield} format="percent" higherIsBetter={true} />
            </tbody>
          </table>
          <p className="text-2xs text-slate-600 mt-3">SPY/QQQ benchmarks are approximate consensus estimates.</p>
        </div>
      </Card>

      {/* Per-holding valuation table */}
      <Card title="Position Valuation Detail" subtitle="Individual holding metrics">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Ticker', 'Wt%', 'Fwd P/E', 'Trail P/E', 'PEG', 'EV/EBITDA', 'Rev Grw', 'EPS Grw', 'Op Margin', 'FCF Yield', 'Analyst Tgt', 'Upside'].map((h) => (
                  <th key={h} className={clsx('pb-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide', h === 'Ticker' ? 'text-left' : 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {positions.map((pos) => {
                const f: FundamentalData | undefined = fundamentals.get(pos.ticker);
                const upside = f?.analystTargetPrice != null
                  ? (f.analystTargetPrice - pos.currentPrice) / pos.currentPrice
                  : null;
                return (
                  <tr key={pos.ticker} className="hover:bg-surface-raised">
                    <td className="py-2.5 font-semibold text-accent font-mono">{pos.ticker}</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">{formatPercentRaw(pos.weight, 1)}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.forwardPE != null ? formatMultiple(f.forwardPE) : '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.pe != null ? formatMultiple(f.pe) : '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.pegRatio != null ? formatMultiple(f.pegRatio) : '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.evToEbitda != null ? formatMultiple(f.evToEbitda) : '—'}</td>
                    <td className={clsx('py-2.5 text-right font-mono', f?.revenueGrowth != null ? (f.revenueGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {f?.revenueGrowth != null ? formatPercent(f.revenueGrowth) : '—'}
                    </td>
                    <td className={clsx('py-2.5 text-right font-mono', f?.earningsGrowth != null ? (f.earningsGrowth >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {f?.earningsGrowth != null ? formatPercent(f.earningsGrowth) : '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.operatingMargin != null ? formatPercentRaw(f.operatingMargin, 1) : '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-300">{f?.freeCashflowYield != null ? formatPercentRaw(f.freeCashflowYield, 1) : '—'}</td>
                    <td className="py-2.5 text-right font-mono text-slate-400">{f?.analystTargetPrice != null ? `$${f.analystTargetPrice.toFixed(2)}` : '—'}</td>
                    <td className={clsx('py-2.5 text-right font-mono font-medium', upside != null ? (upside >= 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                      {upside != null ? formatPercent(upside) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
