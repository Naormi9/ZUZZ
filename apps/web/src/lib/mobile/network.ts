/**
 * Network status awareness for the mobile app.
 *
 * Provides hooks and utilities for detecting network connectivity changes,
 * which is important for mobile apps that may go offline.
 */

import { isCapacitorNative } from './capacitor';

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

type NetworkListener = (status: NetworkStatus) => void;

const listeners: Set<NetworkListener> = new Set();
let currentStatus: NetworkStatus = { connected: true, connectionType: 'unknown' };
let initialized = false;

/**
 * Initialize network monitoring.
 * Call once during app startup.
 */
export async function initNetworkMonitoring(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (isCapacitorNative()) {
    const { Network } = await import('@capacitor/network');

    const status = await Network.getStatus();
    currentStatus = {
      connected: status.connected,
      connectionType: status.connectionType,
    };

    Network.addListener('networkStatusChange', (status) => {
      currentStatus = {
        connected: status.connected,
        connectionType: status.connectionType,
      };
      listeners.forEach((listener) => listener(currentStatus));
    });
  } else {
    // Web fallback
    currentStatus = {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'unknown',
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        currentStatus = { connected: true, connectionType: 'unknown' };
        listeners.forEach((listener) => listener(currentStatus));
      });

      window.addEventListener('offline', () => {
        currentStatus = { connected: false, connectionType: 'none' };
        listeners.forEach((listener) => listener(currentStatus));
      });
    }
  }
}

/** Get current network status */
export function getNetworkStatus(): NetworkStatus {
  return currentStatus;
}

/** Subscribe to network status changes */
export function onNetworkChange(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
