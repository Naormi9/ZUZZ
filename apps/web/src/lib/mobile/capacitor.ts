/**
 * Capacitor platform detection and utilities.
 *
 * This module detects whether the web app is running inside a Capacitor native shell
 * and provides helpers for platform-aware behavior.
 */

/** Check if running inside a Capacitor native app */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/** Get the current platform: 'ios' | 'android' | 'web' */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return 'web';
  return cap.getPlatform?.() ?? 'web';
}

/** Check if running on iOS (native) */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/** Check if running on Android (native) */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Safe area inset values.
 * On native, these come from CSS env() variables set by Capacitor.
 * Falls back to 0 on web.
 */
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
  };
}
