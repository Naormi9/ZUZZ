/**
 * ZUZZ Analytics Client
 * Tracks user events for activation, conversion, and retention measurement.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TrackOptions {
  properties?: Record<string, unknown>;
  source?: 'web' | 'mobile';
}

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === 'undefined') return 'server';
  sessionId = sessionStorage.getItem('zuzz_session_id');
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('zuzz_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track an analytics event.
 * Non-blocking — fires and forgets.
 */
export function track(type: string, options?: TrackOptions) {
  if (typeof window === 'undefined') return;

  const payload = {
    type,
    sessionId: getSessionId(),
    properties: options?.properties || {},
    source: options?.source || 'web',
  };

  // Use sendBeacon for better reliability on page transitions
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      `${API_URL}/api/analytics/event`,
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
  } else {
    fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silent failure — analytics should never block UX
    });
  }
}

// ── Typed event helpers ─────────────────────────────────────────────

export const analytics = {
  // Search & Discovery
  search(filters: Record<string, unknown>) {
    track('search', { properties: filters });
  },
  searchSave(searchId: string, filters: Record<string, unknown>) {
    track('search_save', { properties: { searchId, ...filters } });
  },
  alertEnable(searchId: string, frequency: string) {
    track('alert_enable', { properties: { searchId, frequency } });
  },

  // Listing interactions
  listingView(listingId: string, vertical: string) {
    track('listing_view', { properties: { listingId, vertical } });
  },
  listingFavorite(listingId: string) {
    track('listing_favorite', { properties: { listingId } });
  },
  listingShare(listingId: string, method: string) {
    track('listing_share', { properties: { listingId, method } });
  },
  listingWatch(listingId: string) {
    track('listing_watch', { properties: { listingId } });
  },
  listingCompare(listingIds: string[]) {
    track('listing_compare', { properties: { listingIds, count: listingIds.length } });
  },

  // Lead & conversion
  leadSubmit(listingId: string, leadType: string) {
    track('lead_submit', { properties: { listingId, leadType } });
  },
  messageSend(conversationId: string) {
    track('message_send', { properties: { conversationId } });
  },
  phoneReveal(listingId: string) {
    track('phone_reveal', { properties: { listingId } });
  },

  // Monetization
  planView() {
    track('plan_view');
  },
  planSelect(plan: string) {
    track('plan_select', { properties: { plan } });
  },
  checkoutStart(type: string, amount: number) {
    track('checkout_start', { properties: { type, amount } });
  },
  checkoutSuccess(paymentId: string, amount: number) {
    track('checkout_success', { properties: { paymentId, amount } });
  },
  checkoutFailure(reason: string) {
    track('checkout_failure', { properties: { reason } });
  },
  promotionActivate(listingId: string, promotionType: string) {
    track('promotion_activate', { properties: { listingId, promotionType } });
  },

  // Push & notifications
  pushPermissionAccepted() {
    track('push_permission_accepted');
  },
  pushPermissionDenied() {
    track('push_permission_denied');
  },
  notificationOpened(notificationId: string, type: string) {
    track('notification_opened', { properties: { notificationId, type } });
  },

  // Auth & onboarding
  signUp() {
    track('sign_up');
  },
  login() {
    track('login');
  },
  dealerOnboardingStart() {
    track('dealer_onboarding_start');
  },
  dealerOnboardingComplete() {
    track('dealer_onboarding_complete');
  },

  // Listing creation
  listingCreateStart(vertical: string) {
    track('listing_create_start', { properties: { vertical } });
  },
  listingCreateComplete(listingId: string, vertical: string) {
    track('listing_create_complete', { properties: { listingId, vertical } });
  },
};
