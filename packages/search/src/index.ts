export type {
  SearchQuery,
  SearchResult,
  SearchFacet,
  SearchFacetValue,
  SearchProviderQuery,
  SearchProviderResult,
  SearchFacetResult,
  SearchSuggestion,
} from './types';

export interface SearchProvider {
  /** Execute a search query */
  search<T = Record<string, unknown>>(
    query: import('./types').SearchProviderQuery
  ): Promise<import('./types').SearchProviderResult<T>>;

  /** Get search suggestions / autocomplete */
  suggest(
    query: string,
    vertical: 'cars' | 'homes' | 'market',
    limit?: number
  ): Promise<import('./types').SearchSuggestion[]>;

  /** Get facet values for a vertical */
  facets(
    vertical: 'cars' | 'homes' | 'market',
    fields: string[]
  ): Promise<import('./types').SearchFacetResult[]>;
}

export function createSearchProvider(type: 'postgres', prisma: unknown): SearchProvider {
  switch (type) {
    case 'postgres': {
      const { PostgresSearchProvider } = require('./providers/postgres') as typeof import('./providers/postgres');
      return new PostgresSearchProvider(prisma);
    }
    default:
      throw new Error(`Unknown search provider: ${type}`);
  }
}

export { PostgresSearchProvider } from './providers/postgres';
