import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { AllocationCharts } from '@/components/dashboard/AllocationCharts';
import { Card } from '@/components/ui/Card';
import { formatPercentRaw, formatCurrency } from '@/utils/formatters';
import type { AllocationEntry } from '@/types';

function ConcentrationWarning({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-gold/5 border border-gold/20 rounded-lg px-3 py-2.5">
      <AlertTriangle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
      <span className="text-xs text-gold/90">{message}</span>
    </div>
  );
}

function AllocationBar({ entry, maxWeight }: { entry: AllocationEntry; maxWeight: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
      <span className="text-xs text-slate-300 flex-1 truncate">{entry.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-24 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${(entry.weight / maxWeight) * 100}%`, backgroundColor: entry.color, opacity: 0.8 }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 w-12 text-right">{formatPercentRaw(entry.weight, 1)}</span>
        <span className="text-xs font-mono text-slate-500 w-20 text-right">{formatCurrency(entry.value)}</span>
      </div>
    </div>
  );
}

// Known country mapping for holdings
const COUNTRY_MAP: Record<string, string> = {
  MU: 'United States',
  WDC: 'United States',
  CRDO: 'United States',
  DRAM: 'United States',
  SMH: 'United States',
  ARM: 'United Kingdom',
  NASA: 'United States',
  NOK: 'Finland',
  IONQ: 'United States',
  RGTI: 'United States',
  QBTS: 'United States',
  NVDA: 'United States',
  NOW: 'United States',
};

const COUNTRY_COLORS: Record<string, string> = {
  'United States': '#38bdf8',
  'United Kingdom': '#a855f7',
  'Finland': '#f59e0b',
  'Taiwan': '#22c55e',
  'Other': '#64748b',
};

export function AllocationPage() {
  const { positions, positionAllocation, sectorAllocation, marketCapAllocation, concentration, sectorConcentrationRisk } = usePortfolio();

  // Country allocation
  const countryMap = new Map<string, number>();
  for (const pos of positions) {
    const country = COUNTRY_MAP[pos.ticker] ?? 'Other';
    countryMap.set(country, (countryMap.get(country) ?? 0) + pos.marketValue);
  }
  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const countryAlloc: AllocationEntry[] = [...countryMap.entries()]
    .map(([name, value]) => ({
      name,
      value,
      weight: totalValue > 0 ? value / totalValue : 0,
      color: COUNTRY_COLORS[name] ?? '#64748b',
    }))
    .sort((a, b) => b.weight - a.weight);

  // Build warnings
  const warnings: string[] = [];
  const techWeight = sectorAllocation.find((s) => s.sector === 'Technology')?.weight ?? 0;
  if (techWeight > 0.6) warnings.push(`Technology exposure is ${formatPercentRaw(techWeight, 0)} of portfolio (>60% threshold)`);
  if (sectorConcentrationRisk > 0.7) warnings.push(`Single sector exceeds ${formatPercentRaw(sectorConcentrationRisk, 0)} concentration`);
  if (concentration?.top1Weight && concentration.top1Weight > 0.25)
    warnings.push(`${concentration.top1Ticker} is ${formatPercentRaw(concentration.top1Weight, 0)} of portfolio (>25% threshold)`);
  if (concentration?.top3Weight && concentration.top3Weight > 0.5)
    warnings.push(`Top 3 positions represent ${formatPercentRaw(concentration.top3Weight, 0)} of portfolio`);

  const sectorData: AllocationEntry[] = sectorAllocation.map((s) => ({ name: s.sector, value: s.value, weight: s.weight, color: s.color }));
  const sectorMax = Math.max(...sectorData.map((s) => s.weight), 0.01);
  const posMax = Math.max(...positionAllocation.map((p) => p.weight), 0.01);

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => <ConcentrationWarning key={i} message={w} />)}
        </div>
      )}

      {/* Donut charts */}
      <AllocationCharts
        positionAllocation={positionAllocation}
        sectorAllocation={sectorAllocation}
        marketCapAllocation={marketCapAllocation}
      />

      {/* Detail tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector */}
        <Card title="Sector Breakdown" subtitle="by market value">
          <div>
            {sectorData.map((s) => (
              <AllocationBar key={s.name} entry={s} maxWeight={sectorMax} />
            ))}
          </div>
        </Card>

        {/* Country */}
        <Card title="Geographic Exposure" subtitle="by domicile">
          <div>
            {countryAlloc.map((c) => (
              <AllocationBar key={c.name} entry={c} maxWeight={countryAlloc[0]?.weight ?? 0.01} />
            ))}
          </div>
        </Card>

        {/* Top positions */}
        <Card title="Position Weights" subtitle="all positions ranked">
          <div>
            {positionAllocation.map((p) => (
              <AllocationBar key={p.name} entry={p} maxWeight={posMax} />
            ))}
          </div>
        </Card>
      </div>

      {/* Concentration metrics */}
      {concentration && (
        <Card title="Concentration Metrics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xs text-slate-500 mb-1">Top 1 Position</div>
              <div className="text-xl font-bold font-mono text-slate-200">
                {formatPercentRaw(concentration.top1Weight, 1)}
              </div>
              <div className="text-2xs text-slate-500">{concentration.top1Ticker}</div>
            </div>
            <div className="text-center">
              <div className="text-2xs text-slate-500 mb-1">Top 3 Positions</div>
              <div className="text-xl font-bold font-mono text-slate-200">{formatPercentRaw(concentration.top3Weight, 1)}</div>
            </div>
            <div className="text-center">
              <div className="text-2xs text-slate-500 mb-1">Top 5 Positions</div>
              <div className="text-xl font-bold font-mono text-slate-200">{formatPercentRaw(concentration.top5Weight, 1)}</div>
            </div>
            <div className="text-center">
              <div className="text-2xs text-slate-500 mb-1">Effective N</div>
              <div className="text-xl font-bold font-mono text-slate-200">{concentration.effectiveN.toFixed(1)}</div>
              <div className="text-2xs text-slate-500">diversification</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
