import { X, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { PortfolioPosition, FundamentalData } from '@/types';
import {
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  formatLargeNumber,
  formatMultiple,
  gainLossClass,
} from '@/utils/formatters';

interface MetricRowProps {
  label: string;
  value?: number | string | null;
  format?: 'currency' | 'percent' | 'multiple' | 'raw' | 'large' | 'text';
  suffix?: string;
  positive?: boolean; // if true, higher is better (green); false = lower is better
}

function MetricRow({ label, value, format = 'raw', suffix = '', positive }: MetricRowProps) {
  let display = '—';
  let colorClass = 'text-slate-300';

  if (value != null && value !== '') {
    const num = typeof value === 'number' ? value : parseFloat(value as string);
    if (!isNaN(num)) {
      switch (format) {
        case 'currency': display = formatCurrency(num); break;
        case 'percent': display = formatPercent(num); break;
        case 'multiple': display = formatMultiple(num, suffix || 'x'); break;
        case 'large': display = formatLargeNumber(num); break;
        default: display = `${num.toFixed(2)}${suffix}`;
      }
      if (positive !== undefined) {
        colorClass = (positive ? num > 0 : num < 0) ? 'text-gain' : num === 0 ? 'text-slate-400' : 'text-loss';
      }
    } else {
      display = String(value);
    }
  }

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={clsx('text-xs font-mono font-medium', colorClass)}>{display}</span>
    </div>
  );
}

interface PositionPanelProps {
  position: PortfolioPosition;
  fundamentals?: FundamentalData;
  onClose: () => void;
}

export function PositionPanel({ position: pos, fundamentals: f, onClose }: PositionPanelProps) {
  const trend = pos.dailyChangePercent >= 0;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-bg-card border-l border-border shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg-card border-b border-border px-5 py-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono text-accent">{pos.ticker}</span>
              {pos.isETF && (
                <span className="text-2xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">ETF</span>
              )}
            </div>
            <div className="text-sm text-slate-400 mt-0.5 max-w-[260px] truncate">{pos.name}</div>
            {f?.sector && (
              <div className="text-2xs text-slate-600 mt-0.5">{f.sector} · {f.industry}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Price block */}
        <div className="bg-bg-secondary rounded-xl p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xs text-slate-500 mb-1">Current Price</div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {formatCurrency(pos.currentPrice)}
              </div>
            </div>
            <div className={clsx('flex items-center gap-1 text-sm font-mono font-semibold', trend ? 'text-gain' : 'text-loss')}>
              {trend ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercent(pos.dailyChangePercent)}
            </div>
          </div>
          {f?.fiftyTwoWeekHigh != null && f?.fiftyTwoWeekLow != null && (
            <div className="mt-3">
              <div className="flex justify-between text-2xs text-slate-500 mb-1">
                <span>52W Low: {formatCurrency(f.fiftyTwoWeekLow)}</span>
                <span>52W High: {formatCurrency(f.fiftyTwoWeekHigh)}</span>
              </div>
              <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((pos.currentPrice - f.fiftyTwoWeekLow) / (f.fiftyTwoWeekHigh - f.fiftyTwoWeekLow)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Position metrics */}
        <div>
          <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Position</div>
          <div className="bg-bg-secondary rounded-xl px-4 py-2">
            <MetricRow label="Shares" value={pos.shares} format="raw" suffix="" />
            <MetricRow label="Avg Cost" value={pos.avgCost} format="currency" />
            <MetricRow label="Market Value" value={pos.marketValue} format="currency" />
            <MetricRow label="Weight" value={pos.weight} format="percent" />
            <MetricRow label="Unrealized P&L ($)" value={pos.gainLoss} format="currency" positive={true} />
            <MetricRow label="Unrealized P&L (%)" value={pos.gainLossPercent} format="percent" positive={true} />
          </div>
        </div>

        {/* Valuation */}
        {f && (
          <div>
            <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Valuation</div>
            <div className="bg-bg-secondary rounded-xl px-4 py-2">
              <MetricRow label="Trailing P/E" value={f.pe} format="multiple" />
              <MetricRow label="Forward P/E" value={f.forwardPE} format="multiple" />
              <MetricRow label="PEG Ratio" value={f.pegRatio} format="multiple" />
              <MetricRow label="EV/EBITDA" value={f.evToEbitda} format="multiple" />
              <MetricRow label="Price/Book" value={f.priceToBook} format="multiple" />
              <MetricRow label="Price/Sales" value={f.priceToSales} format="multiple" />
              <MetricRow label="FCF Yield" value={f.freeCashflowYield} format="percent" positive={true} />
              <MetricRow label="Market Cap" value={f.marketCap} format="large" />
            </div>
          </div>
        )}

        {/* Growth & Quality */}
        {f && (
          <div>
            <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Growth & Quality</div>
            <div className="bg-bg-secondary rounded-xl px-4 py-2">
              <MetricRow label="Revenue Growth" value={f.revenueGrowth} format="percent" positive={true} />
              <MetricRow label="Earnings Growth" value={f.earningsGrowth} format="percent" positive={true} />
              <MetricRow label="Gross Margin" value={f.grossMargin} format="percent" />
              <MetricRow label="Operating Margin" value={f.operatingMargin} format="percent" positive={true} />
              <MetricRow label="Net Margin" value={f.netMargin} format="percent" positive={true} />
              <MetricRow label="ROE" value={f.roe} format="percent" positive={true} />
              <MetricRow label="Beta" value={f.beta} />
            </div>
          </div>
        )}

        {/* Analyst */}
        {f?.analystTargetPrice != null && (
          <div>
            <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Analyst Consensus</div>
            <div className="bg-bg-secondary rounded-xl px-4 py-2">
              <MetricRow label="Target Price" value={f.analystTargetPrice} format="currency" />
              <MetricRow
                label="Implied Upside"
                value={f.analystTargetPrice != null
                  ? (f.analystTargetPrice - pos.currentPrice) / pos.currentPrice
                  : null}
                format="percent"
                positive={true}
              />
              <MetricRow label="Rating" value={f.analystRating?.toUpperCase() ?? null} format="text" />
              <MetricRow label="# Analysts" value={f.numberOfAnalysts} />
            </div>
          </div>
        )}

        {/* Business summary */}
        {f?.description && (
          <div>
            <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Business</div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-6">{f.description}</p>
          </div>
        )}

        {f?.website && (
          <a
            href={f.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-bright transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {f.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  );
}
