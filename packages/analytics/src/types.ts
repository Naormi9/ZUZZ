/**
 * Re-export and extend the analytics types from @zuzz/types.
 * These types are the canonical event definitions used by the tracker.
 */
export type {
  AnalyticsEventType,
  AnalyticsEvent,
  AnalyticsSummary,
} from '@zuzz/types';

export interface TrackEventInput {
  type: import('@zuzz/types').AnalyticsEventType;
  userId?: string;
  sessionId: string;
  properties?: Record<string, unknown>;
  source?: import('@zuzz/types').AnalyticsEvent['source'];
  userAgent?: string;
  ip?: string;
}

export interface AnalyticsQueryOptions {
  /** Filter by event type */
  type?: import('@zuzz/types').AnalyticsEventType;
  /** Filter by user */
  userId?: string;
  /** Start date */
  from?: Date;
  /** End date */
  to?: Date;
  /** Max results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface AnalyticsCountResult {
  type: string;
  count: number;
}
