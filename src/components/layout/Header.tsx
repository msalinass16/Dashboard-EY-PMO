import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  usingMock: boolean;
}

export function Header({ lastUpdated, onRefresh, isLoading, usingMock }: HeaderProps) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 bg-accent/20 rounded-md">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">Portfolio</span>
            <span className="text-sm font-semibold text-accent tracking-tight"> Dashboard</span>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {usingMock && (
            <span className="flex items-center gap-1.5 text-gold font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Demo mode — live data unavailable
            </span>
          )}
          <span className="hidden sm:block">
            Last updated: <span className="text-slate-300 font-mono">{timeStr}</span>
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition-colors disabled:opacity-40"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
