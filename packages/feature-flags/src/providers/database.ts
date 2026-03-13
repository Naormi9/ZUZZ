import type { FeatureFlag, FeatureFlagContext, FeatureFlagProvider } from '../index';

/**
 * Database-backed feature flag provider.
 * Reads flags from a Prisma-managed database table.
 *
 * Expects a `feature_flags` table with columns:
 *   key, enabled, description, rollout_percentage, allowed_users, allowed_roles, metadata
 *
 * Flags are cached in memory and refreshed on demand.
 */
export class DatabaseFeatureFlagProvider implements FeatureFlagProvider {
  private prisma: any;
  private cache: Map<string, FeatureFlag> = new Map();
  private lastRefresh: number = 0;
  private cacheTtlMs: number;

  constructor(prisma: unknown, options?: { cacheTtlMs?: number }) {
    this.prisma = prisma;
    this.cacheTtlMs = options?.cacheTtlMs ?? 60_000; // 1 minute default
  }

  async isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean> {
    await this.ensureCache();
    const flag = this.cache.get(key);
    if (!flag) return false;
    if (!flag.enabled) return false;
    return this.evaluateFlag(flag, context);
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    await this.ensureCache();
    return this.cache.get(key) ?? null;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    await this.ensureCache();
    return Array.from(this.cache.values());
  }

  async refresh(): Promise<void> {
    try {
      const rows = await this.prisma.featureFlag.findMany();
      this.cache.clear();

      for (const row of rows) {
        const flag: FeatureFlag = {
          key: row.key,
          enabled: row.enabled,
          description: row.description ?? undefined,
          rolloutPercentage: row.rolloutPercentage ?? undefined,
          allowedUsers: row.allowedUsers ?? undefined,
          allowedRoles: row.allowedRoles ?? undefined,
          metadata: row.metadata ?? undefined,
        };
        this.cache.set(flag.key, flag);
      }

      this.lastRefresh = Date.now();
    } catch (error) {
      // If the table doesn't exist yet, start with empty flags
      console.warn('[FeatureFlags] Failed to load flags from database:', error);
    }
  }

  private async ensureCache(): Promise<void> {
    if (Date.now() - this.lastRefresh > this.cacheTtlMs) {
      await this.refresh();
    }
  }

  private evaluateFlag(flag: FeatureFlag, context?: FeatureFlagContext): boolean {
    if (!context) return flag.enabled;

    if (flag.allowedUsers && flag.allowedUsers.length > 0) {
      if (!context.userId || !flag.allowedUsers.includes(context.userId)) {
        return false;
      }
    }

    if (flag.allowedRoles && flag.allowedRoles.length > 0) {
      if (!context.userRole || !flag.allowedRoles.includes(context.userRole)) {
        return false;
      }
    }

    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      if (!context.userId) return false;
      const hash = this.simpleHash(`${flag.key}:${context.userId}`);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
