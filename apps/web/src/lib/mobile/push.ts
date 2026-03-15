/**
 * Push notification registration for Capacitor mobile app.
 * Handles device token registration with the backend.
 */

import { isCapacitorNative, getPlatform } from './capacitor';
import { analytics } from '../analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PushToken {
  value: string;
}

/**
 * Initialize push notifications.
 * Only works inside Capacitor native app.
 */
export async function initPushNotifications(): Promise<boolean> {
  if (!isCapacitorNative()) {
    return false;
  }

  try {
    // Dynamic import — only available in Capacitor context
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Check / request permission
    let permResult = await PushNotifications.checkPermissions();

    if (permResult.receive === 'prompt') {
      permResult = await PushNotifications.requestPermissions();
    }

    if (permResult.receive !== 'granted') {
      analytics.pushPermissionDenied();
      return false;
    }

    analytics.pushPermissionAccepted();

    // Register with the OS
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', async (token: PushToken) => {
      await registerDeviceToken(token.value);
    });

    // Listen for registration error
    PushNotifications.addListener('registrationError', (error: unknown) => {
      console.error('Push registration error:', error);
    });

    // Listen for notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      // Could show an in-app toast/banner
      console.log('Push notification received:', notification);
    });

    // Listen for notification action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      const data = action.notification?.data;
      if (data?.link) {
        window.location.href = data.link;
      }
      if (data?.notificationId) {
        analytics.notificationOpened(data.notificationId, data.type || 'unknown');
      }
    });

    return true;
  } catch (err) {
    console.error('Push notification init failed:', err);
    return false;
  }
}

/**
 * Register device token with the backend.
 */
async function registerDeviceToken(token: string) {
  try {
    const platform = getPlatform();

    const response = await fetch(`${API_URL}/api/device-tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        token,
        platform: platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
        provider: 'fcm',
        appVersion: '1.0.0',
      }),
    });

    if (!response.ok) {
      console.error('Device token registration failed:', response.status);
    }
  } catch (err) {
    console.error('Device token registration error:', err);
  }
}

/**
 * Unregister push notifications (e.g., on logout).
 */
export async function unregisterPush() {
  if (!isCapacitorNative()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    PushNotifications.removeAllListeners();
  } catch {
    // Silent failure
  }
}
