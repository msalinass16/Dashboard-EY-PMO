import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-border border-t-accent',
        sizeClass,
        className
      )}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'h-3 rounded bg-gradient-to-r from-surface via-bg-elevated to-surface animate-shimmer bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-2/3 h-5" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}
