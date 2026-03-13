import type { PaginationParams, SortParams } from './common';

export interface SavedSearch {
  id: string;
  userId: string;
  vertical: 'cars' | 'homes' | 'market';
  name?: string;
  filters: Record<string, unknown>;
  alertEnabled: boolean;
  alertFrequency?: 'instant' | 'daily' | 'weekly';
  lastAlertAt?: Date;
  createdAt: Date;
}

export interface SearchQuery extends PaginationParams, SortParams {
  q?: string;
  vertical: 'cars' | 'homes' | 'market';
  filters: Record<string, unknown>;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  facets?: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  label: string;
  values: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface RecentlyViewed {
  userId: string;
  listingId: string;
  viewedAt: Date;
}
