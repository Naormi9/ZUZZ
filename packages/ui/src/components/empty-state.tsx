import { cn } from '../utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-20 px-6 text-center', className)}
    >
      {icon && <div className="text-gray-300 mb-5">{icon}</div>}
      <h3 className="text-lg font-bold text-brand-black mb-1.5 tracking-tight">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
