/**
 * Re-export search types from @zuzz/types and add provider-specific types.
 */
export type {
  SearchQuery,
  SearchResult,
  SearchFacet,
  SearchFacetValue,
} from '@zuzz/types';

export interface SearchProviderQuery {
  /** Free-text search query */
  q?: string;
  /** Vertical to search in */
  vertical: 'cars' | 'homes' | 'market';
  /** Structured filters */
  filters?: Record<string, unknown>;
  /** Page number (1-based) */
  page?: number;
  /** Results per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Facet fields to compute */
  facetFields?: string[];
  /** Geographic bounding box filter */
  geo?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
}

export interface SearchProviderResult<T = Record<string, unknown>> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacetResult[];
  /** Query execution time in milliseconds */
  took: number;
}

export interface SearchFacetResult {
  field: string;
  label: string;
  values: Array<{
    value: string;
    label: string;
    count: number;
  }>;
}

export interface SearchSuggestion {
  text: string;
  highlight?: string;
  score: number;
}
