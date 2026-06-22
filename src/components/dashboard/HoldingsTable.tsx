import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { PortfolioPosition, SortField, SortDirection } from '@/types';
import { Card } from '@/components/ui/Card';
import {
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  formatShares,
  gainLossClass,
} from '@/utils/formatters';

interface HoldingsTableProps {
  positions: PortfolioPosition[];
  isLoading: boolean;
}

function SortIcon({ field, sortField, dir }: { field: SortField; sortField: SortField; dir: SortDirection }) {
  if (field !== sortField) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-accent" />
    : <ChevronDown className="w-3 h-3 text-accent" />;
}

const COLUMNS: { key: SortField; label: string; align: 'left' | 'right' }[] = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'name', label: 'Company', align: 'left' },
  { key: 'shares', label: 'Shares', align: 'right' },
  { key: 'avgCost', label: 'Avg Cost', align: 'right' },
  { key: 'currentPrice', label: 'Price', align: 'right' },
  { key: 'marketValue', label: 'Mkt Value', align: 'right' },
  { key: 'gainLoss', label: 'G/L ($)', align: 'right' },
  { key: 'gainLossPercent', label: 'G/L (%)', align: 'right' },
  { key: 'dailyChange', label: 'Day ($)', align: 'right' },
  { key: 'dailyChangePercent', label: 'Day (%)', align: 'right' },
  { key: 'weight', label: 'Weight', align: 'right' },
];

export function HoldingsTable({ positions, isLoading }: HoldingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('marketValue');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const navigate = useNavigate();

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sorted = [...positions].sort((a, b) => {
    const aVal = a[sortField as keyof PortfolioPosition] as number | string;
    const bVal = b[sortField as keyof PortfolioPosition] as number | string;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <Card title="Holdings" subtitle={`${positions.length} positions`} noPadding>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-bg-secondary/60">
              {COLUMNS.map((col) => (
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
            {isLoading
              ? Array.from({ length: 13 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-3 py-3">
                        <div className="h-3 bg-surface rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((pos) => (
                  <tr
                    key={pos.ticker}
                    className="hover:bg-surface-raised cursor-pointer transition-colors group"
                    onClick={() => navigate(`/position/${pos.ticker}`)}
                  >
                    <td className="px-3 py-3 font-semibold text-accent font-mono group-hover:text-accent-bright">
                      {pos.ticker}
                    </td>
                    <td className="px-3 py-3 text-slate-300 max-w-[160px] truncate">
                      {pos.name}
                      {pos.isETF && (
                        <span className="ml-1.5 text-2xs text-slate-600 font-medium">ETF</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatShares(pos.shares)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">
                      {formatCurrency(pos.avgCost)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200 font-medium">
                      {formatCurrency(pos.currentPrice)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200 font-medium">
                      {formatCurrency(pos.marketValue)}
                    </td>
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
                      <span className="flex items-center justify-end gap-2">
                        <span
                          className="inline-block h-1.5 rounded-full bg-accent/60"
                          style={{ width: `${Math.max(pos.weight * 80, 2)}px` }}
                        />
                        {formatPercentRaw(pos.weight, 1)}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
          {!isLoading && positions.length > 0 && (
            <tfoot>
              <tr className="border-t border-border-bright bg-bg-secondary/40">
                <td className="px-3 py-2.5 font-semibold text-slate-300">TOTAL</td>
                <td />
                <td />
                <td />
                <td />
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-200">
                  {formatCurrency(positions.reduce((s, p) => s + p.marketValue, 0))}
                </td>
                <td className={clsx(
                  'px-3 py-2.5 text-right font-mono font-semibold',
                  gainLossClass(positions.reduce((s, p) => s + p.gainLoss, 0))
                )}>
                  {formatCurrency(positions.reduce((s, p) => s + p.gainLoss, 0))}
                </td>
                <td />
                <td className={clsx(
                  'px-3 py-2.5 text-right font-mono font-semibold',
                  gainLossClass(positions.reduce((s, p) => s + p.dailyChange, 0))
                )}>
                  {formatCurrency(positions.reduce((s, p) => s + p.dailyChange, 0))}
                </td>
                <td />
                <td className="px-3 py-2.5 text-right font-mono text-slate-400">100.0%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}
