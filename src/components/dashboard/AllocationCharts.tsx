import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AllocationEntry, SectorAllocation } from '@/types';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercentRaw } from '@/utils/formatters';

interface PieProps {
  data: AllocationEntry[];
  title: string;
  subtitle?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: AllocationEntry }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-slate-200 mb-1">{d.name}</div>
      <div className="text-slate-400">{formatCurrency(d.value)}</div>
      <div className="text-accent">{formatPercentRaw(d.weight, 1)}</div>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string; payload: AllocationEntry }> }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-2xs text-slate-400">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
          <span className="text-slate-600">
            {formatPercentRaw(entry.payload.weight, 1)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AllocationPie({ data, title, subtitle }: PieProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface AllocationChartsProps {
  positionAllocation: AllocationEntry[];
  sectorAllocation: SectorAllocation[];
  marketCapAllocation: AllocationEntry[];
}

export function AllocationCharts({
  positionAllocation,
  sectorAllocation,
  marketCapAllocation,
}: AllocationChartsProps) {
  const sectorData: AllocationEntry[] = sectorAllocation.map((s) => ({
    name: s.sector,
    value: s.value,
    weight: s.weight,
    color: s.color,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AllocationPie
        data={positionAllocation}
        title="Position Allocation"
        subtitle="by market value"
      />
      <AllocationPie
        data={sectorData}
        title="Sector Allocation"
        subtitle="by sector"
      />
      <AllocationPie
        data={marketCapAllocation}
        title="Market Cap Allocation"
        subtitle="by cap tier"
      />
    </div>
  );
}
