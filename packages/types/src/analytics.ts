export type AnalyticsEventType =
  | 'page_view'
  | 'search_performed'
  | 'filter_changed'
  | 'listing_viewed'
  | 'listing_created'
  | 'listing_published'
  | 'favorite_added'
  | 'favorite_removed'
  | 'message_started'
  | 'message_sent'
  | 'lead_submitted'
  | 'promotion_purchased'
  | 'verification_started'
  | 'verification_completed'
  | 'share_clicked'
  | 'report_submitted'
  | 'phone_revealed'
  | 'dealer_page_viewed';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  source: 'web' | 'admin' | 'api';
  userAgent?: string;
  ip?: string;
}

export interface AnalyticsSummary {
  period: 'day' | 'week' | 'month';
  metrics: Record<string, number>;
  series: Array<{
    date: string;
    values: Record<string, number>;
  }>;
}
