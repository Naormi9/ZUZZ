export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  vertical?: 'cars' | 'homes' | 'market';
  environment?: string;
  [key: string]: unknown;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  /** Optional description */
  description?: string;
  /** Percentage rollout (0-100). If set, flag is enabled for this % of users. */
  rolloutPercentage?: number;
  /** Restrict to specific user IDs */
  allowedUsers?: string[];
  /** Restrict to specific roles */
  allowedRoles?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagProvider {
  /** Check if a feature flag is enabled */
  isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean>;
  /** Get a feature flag definition */
  getFlag(key: string): Promise<FeatureFlag | null>;
  /** List all flags */
  getAllFlags(): Promise<FeatureFlag[]>;
  /** Refresh cached flags */
  refresh(): Promise<void>;
}

export function createFeatureFlagProvider(type: 'local', flags: FeatureFlag[]): FeatureFlagProvider;
export function createFeatureFlagProvider(type: 'database', prisma: unknown): FeatureFlagProvider;
export function createFeatureFlagProvider(
  type: 'local' | 'database',
  arg: FeatureFlag[] | unknown,
): FeatureFlagProvider {
  switch (type) {
    case 'local': {
      const { LocalFeatureFlagProvider } =
        require('./providers/local') as typeof import('./providers/local');
      return new LocalFeatureFlagProvider(arg as FeatureFlag[]);
    }
    case 'database': {
      const { DatabaseFeatureFlagProvider } =
        require('./providers/database') as typeof import('./providers/database');
      return new DatabaseFeatureFlagProvider(arg);
    }
    default:
      throw new Error(`Unknown feature flag provider: ${type}`);
  }
}

export { LocalFeatureFlagProvider } from './providers/local';
export { DatabaseFeatureFlagProvider } from './providers/database';
