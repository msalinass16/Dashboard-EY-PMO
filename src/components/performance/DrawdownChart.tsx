import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { DrawdownPoint } from '@/types';
import { formatShortDate } from '@/utils/formatters';

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const dd = payload[0].value as number;
  return (
    <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      <div className={dd < 0 ? 'text-loss font-mono font-semibold' : 'text-slate-300 font-mono'}>
        {dd === 0 ? 'At peak' : `${(dd * 100).toFixed(2)}%`}
      </div>
    </div>
  );
}

interface DrawdownChartProps {
  data: DrawdownPoint[];
  height?: number;
}

export function DrawdownChart({ data, height = 220 }: DrawdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-sm" style={{ height }}>
        Insufficient data
      </div>
    );
  }

  const maxDD = Math.min(...data.map((d) => d.drawdown));
  const maxDDPoint = data.find((d) => d.drawdown === maxDD);

  const chartData = data.map((d) => ({ date: d.date, drawdown: d.drawdown * 100 }));

  return (
    <div>
      {maxDDPoint && (
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="text-slate-500">Max Drawdown</span>
          <span className="font-mono font-semibold text-loss">
            {(maxDD * 100).toFixed(2)}%
          </span>
          <span className="text-slate-600">on {maxDDPoint.date}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
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
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={45}
            domain={['dataMin', 0]}
          />
          <ReferenceLine y={0} stroke="#1a2d42" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="drawdown"
            name="Drawdown"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#ddGrad)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: '#ef4444' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
