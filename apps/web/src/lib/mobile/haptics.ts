/**
 * Haptic feedback utilities for the mobile app.
 *
 * Provides light tactile feedback for interactions like
 * favoriting, pull-to-refresh, successful actions, etc.
 * No-op on web.
 */

import { isCapacitorNative } from './capacitor';

export async function hapticLight(): Promise<void> {
  if (!isCapacitorNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium(): Promise<void> {
  if (!isCapacitorNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticSuccess(): Promise<void> {
  if (!isCapacitorNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Success });
}

export async function hapticError(): Promise<void> {
  if (!isCapacitorNative()) return;
  const { Haptics, NotificationType } = await import('@capacitor/haptics');
  await Haptics.notification({ type: NotificationType.Error });
}
