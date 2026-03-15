/**
 * Share functionality for listings.
 *
 * On native, uses the Capacitor Share plugin for native share sheet.
 * On web, uses the Web Share API if available, otherwise copies to clipboard.
 */

import { isCapacitorNative } from './capacitor';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Share a listing or page using native share sheet.
 * Returns true if shared successfully, false if cancelled or unavailable.
 */
export async function shareListing(data: ShareData): Promise<boolean> {
  if (isCapacitorNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: 'שתף מודעה',
      });
      return true;
    } catch {
      return false;
    }
  }

  // Web fallback: Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Final fallback: copy URL to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
