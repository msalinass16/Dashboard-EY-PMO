import { clsx } from 'clsx';
import type { PortfolioHealthMetrics } from '@/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={90} height={90} className="rotate-[-90deg]">
      <circle cx={45} cy={45} r={r} fill="none" stroke="#1a2d42" strokeWidth={8} />
      <circle
        cx={45}
        cy={45}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={45}
        y={50}
        textAnchor="middle"
        className="rotate-[90deg]"
        style={{
          transform: 'rotate(90deg) translate(0, -90px)',
          fill: color,
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {score}
      </text>
    </svg>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-gain' : value >= 45 ? 'bg-gold' : 'bg-loss';
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xs text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', color)}
          style={{ width: `${value}%`, opacity: 0.8 }}
        />
      </div>
      <span className="text-2xs font-mono text-slate-400 w-6 text-right">{value}</span>
    </div>
  );
}

interface HealthScoreProps {
  health: PortfolioHealthMetrics;
  compact?: boolean;
}

export function HealthScore({ health, compact = false }: HealthScoreProps) {
  const { score, components, strengths, weaknesses } = health;
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Attention';
  const labelColor = score >= 80 ? 'text-gain' : score >= 65 ? 'text-accent' : score >= 50 ? 'text-gold' : 'text-loss';

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <ScoreRing score={score} />
        <div>
          <div className="text-xs text-slate-500">Portfolio Health</div>
          <div className={clsx('text-lg font-bold font-mono', labelColor)}>{score}/100</div>
          <div className={clsx('text-xs', labelColor)}>{label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-5">
        <ScoreRing score={score} />
        <div className="space-y-3 flex-1">
          <div>
            <div className="text-2xs text-slate-500 uppercase tracking-wide mb-0.5">Health Score</div>
            <div className={clsx('text-2xl font-bold font-mono', labelColor)}>{score}/100</div>
            <div className={clsx('text-xs font-medium', labelColor)}>{label}</div>
          </div>
          <div className="space-y-1.5">
            <ComponentBar label="Diversification" value={components.diversification} />
            <ComponentBar label="Concentration" value={components.concentration} />
            <ComponentBar label="Performance" value={components.performance} />
            <ComponentBar label="Volatility" value={components.volatility} />
            <ComponentBar label="Valuation" value={components.valuation} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {strengths.length > 0 && (
          <div>
            <div className="text-2xs text-gain font-medium uppercase tracking-wide mb-2">Strengths</div>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-2xs text-slate-400">
                  <CheckCircle className="w-3 h-3 text-gain shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {weaknesses.length > 0 && (
          <div>
            <div className="text-2xs text-loss font-medium uppercase tracking-wide mb-2">Weaknesses</div>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5 text-2xs text-slate-400">
                  <AlertCircle className="w-3 h-3 text-gold shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
