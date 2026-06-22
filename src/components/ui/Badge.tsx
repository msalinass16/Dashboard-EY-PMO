import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type BadgeVariant = 'gain' | 'loss' | 'neutral' | 'accent' | 'gold' | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gain: 'bg-gain/10 text-gain border-gain/20',
  loss: 'bg-loss/10 text-loss border-loss/20',
  neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  accent: 'bg-accent/10 text-accent border-accent/20',
  gold: 'bg-gold/10 text-gold border-gold/20',
  purple: 'bg-purple/10 text-purple border-purple/20',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AnalystBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  const r = rating.toLowerCase();
  const variant: BadgeVariant =
    r === 'buy' || r === 'strong_buy' || r === 'strongbuy'
      ? 'gain'
      : r === 'sell' || r === 'strong_sell' || r === 'strongsell'
      ? 'loss'
      : r === 'hold'
      ? 'gold'
      : 'neutral';
  const label =
    r === 'strong_buy' || r === 'strongbuy'
      ? 'Strong Buy'
      : r === 'strong_sell' || r === 'strongsell'
      ? 'Strong Sell'
      : rating.charAt(0).toUpperCase() + rating.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}
