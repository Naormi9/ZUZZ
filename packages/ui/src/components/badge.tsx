import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        secondary: 'bg-gray-100 text-gray-600',
        trust: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        verified: 'bg-brand-50 text-brand-700 border border-brand-200',
        ev: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        outline: 'border border-gray-200 text-gray-600',
        premium: 'bg-brand-black text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
