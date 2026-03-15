/**
 * Payment provider adapter.
 *
 * Supports:
 * - sandbox: Mock provider for development/testing
 * - stripe: Stripe integration for production
 *
 * Controlled by PAYMENT_PROVIDER and STRIPE_SECRET_KEY env vars.
 */

import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:payment');

// ── Types ─────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  userId: string;
  email: string;
  items: Array<{
    name: string;
    description: string;
    amount: number; // in agorot/cents
    currency: string;
    quantity: number;
  }>;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

export interface CreateSubscriptionParams {
  userId: string;
  email: string;
  plan: string;
  priceId: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionResult {
  sessionId: string;
  url: string;
}

export interface WebhookEvent {
  type: string;
  data: Record<string, any>;
}

// ── Provider Interface ────────────────────────────────────────────

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  createSubscriptionCheckout(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  parseWebhookEvent(body: string, signature: string): WebhookEvent;
  getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string>;
}

// ── Sandbox Provider ──────────────────────────────────────────────

class SandboxPaymentProvider implements PaymentProvider {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const sessionId = `sandbox_sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    logger.info({ sessionId, userId: params.userId, items: params.items.length }, 'Sandbox checkout created');
    return {
      sessionId,
      url: `${params.successUrl}?session_id=${sessionId}`,
    };
  }

  async createSubscriptionCheckout(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const sessionId = `sandbox_sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    logger.info({ sessionId, userId: params.userId, plan: params.plan }, 'Sandbox subscription checkout created');
    return {
      sessionId,
      url: `${params.successUrl}?session_id=${sessionId}`,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    logger.info({ subscriptionId }, 'Sandbox subscription cancelled');
  }

  parseWebhookEvent(body: string, _signature: string): WebhookEvent {
    const parsed = JSON.parse(body);
    return { type: parsed.type || 'sandbox.event', data: parsed.data || {} };
  }

  async getCustomerPortalUrl(_customerId: string, returnUrl: string): Promise<string> {
    return returnUrl;
  }
}

// ── Stripe Provider ───────────────────────────────────────────────

class StripePaymentProvider implements PaymentProvider {
  private stripe: any;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    // Dynamic import to avoid requiring stripe in dev
    const Stripe = require('stripe');
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' });
    this.webhookSecret = webhookSecret;
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: params.items.map((item) => ({
        price_data: {
          currency: item.currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.email,
      metadata: { userId: params.userId, ...params.metadata },
    });

    return { sessionId: session.id, url: session.url! };
  }

  async createSubscriptionCheckout(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.email,
      metadata: { userId: params.userId, plan: params.plan, ...params.metadata },
    });

    return { sessionId: session.id, url: session.url! };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  parseWebhookEvent(body: string, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    return { type: event.type, data: event.data.object };
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }
}

// ── Factory ───────────────────────────────────────────────────────

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const providerType = process.env.PAYMENT_PROVIDER || 'sandbox';

  if (providerType === 'stripe') {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!secretKey) {
      logger.warn('STRIPE_SECRET_KEY not set, falling back to sandbox');
      _provider = new SandboxPaymentProvider();
    } else {
      logger.info('Initializing Stripe payment provider');
      _provider = new StripePaymentProvider(secretKey, webhookSecret);
    }
  } else {
    logger.info('Initializing sandbox payment provider');
    _provider = new SandboxPaymentProvider();
  }

  return _provider;
}

// ── Plan Definitions ──────────────────────────────────────────────

export interface PlanDefinition {
  id: string;
  name: string;
  nameHe: string;
  priceMonthly: number; // agorot
  currency: string;
  features: string[];
  featuresHe: string[];
  maxListings: number;
  maxPromotions: number;
  stripePriceId?: string;
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    nameHe: 'חינם',
    priceMonthly: 0,
    currency: 'ILS',
    features: ['Up to 3 listings', 'Basic trust score', 'Standard support'],
    featuresHe: ['עד 3 מודעות', 'ציון אמון בסיסי', 'תמיכה סטנדרטית'],
    maxListings: 3,
    maxPromotions: 0,
  },
  basic: {
    id: 'basic',
    name: 'Dealer Basic',
    nameHe: 'סוחר בסיסי',
    priceMonthly: 9900, // ₪99
    currency: 'ILS',
    features: ['Up to 20 listings', 'Enhanced trust score', 'Lead management', '2 promotions/month'],
    featuresHe: ['עד 20 מודעות', 'ציון אמון מורחב', 'ניהול לידים', '2 קידומים בחודש'],
    maxListings: 20,
    maxPromotions: 2,
    stripePriceId: process.env.STRIPE_PRICE_BASIC,
  },
  pro: {
    id: 'pro',
    name: 'Dealer Pro',
    nameHe: 'סוחר מקצועי',
    priceMonthly: 29900, // ₪299
    currency: 'ILS',
    features: [
      'Unlimited listings',
      'Premium trust score',
      'Priority lead management',
      'Unlimited promotions',
      'Analytics dashboard',
      'Priority support',
    ],
    featuresHe: [
      'מודעות ללא הגבלה',
      'ציון אמון פרימיום',
      'ניהול לידים בעדיפות',
      'קידומים ללא הגבלה',
      'לוח אנליטיקה',
      'תמיכה בעדיפות',
    ],
    maxListings: -1, // unlimited
    maxPromotions: -1,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
};

// ── Promotion Pricing ─────────────────────────────────────────────

export const PROMOTION_PRICES: Record<string, { name: string; nameHe: string; pricePerWeek: number }> = {
  boost: { name: 'Boost', nameHe: 'הגברה', pricePerWeek: 2900 },
  highlight: { name: 'Highlight', nameHe: 'הדגשה', pricePerWeek: 4900 },
  featured: { name: 'Featured', nameHe: 'מודעה מומלצת', pricePerWeek: 9900 },
  top_of_search: { name: 'Top of Search', nameHe: 'ראש תוצאות חיפוש', pricePerWeek: 14900 },
  gallery: { name: 'Gallery', nameHe: 'גלריה', pricePerWeek: 6900 },
};

// For testing
export function _setProvider(provider: PaymentProvider | null): void {
  _provider = provider;
}
