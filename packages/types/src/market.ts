import type { ListingBase } from './listing';

export type MarketCategory =
  | 'electronics'
  | 'furniture'
  | 'fashion'
  | 'sports'
  | 'garden'
  | 'kids'
  | 'pets'
  | 'books'
  | 'music'
  | 'collectibles'
  | 'tools'
  | 'other';

export type MarketCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';

export interface MarketListing extends ListingBase {
  vertical: 'market';
  category: MarketCategory;
  condition: MarketCondition;
  attributes: Record<string, string | number | boolean>;
  brand?: string;
  isFreeDelivery?: boolean;
  shippingAvailable?: boolean;
}

export interface MarketSearchFilters {
  category?: MarketCategory[];
  condition?: MarketCondition[];
  priceFrom?: number;
  priceTo?: number;
  city?: string[];
  freeDelivery?: boolean;
  query?: string;
}
