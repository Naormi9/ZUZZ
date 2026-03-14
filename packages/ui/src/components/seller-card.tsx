import { cn } from '../utils';
import { Badge } from './badge';

interface SellerCardProps {
  name: string;
  memberSince?: string;
  city?: string;
  responseTime?: number;
  responseRate?: number;
  isVerified?: boolean;
  isDealer?: boolean;
  avatarUrl?: string;
  badges?: Array<{ type: string; label: string }>;
  className?: string;
}

export function SellerCard({
  name,
  memberSince,
  city,
  responseTime,
  responseRate,
  isVerified,
  isDealer,
  badges = [],
  className,
}: SellerCardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
            {isVerified && (
              <svg
                className="w-4 h-4 text-brand-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            {isDealer && <Badge variant="verified">סוחר מאומת</Badge>}
            {city && <span>{city}</span>}
            {memberSince && <span>חבר מ-{memberSince}</span>}
          </div>
        </div>
      </div>

      {(responseTime || responseRate) && (
        <div className="flex gap-4 mt-3 text-xs text-gray-600">
          {responseTime && (
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>
                זמן תגובה:{' '}
                {responseTime < 60
                  ? `${responseTime} דק׳`
                  : `${Math.round(responseTime / 60)} שעות`}
              </span>
            </div>
          )}
          {responseRate && (
            <div className="flex items-center gap-1">
              <span>💬</span>
              <span>שיעור תגובה: {responseRate}%</span>
            </div>
          )}
        </div>
      )}

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {badges.map((badge, i) => (
            <Badge key={i} variant="trust" className="text-[10px]">
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
