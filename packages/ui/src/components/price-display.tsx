import { cn } from '../utils';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  isNegotiable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({ amount, currency = 'ILS', isNegotiable, size = 'md', className }: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      <span className={cn('font-bold text-gray-900', sizes[size])}>{formatted}</span>
      {isNegotiable && <span className="text-xs text-gray-500">ניתן למשא ומתן</span>}
    </div>
  );
}
