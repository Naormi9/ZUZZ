/**
 * Secure storage adapter for auth tokens.
 *
 * On native (Capacitor), uses @capacitor/preferences for persistent,
 * sandboxed key-value storage. On web, falls back to localStorage.
 *
 * Note: For truly sensitive data on production native apps, consider
 * upgrading to a Keychain/Keystore plugin. Capacitor Preferences is
 * sufficient for JWT tokens that expire in 7 days.
 */

import { isCapacitorNative } from './capacitor';

interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Capacitor Preferences-backed storage */
const nativeStorage: StorageAdapter = {
  async get(key: string): Promise<string | null> {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  },
  async set(key: string, value: string): Promise<void> {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
  },
  async remove(key: string): Promise<void> {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
  },
};

/** localStorage-backed storage (web fallback) */
const webStorage: StorageAdapter = {
  async get(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

/** Get the appropriate storage adapter for the current platform */
export function getStorage(): StorageAdapter {
  return isCapacitorNative() ? nativeStorage : webStorage;
}

// Auth-specific helpers
const AUTH_KEY = 'zuzz-auth';

export async function getStoredAuthState(): Promise<{
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
} | null> {
  const storage = getStorage();
  const raw = await storage.get(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

export async function setStoredAuthState(state: {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
}): Promise<void> {
  const storage = getStorage();
  await storage.set(AUTH_KEY, JSON.stringify({ state, version: 0 }));
}

export async function clearStoredAuthState(): Promise<void> {
  const storage = getStorage();
  await storage.remove(AUTH_KEY);
}
