import type { SearchProvider } from '../index';
import type {
  SearchProviderQuery,
  SearchProviderResult,
  SearchSuggestion,
  SearchFacetResult,
} from '../types';

/**
 * PostgreSQL full-text search provider using pg_trgm and tsvector.
 *
 * This provider executes raw SQL queries against the listings table
 * with full-text search ranking, trigram similarity for suggestions,
 * and aggregation queries for facets.
 */
export class PostgresSearchProvider implements SearchProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: Record<string, any>;

  constructor(prisma: unknown) {
    this.prisma = prisma as Record<string, any>;
  }

  async search<T = Record<string, unknown>>(
    query: SearchProviderQuery
  ): Promise<SearchProviderResult<T>> {
    const start = Date.now();
    const { q, vertical, filters, page = 1, pageSize = 20, sortBy, sortOrder = 'desc', facetFields, geo } = query;

    const conditions: string[] = [`"vertical" = '${vertical}'`, `"status" = 'active'`];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Full-text search condition
    let orderClause = `"createdAt" DESC`;
    if (q && q.trim()) {
      conditions.push(
        `(
          "searchVector" @@ plainto_tsquery('hebrew', $${paramIndex})
          OR similarity("title", $${paramIndex}) > 0.2
        )`
      );
      params.push(q.trim());
      orderClause = `ts_rank("searchVector", plainto_tsquery('hebrew', $${paramIndex})) DESC`;
      paramIndex++;
    }

    // Geographic filter using PostGIS
    if (geo) {
      conditions.push(
        `ST_DWithin(
          "location"::geography,
          ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)::geography,
          $${paramIndex + 2}
        )`
      );
      params.push(geo.lng, geo.lat, geo.radiusKm * 1000);
      paramIndex += 3;
    }

    // Dynamic filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;

        if (typeof value === 'object' && value !== null && ('min' in value || 'max' in value)) {
          const range = value as { min?: number; max?: number };
          if (range.min !== undefined) {
            conditions.push(`("data"->>'${key}')::numeric >= $${paramIndex}`);
            params.push(range.min);
            paramIndex++;
          }
          if (range.max !== undefined) {
            conditions.push(`("data"->>'${key}')::numeric <= $${paramIndex}`);
            params.push(range.max);
            paramIndex++;
          }
        } else if (Array.isArray(value)) {
          conditions.push(`"data"->>'${key}' = ANY($${paramIndex})`);
          params.push(value);
          paramIndex++;
        } else {
          conditions.push(`"data"->>'${key}' = $${paramIndex}`);
          params.push(String(value));
          paramIndex++;
        }
      }
    }

    // Custom sort
    if (sortBy) {
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
      if (['createdAt', 'updatedAt', 'price'].includes(sortBy)) {
        orderClause = `"${sortBy}" ${direction}`;
      } else {
        orderClause = `"data"->>'${sortBy}' ${direction}`;
      }
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    // Execute count and data queries in parallel
    const [countResult, items] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "listings" WHERE ${whereClause}`,
        ...params
      ) as Promise<Array<{ count: bigint }>>,
      this.prisma.$queryRawUnsafe(
        `SELECT * FROM "listings" WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`,
        ...params
      ) as Promise<T[]>,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    // Compute facets if requested
    let facets: SearchFacetResult[] = [];
    if (facetFields && facetFields.length > 0) {
      facets = await this.computeFacets(facetFields, whereClause, params);
    }

    return {
      items,
      total,
      page,
      pageSize,
      facets,
      took: Date.now() - start,
    };
  }

  async suggest(
    query: string,
    vertical: 'cars' | 'homes' | 'market',
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    if (!query.trim()) return [];

    const results = (await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT "title", similarity("title", $1) as similarity
       FROM "listings"
       WHERE "vertical" = $2 AND "status" = 'active'
         AND similarity("title", $1) > 0.15
       ORDER BY similarity DESC
       LIMIT $3`,
      query.trim(),
      vertical,
      limit
    )) as Array<{ title: string; similarity: number }>;

    return results.map((r: { title: string; similarity: number }) => ({
      text: r.title,
      score: r.similarity,
    }));
  }

  async facets(
    vertical: 'cars' | 'homes' | 'market',
    fields: string[]
  ): Promise<SearchFacetResult[]> {
    const whereClause = `"vertical" = '${vertical}' AND "status" = 'active'`;
    return this.computeFacets(fields, whereClause, []);
  }

  private async computeFacets(
    fields: string[],
    whereClause: string,
    params: unknown[]
  ): Promise<SearchFacetResult[]> {
    const facets: SearchFacetResult[] = [];

    for (const field of fields) {
      try {
        const rows = (await this.prisma.$queryRawUnsafe(
          `SELECT "data"->>'${field}' as value, COUNT(*) as count
           FROM "listings"
           WHERE ${whereClause} AND "data"->>'${field}' IS NOT NULL
           GROUP BY "data"->>'${field}'
           ORDER BY count DESC
           LIMIT 50`,
          ...params
        )) as Array<{ value: string; count: bigint }>;

        facets.push({
          field,
          label: field,
          values: rows.map((r: { value: string; count: bigint }) => ({
            value: r.value,
            label: r.value,
            count: Number(r.count),
          })),
        });
      } catch {
        // Skip facets that fail (e.g., non-existent fields)
      }
    }

    return facets;
  }
}
