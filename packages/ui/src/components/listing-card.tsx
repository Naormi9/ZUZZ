import { cn } from '../utils';
import { Badge } from './badge';
import { TrustBadge } from './trust-badge';
import { PriceDisplay } from './price-display';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  isNegotiable?: boolean;
  imageUrl?: string;
  city?: string;
  trustScore?: number;
  badges?: Array<{ label: string; variant: 'success' | 'warning' | 'verified' | 'ev' | 'default' }>;
  details?: Array<{ label: string; value: string }>;
  isFeatured?: boolean;
  isPromoted?: boolean;
  vertical?: string;
  onFavorite?: () => void;
  isFavorited?: boolean;
  onCompare?: () => void;
  isInCompare?: boolean;
  className?: string;
  href?: string;
}

export function ListingCard({
  title,
  price,
  currency = 'ILS',
  isNegotiable,
  imageUrl,
  city,
  trustScore,
  badges = [],
  details = [],
  isFeatured,
  isPromoted,
  vertical,
  onFavorite,
  isFavorited,
  onCompare,
  isInCompare,
  className,
  href,
}: ListingCardProps) {
  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={cn(
        'group block rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-md',
        isFeatured ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 start-2 flex flex-wrap gap-1">
          {isPromoted && <Badge variant="warning">מודעה מקודמת</Badge>}
          {isFeatured && <Badge variant="warning">מודעה נבחרת</Badge>}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 end-2 flex flex-col gap-1.5">
          {onFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite();
              }}
              className="h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <svg
                className={cn('w-5 h-5', isFavorited ? 'text-red-500 fill-current' : 'text-gray-400')}
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
          {onCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCompare();
              }}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center shadow-sm transition-colors',
                isInCompare
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/90 text-gray-400 hover:bg-white',
              )}
              title={isInCompare ? 'הסר מהשוואה' : 'הוסף להשוואה'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Price */}
        <PriceDisplay amount={price} currency={currency} isNegotiable={isNegotiable} size="sm" />

        {/* Title */}
        <h3 className="text-sm font-semibold text-brand-black mt-1 line-clamp-2 tracking-tight">{title}</h3>

        {/* Details grid */}
        {details.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-500">
            {details.map((d, i) => (
              <span key={i}>{d.value}</span>
            ))}
          </div>
        )}

        {/* Bottom row: location + trust */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
          {city && <span className="text-xs text-gray-400">{city}</span>}
          <div className="flex items-center gap-1">
            {badges.map((b, i) => (
              <Badge key={i} variant={b.variant} className="text-[10px]">
                {b.label}
              </Badge>
            ))}
            {trustScore && trustScore > 0 && (
              <TrustBadge score={trustScore} size="sm" showLabel={false} />
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
