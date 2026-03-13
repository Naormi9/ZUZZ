import type { Money } from '@zuzz/types';

export interface PaymentIntent {
  id: string;
  amount: Money;
  status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed' | 'cancelled';
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  amount: Money;
  description?: string;
  metadata?: Record<string, string>;
  /** URL to redirect after payment */
  returnUrl?: string;
  /** URL for webhook notifications */
  webhookUrl?: string;
}

export interface PaymentResult {
  intent: PaymentIntent;
  /** URL to redirect the user for payment (if applicable) */
  redirectUrl?: string;
}

export interface RefundInput {
  paymentId: string;
  amount?: Money;
  reason?: string;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: Money;
  status: 'pending' | 'completed' | 'failed';
}

export interface PaymentProvider {
  /** Create a new payment intent */
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  /** Get a payment by ID */
  getPayment(paymentId: string): Promise<PaymentIntent | null>;
  /** Capture an authorized payment */
  capturePayment(paymentId: string): Promise<PaymentIntent>;
  /** Cancel a payment */
  cancelPayment(paymentId: string): Promise<PaymentIntent>;
  /** Refund a payment (full or partial) */
  refund(input: RefundInput): Promise<RefundResult>;
}
