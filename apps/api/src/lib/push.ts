/**
 * Push notification service.
 *
 * Provides a unified interface for sending push notifications via:
 * - FCM (Android)
 * - APNS (iOS)
 * - Web Push (browser)
 *
 * Uses a provider adapter pattern — defaults to a mock provider
 * when FCM_SERVER_KEY is not set (dev/test environments).
 */

import { prisma } from '@zuzz/database';
import { createLogger } from '@zuzz/logger';
import { getRedis } from '@zuzz/redis';

const logger = createLogger('api:push');

// ── Types ─────────────────────────────────────────────────────────

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export interface PushResult {
  success: boolean;
  token: string;
  error?: string;
}

export type NotificationType =
  | 'new_lead'
  | 'new_message'
  | 'saved_search_match'
  | 'listing_status'
  | 'price_alert'
  | 'dealer_response';

// ── Provider Interface ────────────────────────────────────────────

interface PushProvider {
  send(token: string, message: PushMessage): Promise<PushResult>;
  sendBatch(tokens: string[], message: PushMessage): Promise<PushResult[]>;
}

// ── Mock Provider (dev/test) ──────────────────────────────────────

class MockPushProvider implements PushProvider {
  async send(token: string, message: PushMessage): Promise<PushResult> {
    logger.info({ token: token.slice(0, 8) + '...', title: message.title }, 'Mock push sent');
    return { success: true, token };
  }

  async sendBatch(tokens: string[], message: PushMessage): Promise<PushResult[]> {
    logger.info({ count: tokens.length, title: message.title }, 'Mock batch push sent');
    return tokens.map((token) => ({ success: true, token }));
  }
}

// ── FCM Provider ──────────────────────────────────────────────────

class FcmPushProvider implements PushProvider {
  private serverKey: string;
  private fcmUrl = 'https://fcm.googleapis.com/fcm/send';

  constructor(serverKey: string) {
    this.serverKey = serverKey;
  }

  async send(token: string, message: PushMessage): Promise<PushResult> {
    try {
      const response = await fetch(this.fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.serverKey}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: message.title,
            body: message.body,
            sound: message.sound || 'default',
            badge: message.badge,
          },
          data: message.data || {},
          priority: 'high',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, token, error: `FCM error: ${response.status} ${text}` };
      }

      const result = (await response.json()) as { failure: number; results?: Array<{ error?: string }> };
      if (result.failure > 0) {
        return { success: false, token, error: result.results?.[0]?.error || 'Unknown FCM error' };
      }

      return { success: true, token };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, token, error: errorMsg };
    }
  }

  async sendBatch(tokens: string[], message: PushMessage): Promise<PushResult[]> {
    // FCM supports up to 1000 tokens per batch
    const results: PushResult[] = [];
    const batchSize = 500;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      try {
        const response = await fetch(this.fcmUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${this.serverKey}`,
          },
          body: JSON.stringify({
            registration_ids: batch,
            notification: {
              title: message.title,
              body: message.body,
              sound: message.sound || 'default',
              badge: message.badge,
            },
            data: message.data || {},
            priority: 'high',
          }),
        });

        if (!response.ok) {
          batch.forEach((token) =>
            results.push({ success: false, token, error: `FCM batch error: ${response.status}` }),
          );
          continue;
        }

        const result = (await response.json()) as { results?: Array<{ error?: string }> };
        batch.forEach((token: string, idx: number) => {
          const r = result.results?.[idx];
          results.push({
            success: !r?.error,
            token,
            error: r?.error,
          });
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batch.forEach((token) => results.push({ success: false, token, error: errorMsg }));
      }
    }

    return results;
  }
}

// ── Singleton ─────────────────────────────────────────────────────

let _provider: PushProvider | null = null;

function getProvider(): PushProvider {
  if (_provider) return _provider;

  const serverKey = process.env.FCM_SERVER_KEY;
  if (serverKey) {
    logger.info('Initializing FCM push provider');
    _provider = new FcmPushProvider(serverKey);
  } else {
    logger.info('Initializing mock push provider (no FCM_SERVER_KEY)');
    _provider = new MockPushProvider();
  }

  return _provider;
}

// ── Rate Limiting ─────────────────────────────────────────────────

const PUSH_RATE_LIMIT_WINDOW = 60; // seconds
const PUSH_RATE_LIMIT_MAX = 30; // max notifications per user per minute

async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `push:rate:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, PUSH_RATE_LIMIT_WINDOW);
    }
    return count <= PUSH_RATE_LIMIT_MAX;
  } catch {
    // If Redis is down, allow the notification
    return true;
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Send a push notification to a specific user on all their registered devices.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage,
): Promise<PushResult[]> {
  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    logger.warn({ userId }, 'Push rate limit exceeded');
    return [];
  }

  const tokens = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
  });

  if (tokens.length === 0) return [];

  const provider = getProvider();
  const results = await provider.sendBatch(
    tokens.map((t: { token: string }) => t.token),
    message,
  );

  // Deactivate tokens that failed with invalid token errors
  const invalidTokenErrors = ['InvalidRegistration', 'NotRegistered', 'InvalidToken'];
  for (const result of results) {
    if (!result.success && result.error && invalidTokenErrors.some((e) => result.error!.includes(e))) {
      await prisma.deviceToken.updateMany({
        where: { token: result.token },
        data: { isActive: false },
      });
      logger.info({ token: result.token.slice(0, 8) }, 'Deactivated invalid push token');
    }
  }

  return results;
}

/**
 * Send a push notification and also create an in-app notification.
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  data?: Record<string, string>,
): Promise<void> {
  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
      channels: ['in_app', 'push'],
      metadata: data || {},
    },
  });

  // Send push notification
  await sendPushToUser(userId, {
    title,
    body,
    data: {
      type,
      ...(link ? { url: link } : {}),
      ...(data || {}),
    },
  });
}

/**
 * Notify all watchers of a listing about an event.
 */
export async function notifyListingWatchers(
  listingId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  body: string,
): Promise<void> {
  // Find users who favorited this listing
  const favorites = await prisma.favorite.findMany({
    where: { listingId },
    select: { userId: true },
  });

  const userIds = favorites
    .map((f: { userId: string }) => f.userId)
    .filter((id: string) => id !== excludeUserId);

  for (const userId of userIds) {
    await notifyUser(userId, type, title, body, `/listings/${listingId}`, { listingId });
  }
}

// For testing
export function _setProvider(provider: PushProvider | null): void {
  _provider = provider;
}
