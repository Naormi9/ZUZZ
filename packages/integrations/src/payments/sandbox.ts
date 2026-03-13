import type {
  PaymentProvider,
  CreatePaymentInput,
  PaymentResult,
  PaymentIntent,
  RefundInput,
  RefundResult,
} from './types';

/**
 * Sandbox payment provider for development and testing.
 * Simulates payment flows without real transactions.
 */
export class SandboxPaymentProvider implements PaymentProvider {
  private payments: Map<string, PaymentIntent> = new Map();

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const id = `pay_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();

    const intent: PaymentIntent = {
      id,
      amount: input.amount,
      status: 'authorized',
      description: input.description,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.payments.set(id, intent);

    console.log(`[SandboxPayment] Created payment ${id}: ${input.amount.amount} ${input.amount.currency}`);

    return {
      intent,
      redirectUrl: input.returnUrl
        ? `${input.returnUrl}?payment_id=${id}&status=authorized`
        : undefined,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentIntent | null> {
    return this.payments.get(paymentId) ?? null;
  }

  async capturePayment(paymentId: string): Promise<PaymentIntent> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    if (payment.status !== 'authorized') {
      throw new Error(`Cannot capture payment in status: ${payment.status}`);
    }

    payment.status = 'captured';
    payment.updatedAt = new Date();
    console.log(`[SandboxPayment] Captured payment ${paymentId}`);
    return payment;
  }

  async cancelPayment(paymentId: string): Promise<PaymentIntent> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    if (payment.status === 'captured' || payment.status === 'refunded') {
      throw new Error(`Cannot cancel payment in status: ${payment.status}`);
    }

    payment.status = 'cancelled';
    payment.updatedAt = new Date();
    console.log(`[SandboxPayment] Cancelled payment ${paymentId}`);
    return payment;
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const payment = this.payments.get(input.paymentId);
    if (!payment) throw new Error(`Payment not found: ${input.paymentId}`);
    if (payment.status !== 'captured') {
      throw new Error(`Cannot refund payment in status: ${payment.status}`);
    }

    const refundAmount = input.amount ?? payment.amount;
    payment.status = 'refunded';
    payment.updatedAt = new Date();

    const refundId = `ref_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    console.log(`[SandboxPayment] Refunded payment ${input.paymentId}: ${refundAmount.amount} ${refundAmount.currency}`);

    return {
      id: refundId,
      paymentId: input.paymentId,
      amount: refundAmount,
      status: 'completed',
    };
  }

  /** Clear all stored payments (useful in tests) */
  clear(): void {
    this.payments.clear();
  }
}
