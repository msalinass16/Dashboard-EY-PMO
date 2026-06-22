import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, ExternalLink, Building2, Users, Globe } from 'lucide-react';
import { HOLDINGS } from '@/data/holdings';
import { useQuotes } from '@/hooks/useQuotes';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useFundamentals } from '@/hooks/useFundamentals';
import { Card } from '@/components/ui/Card';
import { Badge, AnalystBadge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import {
  formatCurrency,
  formatPercent,
  formatPercentRaw,
  formatMultiple,
  formatMarketCap,
  formatLargeNumber,
  formatShares,
  formatShortDate,
  gainLossClass,
} from '@/utils/formatters';
import { clsx } from 'clsx';

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={clsx('text-xs font-semibold font-mono', color ?? 'text-slate-200')}>{value}</span>
    </div>
  );
}

export function PositionDetail() {
  const { ticker = '' } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const holding = HOLDINGS.find((h) => h.ticker === ticker);
  const { quotes, isLoading: qLoading, lastUpdated, refresh, usingMock } = useQuotes([ticker]);
  const { data: histData, isLoading: hLoading } = useHistoricalData([ticker], '1Y');
  const { fundamentals, isLoading: fLoading } = useFundamentals(ticker);

  const quote = quotes.get(ticker);
  const history = histData.get(ticker) ?? [];

  const chartData = history.map((d) => ({ date: d.date, price: d.close }));

  if (!holding) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-sm">Position not found: {ticker}</div>
          <button onClick={() => navigate('/')} className="mt-4 text-accent text-sm hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const price = quote?.price ?? 0;
  const totalCost = holding.shares * holding.avgCost;
  const marketValue = holding.shares * price;
  const gainLoss = marketValue - totalCost;
  const gainLossPercent = totalCost > 0 ? gainLoss / totalCost : 0;
  const dailyChange = quote ? holding.shares * quote.change : 0;
  const dailyChangePercent = quote?.changePercent ?? 0;

  const h52High = fundamentals?.fiftyTwoWeekHigh ?? quote?.fiftyTwoWeekHigh;
  const h52Low = fundamentals?.fiftyTwoWeekLow ?? quote?.fiftyTwoWeekLow;
  const fromHigh = h52High && price ? (price - h52High) / h52High : null;

  return (
    <Layout lastUpdated={lastUpdated} onRefresh={refresh} isLoading={qLoading} usingMock={usingMock}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-5 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-accent font-mono">{ticker}</h1>
            <h2 className="text-lg font-semibold text-slate-200">{holding.name}</h2>
            {holding.isETF && <Badge variant="accent">ETF</Badge>}
            {fundamentals?.sector && (
              <Badge variant="neutral">{fundamentals.sector}</Badge>
            )}
            {fundamentals?.analystRating && (
              <AnalystBadge rating={fundamentals.analystRating} />
            )}
          </div>
          {fundamentals?.industry && (
            <p className="text-xs text-slate-500 mt-1">{fundamentals.industry}</p>
          )}
        </div>
        <div className="text-right">
          {qLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <div className="text-3xl font-bold font-mono text-slate-100">
                {formatCurrency(price)}
              </div>
              <div className={clsx('text-sm font-mono font-semibold mt-0.5', gainLossClass(dailyChangePercent))}>
                {formatCurrency(quote?.change ?? 0)} ({formatPercent(dailyChangePercent)}) today
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column: chart + description */}
        <div className="xl:col-span-2 space-y-4">
          {/* Price chart */}
          <Card title={`${ticker} — 1 Year Price History`} noPadding>
            <div className="px-5 pt-3 pb-1">
              {hLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
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
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => formatCurrency(v, 0)}
                      tick={{ fill: '#475569', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Price']}
                      labelFormatter={formatShortDate}
                      contentStyle={{
                        background: '#1c2d42',
                        border: '1px solid #1a2d42',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Description */}
          {fundamentals?.description && (
            <Card title="Company Description">
              <p className="text-xs text-slate-400 leading-relaxed">{fundamentals.description}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                {fundamentals.employees && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    {fundamentals.employees.toLocaleString()} employees
                  </span>
                )}
                {fundamentals.website && (
                  <a
                    href={fundamentals.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-bright transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Valuation metrics */}
          <Card title="Valuation Metrics">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
              <StatRow label="Trailing P/E" value={formatMultiple(fundamentals?.pe)} />
              <StatRow label="Forward P/E" value={formatMultiple(fundamentals?.forwardPE)} />
              <StatRow label="PEG Ratio" value={formatMultiple(fundamentals?.pegRatio)} />
              <StatRow label="EV/EBITDA" value={formatMultiple(fundamentals?.evToEbitda)} />
              <StatRow label="Price/Book" value={formatMultiple(fundamentals?.priceToBook)} />
              <StatRow label="Price/Sales" value={formatMultiple(fundamentals?.priceToSales)} />
            </div>
          </Card>
        </div>

        {/* Right column: position + key stats */}
        <div className="space-y-4">
          {/* My position */}
          <Card title="My Position">
            <StatRow label="Shares" value={formatShares(holding.shares)} />
            <StatRow label="Avg Cost / Share" value={formatCurrency(holding.avgCost)} />
            <StatRow label="Total Invested" value={formatCurrency(totalCost)} />
            <StatRow label="Current Price" value={formatCurrency(price)} />
            <StatRow label="Market Value" value={formatCurrency(marketValue)} />
            <StatRow
              label="Unrealized P&L"
              value={`${formatCurrency(gainLoss)} (${formatPercent(gainLossPercent)})`}
              color={gainLossClass(gainLoss)}
            />
            <StatRow
              label="Daily P&L"
              value={`${formatCurrency(dailyChange)} (${formatPercent(dailyChangePercent)})`}
              color={gainLossClass(dailyChange)}
            />
          </Card>

          {/* Key statistics */}
          <Card title="Key Statistics">
            <StatRow
              label="Market Cap"
              value={formatMarketCap(fundamentals?.marketCap ?? quote?.marketCap)}
            />
            <StatRow label="Beta" value={formatMultiple(fundamentals?.beta ?? quote?.beta, '')} />
            <StatRow label="52-Week High" value={h52High ? formatCurrency(h52High) : 'N/A'} />
            <StatRow label="52-Week Low" value={h52Low ? formatCurrency(h52Low) : 'N/A'} />
            {fromHigh != null && (
              <StatRow
                label="From 52-Wk High"
                value={formatPercent(fromHigh)}
                color={gainLossClass(fromHigh)}
              />
            )}
            <StatRow
              label="Revenue Growth"
              value={fundamentals?.revenueGrowth != null ? formatPercent(fundamentals.revenueGrowth) : 'N/A'}
              color={fundamentals?.revenueGrowth != null ? gainLossClass(fundamentals.revenueGrowth) : undefined}
            />
            <StatRow
              label="EPS Growth"
              value={fundamentals?.earningsGrowth != null ? formatPercent(fundamentals.earningsGrowth) : 'N/A'}
              color={fundamentals?.earningsGrowth != null ? gainLossClass(fundamentals.earningsGrowth) : undefined}
            />
            <StatRow
              label="Gross Margin"
              value={fundamentals?.grossMargin != null ? formatPercentRaw(fundamentals.grossMargin) : 'N/A'}
            />
            <StatRow
              label="Operating Margin"
              value={fundamentals?.operatingMargin != null ? formatPercentRaw(fundamentals.operatingMargin) : 'N/A'}
              color={fundamentals?.operatingMargin != null ? gainLossClass(fundamentals.operatingMargin) : undefined}
            />
            <StatRow
              label="FCF Yield"
              value={fundamentals?.freeCashflowYield != null ? formatPercentRaw(fundamentals.freeCashflowYield) : 'N/A'}
            />
            <StatRow
              label="Total Revenue"
              value={fundamentals?.totalRevenue != null ? formatLargeNumber(fundamentals.totalRevenue) : 'N/A'}
            />
          </Card>

          {/* Analyst estimates */}
          {!holding.isETF && (
            <Card title="Analyst Estimates">
              <StatRow
                label="Consensus"
                value={fundamentals?.analystRating
                  ? fundamentals.analystRating.charAt(0).toUpperCase() + fundamentals.analystRating.slice(1)
                  : 'N/A'}
              />
              <StatRow
                label="# of Analysts"
                value={fundamentals?.numberOfAnalysts?.toString() ?? 'N/A'}
              />
              <StatRow
                label="Price Target"
                value={fundamentals?.analystTargetPrice ? formatCurrency(fundamentals.analystTargetPrice) : 'N/A'}
              />
              {fundamentals?.analystTargetPrice && price > 0 && (
                <StatRow
                  label="Upside to Target"
                  value={formatPercent((fundamentals.analystTargetPrice - price) / price)}
                  color={gainLossClass(fundamentals.analystTargetPrice - price)}
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
