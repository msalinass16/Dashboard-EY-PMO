import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { PositionPanel } from '@/components/holdings/PositionPanel';
import { Card } from '@/components/ui/Card';
import type { PortfolioPosition, FundamentalData } from '@/types';
import {
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  formatShares,
  formatMultiple,
  gainLossClass,
} from '@/utils/formatters';

type SortField = keyof PortfolioPosition | 'forwardPE' | 'revenueGrowth' | 'sector';
type SortDir = 'asc' | 'desc';

const COLS: { key: SortField; label: string; align: 'left' | 'right' }[] = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'name', label: 'Company', align: 'left' },
  { key: 'sector', label: 'Sector', align: 'left' },
  { key: 'marketCapCategory', label: 'Cap', align: 'left' },
  { key: 'shares', label: 'Shares', align: 'right' },
  { key: 'avgCost', label: 'Avg Cost', align: 'right' },
  { key: 'currentPrice', label: 'Price', align: 'right' },
  { key: 'marketValue', label: 'Mkt Val', align: 'right' },
  { key: 'gainLoss', label: 'G/L ($)', align: 'right' },
  { key: 'gainLossPercent', label: 'G/L (%)', align: 'right' },
  { key: 'dailyChange', label: 'Day ($)', align: 'right' },
  { key: 'dailyChangePercent', label: 'Day (%)', align: 'right' },
  { key: 'weight', label: 'Wt%', align: 'right' },
  { key: 'forwardPE', label: 'Fwd P/E', align: 'right' },
  { key: 'revenueGrowth', label: 'Rev Grw', align: 'right' },
];

function SortIcon({ field, sortField, dir }: { field: string; sortField: string; dir: SortDir }) {
  if (field !== sortField) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return dir === 'asc' ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />;
}

function getFundamentalValue(f: FundamentalData | undefined, field: SortField): number {
  if (!f) return -Infinity;
  if (field === 'forwardPE') return f.forwardPE ?? -Infinity;
  if (field === 'revenueGrowth') return f.revenueGrowth ?? -Infinity;
  return -Infinity;
}

export function HoldingsPage() {
  const { positions, fundamentals, quotesLoading } = usePortfolio();
  const [sortField, setSortField] = useState<SortField>('marketValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<PortfolioPosition | null>(null);

  function handleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  const sorted = [...positions].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;
    if (sortField === 'forwardPE' || sortField === 'revenueGrowth') {
      aVal = getFundamentalValue(fundamentals.get(a.ticker), sortField);
      bVal = getFundamentalValue(fundamentals.get(b.ticker), sortField);
    } else if (sortField === 'sector') {
      aVal = a.sector ?? '';
      bVal = b.sector ?? '';
    } else {
      aVal = a[sortField as keyof PortfolioPosition] as number | string ?? '';
      bVal = b[sortField as keyof PortfolioPosition] as number | string ?? '';
    }
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalGL = positions.reduce((s, p) => s + p.gainLoss, 0);
  const totalDay = positions.reduce((s, p) => s + p.dailyChange, 0);

  return (
    <div className="space-y-4">
      <Card
        title="Holdings"
        subtitle={`${positions.length} positions`}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/60">
                {COLS.map((col) => (
                  <th
                    key={col.key}
                    className={clsx(
                      'px-3 py-2.5 font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors',
                      col.align === 'right' ? 'text-right' : 'text-left'
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1 whitespace-nowrap" style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {col.label}
                      <SortIcon field={col.key} sortField={sortField} dir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotesLoading
                ? Array.from({ length: 13 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {COLS.map((c) => (
                        <td key={c.key} className="px-3 py-3">
                          <div className="h-3 bg-surface rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.map((pos) => {
                    const f = fundamentals.get(pos.ticker);
                    return (
                      <tr
                        key={pos.ticker}
                        className={clsx(
                          'hover:bg-surface-raised cursor-pointer transition-colors group',
                          selected?.ticker === pos.ticker && 'bg-accent/5'
                        )}
                        onClick={() => setSelected(pos.ticker === selected?.ticker ? null : pos)}
                      >
                        <td className="px-3 py-3 font-semibold text-accent font-mono group-hover:text-accent-bright">
                          {pos.ticker}
                        </td>
                        <td className="px-3 py-3 text-slate-300 max-w-[140px] truncate">
                          {pos.name}
                          {pos.isETF && <span className="ml-1.5 text-2xs text-slate-600">ETF</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{pos.sector ?? '—'}</td>
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{pos.marketCapCategory}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">{formatShares(pos.shares)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">{formatCurrency(pos.avgCost)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-200 font-medium">{formatCurrency(pos.currentPrice)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-200 font-medium">{formatCurrency(pos.marketValue)}</td>
                        <td className={clsx('px-3 py-3 text-right font-mono font-medium', gainLossClass(pos.gainLoss))}>
                          {pos.gainLoss >= 0 ? '+' : ''}{formatCurrency(pos.gainLoss)}
                        </td>
                        <td className={clsx('px-3 py-3 text-right font-mono font-medium', gainLossClass(pos.gainLossPercent))}>
                          {formatPercent(pos.gainLossPercent)}
                        </td>
                        <td className={clsx('px-3 py-3 text-right font-mono', gainLossClass(pos.dailyChange))}>
                          {pos.dailyChange >= 0 ? '+' : ''}{formatCurrency(pos.dailyChange)}
                        </td>
                        <td className={clsx('px-3 py-3 text-right font-mono', gainLossClass(pos.dailyChangePercent))}>
                          {formatPercent(pos.dailyChangePercent)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-400">
                          <span className="flex items-center justify-end gap-1.5">
                            <span className="inline-block h-1.5 rounded-full bg-accent/60" style={{ width: `${Math.max(pos.weight * 80, 2)}px` }} />
                            {formatPercentRaw(pos.weight, 1)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-400">
                          {f?.forwardPE != null ? formatMultiple(f.forwardPE) : '—'}
                        </td>
                        <td className={clsx('px-3 py-3 text-right font-mono', f?.revenueGrowth != null ? gainLossClass(f.revenueGrowth) : 'text-slate-600')}>
                          {f?.revenueGrowth != null ? formatPercent(f.revenueGrowth) : '—'}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
            {!quotesLoading && positions.length > 0 && (
              <tfoot>
                <tr className="border-t border-border-bright bg-bg-secondary/40">
                  <td className="px-3 py-2.5 font-semibold text-slate-300">TOTAL</td>
                  <td colSpan={6} />
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-200">{formatCurrency(totalValue)}</td>
                  <td className={clsx('px-3 py-2.5 text-right font-mono font-semibold', gainLossClass(totalGL))}>
                    {totalGL >= 0 ? '+' : ''}{formatCurrency(totalGL)}
                  </td>
                  <td />
                  <td className={clsx('px-3 py-2.5 text-right font-mono font-semibold', gainLossClass(totalDay))}>
                    {totalDay >= 0 ? '+' : ''}{formatCurrency(totalDay)}
                  </td>
                  <td />
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400">100.0%</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Position panel overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelected(null)}
          />
          <PositionPanel
            position={selected}
            fundamentals={fundamentals.get(selected.ticker)}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </div>
  );
}
