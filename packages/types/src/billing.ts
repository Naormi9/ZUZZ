import type { Money } from './common';

export type PromotionType = 'boost' | 'highlight' | 'featured' | 'top_of_search' | 'gallery';

export interface Promotion {
  id: string;
  listingId: string;
  userId: string;
  type: PromotionType;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  price: Money;
  createdAt: Date;
}

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  createdAt: Date;
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  nameHe: string;
  price: Money;
  interval: 'month' | 'year';
  features: PlanFeature[];
}

export interface PlanFeature {
  key: string;
  label: string;
  labelHe: string;
  limit?: number; // undefined = unlimited
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  userId: string;
  amount: Money;
  status: PaymentStatus;
  provider: string;
  providerPaymentId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  paymentId: string;
  invoiceNumber: string;
  amount: Money;
  tax: Money;
  total: Money;
  items: InvoiceItem[];
  issuedAt: Date;
  pdfUrl?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}
