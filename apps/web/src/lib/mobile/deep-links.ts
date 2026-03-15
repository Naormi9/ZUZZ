/**
 * Deep linking handler for the ZUZZ mobile app.
 *
 * URL Scheme: zuzz://
 * Universal Links (iOS): https://zuzz.co.il/...
 * App Links (Android): https://zuzz.co.il/...
 *
 * Supported deep link paths:
 * - /cars/:id — Car listing detail
 * - /cars/search?... — Cars search with filters
 * - /homes/:id — Home listing detail
 * - /market/:id — Market listing detail
 * - /dashboard/messages — Messages inbox
 * - /dashboard/messages/:conversationId — Specific conversation
 * - /auth/login — Login flow
 * - /dealers/:id — Dealer profile
 */

import { isCapacitorNative } from './capacitor';

export type DeepLinkRoute =
  | { type: 'car_detail'; id: string }
  | { type: 'car_search'; params: Record<string, string> }
  | { type: 'home_detail'; id: string }
  | { type: 'market_detail'; id: string }
  | { type: 'messages'; conversationId?: string }
  | { type: 'dealer'; id: string }
  | { type: 'auth_login' }
  | { type: 'generic'; path: string };

/**
 * Parse a deep link URL into a structured route.
 */
export function parseDeepLink(url: string): DeepLinkRoute {
  let path: string;

  try {
    // Handle both zuzz:// and https:// URLs
    const parsed = new URL(url.replace('zuzz://', 'https://zuzz.co.il/'));
    path = parsed.pathname;
  } catch {
    path = url;
  }

  // Remove trailing slash
  path = path.replace(/\/$/, '') || '/';

  // Cars detail: /cars/:id
  const carMatch = path.match(/^\/cars\/([a-zA-Z0-9-]+)$/);
  if (carMatch?.[1] && carMatch[1] !== 'search' && carMatch[1] !== 'create') {
    return { type: 'car_detail', id: carMatch[1] };
  }

  // Cars search: /cars/search
  if (path === '/cars/search') {
    try {
      const parsed = new URL(url.replace('zuzz://', 'https://zuzz.co.il/'));
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return { type: 'car_search', params };
    } catch {
      return { type: 'car_search', params: {} };
    }
  }

  // Homes detail: /homes/:id
  const homeMatch = path.match(/^\/homes\/([a-zA-Z0-9-]+)$/);
  if (homeMatch?.[1]) {
    return { type: 'home_detail', id: homeMatch[1] };
  }

  // Market detail: /market/:id
  const marketMatch = path.match(/^\/market\/([a-zA-Z0-9-]+)$/);
  if (marketMatch?.[1]) {
    return { type: 'market_detail', id: marketMatch[1] };
  }

  // Messages
  const msgMatch = path.match(/^\/dashboard\/messages(?:\/([a-zA-Z0-9-]+))?$/);
  if (msgMatch) {
    return { type: 'messages', conversationId: msgMatch[1] as string | undefined };
  }

  // Dealer profile
  const dealerMatch = path.match(/^\/dealers\/([a-zA-Z0-9-]+)$/);
  if (dealerMatch?.[1]) {
    return { type: 'dealer', id: dealerMatch[1] };
  }

  // Auth
  if (path === '/auth/login') {
    return { type: 'auth_login' };
  }

  return { type: 'generic', path };
}

/**
 * Convert a DeepLinkRoute to a Next.js-compatible path.
 */
export function deepLinkToPath(route: DeepLinkRoute): string {
  switch (route.type) {
    case 'car_detail':
      return `/cars/${route.id}`;
    case 'car_search': {
      const params = new URLSearchParams(route.params).toString();
      return `/cars/search${params ? `?${params}` : ''}`;
    }
    case 'home_detail':
      return `/homes/${route.id}`;
    case 'market_detail':
      return `/market/${route.id}`;
    case 'messages':
      return route.conversationId
        ? `/dashboard/messages/${route.conversationId}`
        : '/dashboard/messages';
    case 'dealer':
      return `/dealers/${route.id}`;
    case 'auth_login':
      return '/auth/login';
    case 'generic':
      return route.path;
  }
}

/**
 * Register deep link listener for the Capacitor app.
 * Should be called once during app initialization.
 *
 * @param navigate - Function to navigate to a path (e.g., router.push)
 */
export async function registerDeepLinkListener(
  navigate: (path: string) => void,
): Promise<void> {
  if (!isCapacitorNative()) return;

  const { App } = await import('@capacitor/app');

  // Handle app opened via deep link
  App.addListener('appUrlOpen', (event) => {
    const route = parseDeepLink(event.url);
    const path = deepLinkToPath(route);
    navigate(path);
  });
}
