import type { FeatureFlag, FeatureFlagContext, FeatureFlagProvider } from '../index';

/**
 * Local JSON-based feature flag provider.
 * Flags are provided at construction time and stored in memory.
 */
export class LocalFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Map<string, FeatureFlag>;

  constructor(flags: FeatureFlag[]) {
    this.flags = new Map(flags.map((f) => [f.key, f]));
  }

  async isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean> {
    const flag = this.flags.get(key);
    if (!flag) return false;
    if (!flag.enabled) return false;

    return this.evaluateFlag(flag, context);
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) ?? null;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  async refresh(): Promise<void> {
    // No-op for local provider
  }

  /** Update flags at runtime (useful in tests) */
  setFlags(flags: FeatureFlag[]): void {
    this.flags = new Map(flags.map((f) => [f.key, f]));
  }

  private evaluateFlag(flag: FeatureFlag, context?: FeatureFlagContext): boolean {
    if (!context) return flag.enabled;

    // Check allowed users
    if (flag.allowedUsers && flag.allowedUsers.length > 0) {
      if (!context.userId || !flag.allowedUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check allowed roles
    if (flag.allowedRoles && flag.allowedRoles.length > 0) {
      if (!context.userRole || !flag.allowedRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Check rollout percentage
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
