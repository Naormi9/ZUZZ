/**
 * Push notification foundation.
 *
 * Handles registration, token management, and notification event listeners
 * for the Capacitor native app.
 *
 * Token registration flow:
 * 1. App calls requestPermission() on first launch or user action
 * 2. If granted, registers with APNS (iOS) / FCM (Android)
 * 3. Receives a device token
 * 4. Sends the token to backend: POST /api/push/register
 * 5. Backend stores token associated with userId for future push delivery
 *
 * Notification categories (for future backend implementation):
 * - new_lead: New lead received on a listing
 * - new_message: New chat message
 * - saved_search_match: A new listing matches a saved search
 * - listing_status: Listing status change (approved, expired, etc.)
 */

import { isCapacitorNative } from './capacitor';

export interface PushToken {
  value: string;
  platform: 'ios' | 'android';
}

export type NotificationCategory =
  | 'new_lead'
  | 'new_message'
  | 'saved_search_match'
  | 'listing_status';

export interface PushNotificationData {
  category?: NotificationCategory;
  listingId?: string;
  conversationId?: string;
  url?: string;
  [key: string]: any;
}

let pushListenersRegistered = false;

/**
 * Request push notification permission and register for remote notifications.
 * Returns the device token if successful, null otherwise.
 */
export async function requestPushPermission(): Promise<PushToken | null> {
  if (!isCapacitorNative()) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    return null;
  }

  // Register with APNS/FCM
  await PushNotifications.register();

  // Wait for the registration event
  return new Promise<PushToken | null>((resolve) => {
    const timeout = setTimeout(() => resolve(null), 10000);

    PushNotifications.addListener('registration', (token) => {
      clearTimeout(timeout);
      const { Capacitor } = (window as any);
      resolve({
        value: token.value,
        platform: Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android',
      });
    });

    PushNotifications.addListener('registrationError', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Check current push notification permission status.
 */
export async function checkPushPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isCapacitorNative()) return 'denied';

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const result = await PushNotifications.checkPermissions();

  if (result.receive === 'granted') return 'granted';
  if (result.receive === 'denied') return 'denied';
  return 'prompt';
}

/**
 * Register push notification listeners for foreground/background handling.
 * Should be called once during app initialization.
 *
 * @param onNotificationTap - Called when user taps a notification (app opens to specific screen)
 * @param onForegroundNotification - Called when notification arrives while app is in foreground
 */
export async function registerPushListeners(
  onNotificationTap: (data: PushNotificationData) => void,
  onForegroundNotification?: (title: string, body: string, data: PushNotificationData) => void,
): Promise<void> {
  if (!isCapacitorNative() || pushListenersRegistered) return;
  pushListenersRegistered = true;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onForegroundNotification?.(
      notification.title ?? '',
      notification.body ?? '',
      notification.data as PushNotificationData,
    );
  });

  // User tapped on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onNotificationTap(action.notification.data as PushNotificationData);
  });
}

/**
 * Send push token to backend for storage.
 * Backend endpoint: POST /api/push/register
 *
 * This is a stub — the backend endpoint needs to be implemented to:
 * 1. Accept { token, platform, userId }
 * 2. Store in a push_tokens table
 * 3. Use for sending notifications via APNS/FCM
 */
export async function registerTokenWithBackend(
  token: PushToken,
  apiBase: string,
  authToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${apiBase}/api/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: token.value,
        platform: token.platform,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
