import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useQuotes } from '@/hooks/useQuotes';
import { Card } from '@/components/ui/Card';
import type { QuoteData } from '@/types';
import { formatCurrency, formatPercent, formatPercentRaw } from '@/utils/formatters';

export function WatchlistPage() {
  const { items, add, remove, update } = useWatchlist();
  const [input, setInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [error, setError] = useState('');

  const tickers = items.map((i) => i.ticker);
  const { quotes, isLoading } = useQuotes(tickers.length > 0 ? tickers : ['SPY']);

  const quoteMap = new Map(
    Array.from(quotes.values()).map((q) => [q.ticker, q])
  );

  function handleAdd() {
    const t = input.trim().toUpperCase();
    if (!t) { setError('Enter a ticker symbol'); return; }
    if (items.some((i) => i.ticker === t)) { setError(`${t} is already on your watchlist`); return; }
    const target = targetInput ? parseFloat(targetInput) : undefined;
    add(t, isNaN(target!) ? undefined : target, noteInput.trim() || undefined);
    setInput('');
    setTargetInput('');
    setNoteInput('');
    setError('');
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <Card title="Add to Watchlist">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Ticker (e.g. AAPL)"
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50 w-36"
          />
          <input
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Target buy price (opt.)"
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50 w-48"
          />
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Note (optional)"
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50 flex-1"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {error && <p className="text-xs text-loss mt-2">{error}</p>}
      </Card>

      {/* Watchlist table */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">
          Your watchlist is empty. Add tickers above to track them.
        </div>
      ) : (
        <Card title="Watchlist" subtitle={`${items.length} ticker${items.length === 1 ? '' : 's'}`} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/60">
                  {['Ticker', 'Price', 'Day %', '52W Low', '52W High', '52W Pos.', 'Target Buy', 'Margin of Safety', 'Note', ''].map((h) => (
                    <th key={h} className={clsx('px-3 py-2.5 text-2xs text-slate-500 font-semibold uppercase tracking-wide', ['Ticker', 'Note'].includes(h) ? 'text-left' : 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const q: QuoteData | undefined = quoteMap.get(item.ticker);
                  const pct52w = q?.fiftyTwoWeekHigh != null && q?.fiftyTwoWeekLow != null
                    ? (q.price - q.fiftyTwoWeekLow) / (q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow)
                    : null;
                  const mos = item.targetBuyPrice != null && q?.price != null
                    ? (item.targetBuyPrice - q.price) / q.price
                    : null;
                  const trend = (q?.changePercent ?? 0) >= 0;

                  return (
                    <tr key={item.ticker} className="hover:bg-surface-raised">
                      <td className="px-3 py-3 font-semibold text-accent font-mono">{item.ticker}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-200 font-medium">
                        {isLoading ? '—' : q ? formatCurrency(q.price) : 'N/A'}
                      </td>
                      <td className={clsx('px-3 py-3 text-right font-mono font-medium flex items-center justify-end gap-1', q ? (trend ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                        {q ? (
                          <>
                            {trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {formatPercent(q.changePercent)}
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-500">
                        {q?.fiftyTwoWeekLow != null ? formatCurrency(q.fiftyTwoWeekLow) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-500">
                        {q?.fiftyTwoWeekHigh != null ? formatCurrency(q.fiftyTwoWeekHigh) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {pct52w != null ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-16 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${pct52w * 100}%` }} />
                            </div>
                            <span className="text-2xs font-mono text-slate-500 w-8">{Math.round(pct52w * 100)}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-slate-400">
                        {item.targetBuyPrice != null ? formatCurrency(item.targetBuyPrice) : '—'}
                      </td>
                      <td className={clsx('px-3 py-3 text-right font-mono font-medium', mos != null ? (mos > 0 ? 'text-gain' : 'text-loss') : 'text-slate-600')}>
                        {mos != null ? formatPercent(mos) : '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-500 max-w-[160px] truncate">{item.note ?? ''}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => remove(item.ticker)} className="text-slate-600 hover:text-loss transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
