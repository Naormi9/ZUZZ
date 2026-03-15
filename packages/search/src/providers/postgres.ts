import type { SearchProvider } from '../index';
import type {
  SearchProviderQuery,
  SearchProviderResult,
  SearchSuggestion,
  SearchFacetResult,
} from '../types';

/**
 * Allowed field names for dynamic filter/facet/sort queries.
 * Only these identifiers may appear in SQL — prevents injection.
 */
const ALLOWED_DATA_FIELDS = new Set([
  'make',
  'model',
  'year',
  'mileage',
  'fuelType',
  'gearbox',
  'bodyType',
  'color',
  'sellerType',
  'handCount',
  'engineVolume',
  'horsepower',
  'seats',
  'isElectric',
  'propertyType',
  'listingType',
  'rooms',
  'sizeSqm',
  'floor',
  'category',
  'condition',
  'brand',
]);

const ALLOWED_VERTICALS = new Set(['cars', 'homes', 'market']);

const ALLOWED_SORT_COLUMNS = new Set(['createdAt', 'updatedAt', 'priceAmount', 'trustScore']);

function assertValidIdentifier(name: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
}

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
    query: SearchProviderQuery,
  ): Promise<SearchProviderResult<T>> {
    const start = Date.now();
    const {
      q,
      vertical,
      filters,
      page = 1,
      pageSize = 20,
      sortBy,
      sortOrder = 'desc',
      facetFields,
      geo,
    } = query;

    // Validate vertical against allowlist
    if (!ALLOWED_VERTICALS.has(vertical)) {
      throw new Error(`Invalid vertical: ${vertical}`);
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Use parameterized query for vertical
    conditions.push(`"vertical" = $${paramIndex}`);
    params.push(vertical);
    paramIndex++;

    conditions.push(`"status" = 'active'`);

    // Full-text search condition
    let orderClause = `"createdAt" DESC`;
    if (q && q.trim()) {
      conditions.push(
        `(
          "searchVector" @@ plainto_tsquery('hebrew', $${paramIndex})
          OR similarity("title", $${paramIndex}) > 0.2
        )`,
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
        )`,
      );
      params.push(geo.lng, geo.lat, geo.radiusKm * 1000);
      paramIndex += 3;
    }

    // Dynamic filters — only allow whitelisted field names
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;
        if (!ALLOWED_DATA_FIELDS.has(key)) continue;
        assertValidIdentifier(key);

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

    // Custom sort — only allow whitelisted columns
    if (sortBy) {
      const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
      if (ALLOWED_SORT_COLUMNS.has(sortBy)) {
        orderClause = `"${sortBy}" ${direction}`;
      } else if (ALLOWED_DATA_FIELDS.has(sortBy)) {
        assertValidIdentifier(sortBy);
        orderClause = `"data"->>'${sortBy}' ${direction}`;
      }
      // If sortBy is not in any allowlist, keep the default order
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    // Execute count and data queries in parallel
    const [countResult, items] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "listings" WHERE ${whereClause}`,
        ...params,
      ) as Promise<Array<{ count: bigint }>>,
      this.prisma.$queryRawUnsafe(
        `SELECT * FROM "listings" WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`,
        ...params,
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
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    if (!query.trim()) return [];
    if (!ALLOWED_VERTICALS.has(vertical)) return [];

    const results = (await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT "title", similarity("title", $1) as similarity
       FROM "listings"
       WHERE "vertical" = $2 AND "status" = 'active'
         AND similarity("title", $1) > 0.15
       ORDER BY similarity DESC
       LIMIT $3`,
      query.trim(),
      vertical,
      limit,
    )) as Array<{ title: string; similarity: number }>;

    return results.map((r: { title: string; similarity: number }) => ({
      text: r.title,
      score: r.similarity,
    }));
  }

  async facets(
    vertical: 'cars' | 'homes' | 'market',
    fields: string[],
  ): Promise<SearchFacetResult[]> {
    if (!ALLOWED_VERTICALS.has(vertical)) return [];
    return this.computeFacets(fields, `"vertical" = '${vertical}' AND "status" = 'active'`, []);
  }

  private async computeFacets(
    fields: string[],
    whereClause: string,
    params: unknown[],
  ): Promise<SearchFacetResult[]> {
    const facets: SearchFacetResult[] = [];

    for (const field of fields) {
      // Only allow whitelisted field names to prevent SQL injection
      if (!ALLOWED_DATA_FIELDS.has(field)) continue;
      assertValidIdentifier(field);

      try {
        const rows = (await this.prisma.$queryRawUnsafe(
          `SELECT "data"->>'${field}' as value, COUNT(*) as count
           FROM "listings"
           WHERE ${whereClause} AND "data"->>'${field}' IS NOT NULL
           GROUP BY "data"->>'${field}'
           ORDER BY count DESC
           LIMIT 50`,
          ...params,
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
