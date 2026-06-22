export function formatCurrency(value: number, decimals = 2): string {
  if (!isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number, decimals = 2): string {
  if (!isFinite(value)) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!isFinite(value)) return 'N/A';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatLargeNumber(value: number): string {
  if (!isFinite(value)) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return formatCurrency(value, 0);
}

export function formatMarketCap(value?: number): string {
  if (value == null || !isFinite(value)) return 'N/A';
  return formatLargeNumber(value);
}

export function formatMultiple(value?: number | null, suffix = 'x'): string {
  if (value == null || !isFinite(value) || value <= 0) return 'N/A';
  return `${value.toFixed(1)}${suffix}`;
}

export function gainLossClass(value: number): string {
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-slate-400';
}

export function gainLossBg(value: number): string {
  if (value > 0) return 'bg-gain/10 text-gain border-gain/20';
  if (value < 0) return 'bg-loss/10 text-loss border-loss/20';
  return 'bg-slate-800 text-slate-400 border-slate-700';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatShares(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}
