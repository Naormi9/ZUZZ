export type NotificationType =
  | 'message_received'
  | 'lead_received'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_expired'
  | 'price_drop_alert'
  | 'saved_search_match'
  | 'promotion_expired'
  | 'verification_complete'
  | 'system_announcement';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationType, NotificationChannel[]>;
}
