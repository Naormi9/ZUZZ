import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { getPaymentProvider, PLANS, PROMOTION_PRICES } from '../lib/payment';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:payments');

export const paymentsRouter = Router();

// ── Get available plans ───────────────────────────────────────────

paymentsRouter.get('/plans', async (_req, res) => {
  res.json({ success: true, data: Object.values(PLANS) });
});

// ── Get promotion prices ──────────────────────────────────────────

paymentsRouter.get('/promotion-prices', async (_req, res) => {
  res.json({ success: true, data: PROMOTION_PRICES });
});

// ── Create subscription checkout ──────────────────────────────────

const subscriptionCheckoutSchema = z.object({
  plan: z.enum(['basic', 'pro']),
  organizationId: z.string().optional(),
});

paymentsRouter.post('/checkout/subscription', authenticate, async (req, res, next) => {
  try {
    const { plan, organizationId } = subscriptionCheckoutSchema.parse(req.body);
    const planDef = PLANS[plan];

    if (!planDef) throw new AppError(400, 'INVALID', 'תוכנית לא תקינה');

    if (organizationId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: req.user!.id },
        },
      });
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new AppError(403, 'FORBIDDEN', 'אין הרשאה לרכוש מנוי עבור ארגון זה');
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const provider = getPaymentProvider();

    const result = await provider.createSubscriptionCheckout({
      userId: req.user!.id,
      email: req.user!.email,
      plan,
      priceId: planDef.stripePriceId || plan,
      metadata: {
        ...(organizationId ? { organizationId } : {}),
      },
      successUrl: `${appUrl}/dashboard/dealer/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/dashboard/dealer/billing?cancelled=true`,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount: planDef.priceMonthly,
        currency: planDef.currency,
        status: 'pending',
        provider: process.env.PAYMENT_PROVIDER || 'sandbox',
        providerPaymentId: result.sessionId,
        description: `מנוי ${planDef.nameHe}`,
        metadata: { plan, organizationId: organizationId || null },
      },
    });

    // For sandbox provider, auto-activate the subscription
    if (process.env.PAYMENT_PROVIDER !== 'stripe') {
      await activateSubscription(req.user!.id, plan, organizationId || null, result.sessionId);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Create promotion checkout ─────────────────────────────────────

const promotionCheckoutSchema = z.object({
  listingId: z.string(),
  type: z.enum(['boost', 'highlight', 'featured', 'top_of_search', 'gallery']),
  durationWeeks: z.number().min(1).max(12).default(1),
});

paymentsRouter.post('/checkout/promotion', authenticate, async (req, res, next) => {
  try {
    const { listingId, type, durationWeeks } = promotionCheckoutSchema.parse(req.body);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    // Verify ownership
    const isOwner = listing.userId === req.user!.id;
    let isOrgMember = false;
    if (listing.organizationId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId: listing.organizationId, userId: req.user!.id },
        },
      });
      isOrgMember = !!member;
    }
    if (!isOwner && !isOrgMember) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה לקדם מודעה זו');
    }

    const promo = PROMOTION_PRICES[type];
    if (!promo) throw new AppError(400, 'INVALID', 'סוג קידום לא תקין');

    const amount = promo.pricePerWeek * durationWeeks;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const provider = getPaymentProvider();

    const result = await provider.createCheckout({
      userId: req.user!.id,
      email: req.user!.email,
      items: [
        {
          name: promo.name,
          description: `${promo.nameHe} - ${durationWeeks} שבועות`,
          amount,
          currency: 'ILS',
          quantity: 1,
        },
      ],
      metadata: { listingId, type, durationWeeks: String(durationWeeks) },
      successUrl: `${appUrl}/dashboard/listings/${listingId}?promotion=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/dashboard/listings/${listingId}?promotion=cancelled`,
    });

    // Create pending payment
    await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount,
        currency: 'ILS',
        status: 'pending',
        provider: process.env.PAYMENT_PROVIDER || 'sandbox',
        providerPaymentId: result.sessionId,
        description: `קידום ${promo.nameHe} - ${listing.title}`,
        metadata: { listingId, type, durationWeeks },
      },
    });

    // For sandbox: auto-activate promotion
    if (process.env.PAYMENT_PROVIDER !== 'stripe') {
      await activatePromotion(req.user!.id, listingId, type, durationWeeks, amount, result.sessionId);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Stripe Webhook ────────────────────────────────────────────────

paymentsRouter.post('/webhook', async (req, res, next) => {
  try {
    const provider = getPaymentProvider();
    const signature = req.headers['stripe-signature'] as string || '';
    const event = provider.parseWebhookEvent(JSON.stringify(req.body), signature);

    logger.info({ type: event.type }, 'Payment webhook received');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data;
        const payment = await prisma.payment.findFirst({
          where: { providerPaymentId: session.id },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed' },
          });

          const meta = payment.metadata as any;
          if (meta.plan) {
            await activateSubscription(
              payment.userId,
              meta.plan,
              meta.organizationId,
              session.subscription || session.id,
              session.customer,
            );
          } else if (meta.listingId && meta.type) {
            await activatePromotion(
              payment.userId,
              meta.listingId,
              meta.type,
              meta.durationWeeks || 1,
              payment.amount,
              session.id,
            );
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data;
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: { status: 'past_due' },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

// ── My payments ───────────────────────────────────────────────────

paymentsRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: { invoices: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
});

// ── My invoices ───────────────────────────────────────────────────

paymentsRouter.get('/invoices', authenticate, async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.id },
      orderBy: { issuedAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
});

// ── Admin: all payments ───────────────────────────────────────────

paymentsRouter.get(
  '/admin/all',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
      const status = req.query.status as string;

      const where: any = {};
      if (status) where.status = status;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            invoices: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: { data: payments, total, page, pageSize },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Admin: invoices ───────────────────────────────────────────────

paymentsRouter.get(
  '/admin/invoices',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          include: {
            payment: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
          orderBy: { issuedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.invoice.count(),
      ]);

      res.json({
        success: true,
        data: { data: invoices, total, page, pageSize },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Helpers ───────────────────────────────────────────────────────

async function activateSubscription(
  userId: string,
  plan: string,
  organizationId: string | null,
  stripeSubId?: string,
  stripeCustomerId?: string,
): Promise<void> {
  // Cancel existing active subscription
  await prisma.subscription.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const sub = await prisma.subscription.create({
    data: {
      userId,
      organizationId,
      plan,
      status: 'active',
      stripeSubscriptionId: stripeSubId,
      stripeCustomerId: stripeCustomerId,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    },
  });

  // Generate invoice
  const planDef = PLANS[plan];
  if (planDef && planDef.priceMonthly > 0) {
    const tax = Math.round(planDef.priceMonthly * 0.17); // 17% VAT
    const payment = await prisma.payment.findFirst({
      where: { userId, status: { in: ['completed', 'pending'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' },
      });

      await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          userId,
          amount: planDef.priceMonthly,
          tax,
          total: planDef.priceMonthly + tax,
          currency: planDef.currency,
          items: JSON.stringify([
            { name: planDef.nameHe, quantity: 1, amount: planDef.priceMonthly },
          ]),
        },
      });
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'subscription_activated',
      entityType: 'subscription',
      entityId: sub.id,
      metadata: { plan },
    },
  });

  logger.info({ userId, plan, subscriptionId: sub.id }, 'Subscription activated');
}

async function activatePromotion(
  userId: string,
  listingId: string,
  type: string,
  durationWeeks: number,
  amount: number,
  sessionId: string,
): Promise<void> {
  const startAt = new Date();
  const endAt = new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000);

  await prisma.promotion.create({
    data: {
      listingId,
      userId,
      type,
      startAt,
      endAt,
      isActive: true,
      amount,
      currency: 'ILS',
    },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      isPromoted: true,
      isFeatured: type === 'featured' || type === 'top_of_search',
      promotionExpiresAt: endAt,
    },
  });

  // Generate invoice
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: sessionId },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    const tax = Math.round(amount * 0.17);
    const promoName = PROMOTION_PRICES[type]?.nameHe || type;

    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        userId,
        amount,
        tax,
        total: amount + tax,
        currency: 'ILS',
        items: JSON.stringify([
          { name: `קידום ${promoName}`, quantity: durationWeeks, amount: amount / durationWeeks },
        ]),
      },
    });
  }

  logger.info({ userId, listingId, type, durationWeeks }, 'Promotion activated');
}
