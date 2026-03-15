import { cn } from '../utils';
import { Badge } from './badge';

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TrustBadge({ score, size = 'md', showLabel = true, className }: TrustBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 80)
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'אמון גבוה',
      };
    if (s >= 60)
      return {
        bg: 'bg-brand-50',
        text: 'text-brand-700',
        border: 'border-brand-200',
        label: 'אמון טוב',
      };
    if (s >= 40)
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'אמון בינוני',
      };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'אמון נמוך' };
  };

  const color = getColor(score);
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (size !== 'sm' && showLabel) {
    // Rich trust badge with progress bar for md/lg
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2.5 rounded-xl border px-3 py-2',
          color.bg,
          color.text,
          color.border,
          size === 'lg' ? 'text-base' : 'text-sm',
          className,
        )}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">{color.label}</span>
            <span className="font-bold">{score}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-current transition-all duration-500"
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        color.bg,
        color.text,
        color.border,
        sizes[size],
        className,
      )}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="font-semibold">{score}</span>
      {showLabel && <span className="font-normal">{color.label}</span>}
    </div>
  );
}
