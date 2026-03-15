import { prisma } from '@zuzz/database';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('notification-service');

// ── Notification Types ──────────────────────────────────────────────

export type NotificationType =
  | 'new_message'
  | 'new_lead'
  | 'saved_search_match'
  | 'price_drop'
  | 'listing_status_change'
  | 'promotion_activated'
  | 'promotion_expiring'
  | 'subscription_change'
  | 'system';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

// ── Push Provider Abstraction ───────────────────────────────────────

interface PushProvider {
  send(token: string, payload: PushPayload): Promise<{ success: boolean; error?: string }>;
}

/**
 * Sandbox push provider for development/test mode.
 * Logs push notifications instead of sending them.
 */
class SandboxPushProvider implements PushProvider {
  async send(token: string, payload: PushPayload) {
    logger.info({ token: token.slice(0, 12) + '...', title: payload.title }, 'sandbox_push_sent');
    return { success: true };
  }
}

/**
 * FCM push provider for production iOS + Android.
 * Requires FCM_SERVER_KEY or FCM_SERVICE_ACCOUNT_JSON env var.
 */
class FcmPushProvider implements PushProvider {
  private serverKey: string;

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
  }

  async send(token: string, payload: PushPayload) {
    if (!this.serverKey) {
      logger.warn('FCM_SERVER_KEY not set, skipping push');
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.serverKey}`,
        },
        body: JSON.stringify({
          to: token,
          notification: { title: payload.title, body: payload.body, badge: payload.badge },
          data: payload.data || {},
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error({ status: response.status, body: text }, 'fcm_send_failed');
        return { success: false, error: `FCM error: ${response.status}` };
      }

      const result = (await response.json()) as { failure?: number };
      if (result.failure && result.failure > 0) {
        return { success: false, error: 'FCM delivery failure' };
      }

      return { success: true };
    } catch (err) {
      logger.error({ err }, 'fcm_send_error');
      return { success: false, error: 'FCM request failed' };
    }
  }
}

// ── Notification Service ────────────────────────────────────────────

function getPushProvider(): PushProvider {
  if (process.env.FCM_SERVER_KEY) {
    return new FcmPushProvider();
  }
  return new SandboxPushProvider();
}

const pushProvider = getPushProvider();

/**
 * Create an in-app notification and optionally send push.
 */
export async function createNotification(params: CreateNotificationParams) {
  const channels = params.channels || ['in_app', 'push'];

  // 1. Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      channels,
      metadata: (params.metadata || {}) as any,
    },
  });

  // 2. Send push if requested
  if (channels.includes('push')) {
    await sendPushToUser(params.userId, {
      title: params.title,
      body: params.body,
      data: {
        type: params.type,
        notificationId: notification.id,
        link: params.link || '',
      },
    });
  }

  return notification;
}

/**
 * Send push notification to all active devices of a user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
  });

  if (tokens.length === 0) {
    logger.debug({ userId }, 'no_active_device_tokens');
    return { sent: 0, failed: 0 };
  }

  // Get unread count for badge
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  payload.badge = unreadCount;

  let sent = 0;
  let failed = 0;

  for (const device of tokens) {
    const result = await pushProvider.send(device.token, payload);
    if (result.success) {
      sent++;
    } else {
      failed++;
      // Deactivate invalid tokens
      if (result.error?.includes('not registered') || result.error?.includes('invalid')) {
        await prisma.deviceToken.update({
          where: { id: device.id },
          data: { isActive: false },
        });
        logger.info({ deviceId: device.id }, 'deactivated_invalid_token');
      }
    }
  }

  logger.info({ userId, sent, failed, total: tokens.length }, 'push_batch_result');
  return { sent, failed };
}

/**
 * Send notification for new message.
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  senderName: string;
  conversationId: string;
  preview: string;
}) {
  return createNotification({
    userId: params.recipientId,
    type: 'new_message',
    title: `הודעה חדשה מ${params.senderName}`,
    body: params.preview.slice(0, 120),
    link: `/dashboard/messages?conversation=${params.conversationId}`,
    metadata: { conversationId: params.conversationId },
  });
}

/**
 * Send notification for new lead.
 */
export async function notifyNewLead(params: {
  sellerId: string;
  buyerName: string;
  listingTitle: string;
  leadId: string;
}) {
  return createNotification({
    userId: params.sellerId,
    type: 'new_lead',
    title: 'ליד חדש!',
    body: `${params.buyerName} מעוניין ב: ${params.listingTitle}`,
    link: `/dashboard/leads`,
    metadata: { leadId: params.leadId },
  });
}

/**
 * Send notification for price drop.
 */
export async function notifyPriceDrop(params: {
  userId: string;
  listingId: string;
  listingTitle: string;
  oldPrice: number;
  newPrice: number;
}) {
  const dropPercent = Math.round(((params.oldPrice - params.newPrice) / params.oldPrice) * 100);
  return createNotification({
    userId: params.userId,
    type: 'price_drop',
    title: 'ירידת מחיר!',
    body: `${params.listingTitle} — ירד ב-${dropPercent}% ל-₪${params.newPrice.toLocaleString()}`,
    link: `/cars/${params.listingId}`,
    metadata: { listingId: params.listingId, oldPrice: params.oldPrice, newPrice: params.newPrice },
  });
}

/**
 * Send notification for saved search match.
 */
export async function notifySavedSearchMatch(params: {
  userId: string;
  savedSearchId: string;
  savedSearchName: string;
  matchCount: number;
  vertical: string;
}) {
  return createNotification({
    userId: params.userId,
    type: 'saved_search_match',
    title: `${params.matchCount} תוצאות חדשות`,
    body: `נמצאו ${params.matchCount} רכבים חדשים שמתאימים לחיפוש: ${params.savedSearchName || 'חיפוש שמור'}`,
    link: `/cars/search?savedSearchId=${params.savedSearchId}`,
    metadata: { savedSearchId: params.savedSearchId, matchCount: params.matchCount },
  });
}

/**
 * Send notification for listing status change.
 */
export async function notifyListingStatusChange(params: {
  userId: string;
  listingId: string;
  listingTitle: string;
  newStatus: string;
}) {
  const statusLabels: Record<string, string> = {
    active: 'מודעתך פורסמה',
    rejected: 'מודעתך נדחתה',
    expired: 'מודעתך פגה תוקף',
    sold: 'מודעתך סומנה כנמכרה',
  };

  return createNotification({
    userId: params.userId,
    type: 'listing_status_change',
    title: statusLabels[params.newStatus] || 'עדכון סטטוס מודעה',
    body: params.listingTitle,
    link: `/cars/${params.listingId}`,
    metadata: { listingId: params.listingId, status: params.newStatus },
  });
}
