import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('checkout');

export const checkoutRouter = Router();

// ── Plan pricing ────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, { monthly: number; name: string; nameHe: string }> = {
  basic: { monthly: 9900, name: 'Basic', nameHe: 'בסיסי' },
  pro: { monthly: 24900, name: 'Pro', nameHe: 'מקצועי' },
  enterprise: { monthly: 49900, name: 'Enterprise', nameHe: 'ארגוני' },
};

const PROMOTION_PRICES: Record<string, { price: number; nameHe: string }> = {
  boost: { price: 2900, nameHe: 'בוסט' },
  highlight: { price: 4900, nameHe: 'הדגשה' },
  featured: { price: 9900, nameHe: 'מודעה נבחרת' },
  top_of_search: { price: 14900, nameHe: 'ראש חיפוש' },
  gallery: { price: 6900, nameHe: 'גלריה' },
};

// ── Checkout session schema ─────────────────────────────────────────

const subscriptionCheckoutSchema = z.object({
  type: z.literal('subscription'),
  plan: z.enum(['basic', 'pro', 'enterprise']),
  organizationId: z.string().optional(),
  durationMonths: z.number().min(1).max(12).optional().default(1),
});

const promotionCheckoutSchema = z.object({
  type: z.literal('promotion'),
  promotionType: z.enum(['boost', 'highlight', 'featured', 'top_of_search', 'gallery']),
  listingId: z.string(),
  durationDays: z.number().min(1).max(90).optional().default(7),
});

const checkoutSchema = z.discriminatedUnion('type', [
  subscriptionCheckoutSchema,
  promotionCheckoutSchema,
]);

// ── Create checkout session ─────────────────────────────────────────

checkoutRouter.post('/create-session', authenticate, async (req, res, next) => {
  try {
    const data = checkoutSchema.parse(req.body);
    let amount: number;
    let description: string;
    let metadata: Record<string, string> = {};

    if (data.type === 'subscription') {
      const planInfo = PLAN_PRICES[data.plan];
      if (!planInfo) throw new AppError(400, 'INVALID', 'תוכנית לא תקינה');

      amount = planInfo.monthly * data.durationMonths;
      description = `מנוי ${planInfo.nameHe} — ${data.durationMonths} חודשים`;
      metadata = {
        type: 'subscription',
        plan: data.plan,
        durationMonths: String(data.durationMonths),
        organizationId: data.organizationId || '',
      };
    } else {
      const promoInfo = PROMOTION_PRICES[data.promotionType];
      if (!promoInfo) throw new AppError(400, 'INVALID', 'סוג קידום לא תקין');

      // Verify listing ownership
      const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
      if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
      if (listing.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
        // Check org membership
        if (listing.organizationId) {
          const member = await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: { organizationId: listing.organizationId, userId: req.user!.id },
            },
          });
          if (!member) throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
        } else {
          throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
        }
      }

      const weeks = Math.ceil(data.durationDays / 7);
      amount = promoInfo.price * weeks;
      description = `קידום ${promoInfo.nameHe} — ${data.durationDays} ימים`;
      metadata = {
        type: 'promotion',
        promotionType: data.promotionType,
        listingId: data.listingId,
        durationDays: String(data.durationDays),
      };
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        amount,
        currency: 'ILS',
        status: 'pending',
        provider: process.env.PAYMENT_PROVIDER || 'sandbox',
        description,
        metadata: metadata as any,
      },
    });

    // Generate checkout URL
    // In sandbox mode: return a mock checkout URL that auto-completes
    // In production: would create a Stripe/PayPlus/Meshulam session
    const provider = process.env.PAYMENT_PROVIDER || 'sandbox';
    let checkoutUrl: string;

    if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      // Stripe integration placeholder — would use stripe.checkout.sessions.create
      checkoutUrl = `/checkout/stripe?paymentId=${payment.id}`;
      logger.info({ paymentId: payment.id, amount }, 'stripe_session_created');
    } else {
      // Sandbox mode: direct to sandbox completion endpoint
      checkoutUrl = `/api/checkout/sandbox-complete?paymentId=${payment.id}`;
      logger.info({ paymentId: payment.id, amount }, 'sandbox_session_created');
    }

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        checkoutUrl,
        amount,
        currency: 'ILS',
        description,
        provider,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'VALIDATION', 'נתונים לא תקינים'));
    }
    next(err);
  }
});

// ── Sandbox payment completion (test mode only) ─────────────────────

checkoutRouter.get('/sandbox-complete', authenticate, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_PROVIDER !== 'sandbox') {
      throw new AppError(403, 'FORBIDDEN', 'Sandbox not available in production');
    }

    const paymentId = req.query.paymentId as string;
    if (!paymentId) throw new AppError(400, 'INVALID', 'paymentId נדרש');

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError(404, 'NOT_FOUND', 'תשלום לא נמצא');
    if (payment.userId !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    if (payment.status !== 'pending') throw new AppError(400, 'INVALID', 'תשלום כבר טופל');

    await processPaymentSuccess(paymentId);

    // Redirect to success page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    res.redirect(`${appUrl}/checkout/success?paymentId=${paymentId}`);
  } catch (err) {
    next(err);
  }
});

// ── Payment webhook / callback ──────────────────────────────────────

checkoutRouter.post('/webhook', async (req, res, next) => {
  try {
    const { paymentId, status, providerPaymentId } = req.body;

    if (status === 'completed' || status === 'success') {
      await processPaymentSuccess(paymentId, providerPaymentId);
    } else if (status === 'failed') {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'failed' },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Process successful payment ──────────────────────────────────────

async function processPaymentSuccess(paymentId: string, providerPaymentId?: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'completed',
      providerPaymentId: providerPaymentId || `sandbox_${Date.now()}`,
    },
  });

  const meta = payment.metadata as Record<string, string>;

  // Generate invoice
  const invoiceCount = await prisma.invoice.count();
  await prisma.invoice.create({
    data: {
      paymentId: payment.id,
      invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, '0')}`,
      userId: payment.userId,
      amount: payment.amount,
      tax: Math.round(payment.amount * 0.17), // 17% VAT
      total: Math.round(payment.amount * 1.17),
      currency: payment.currency,
      items: [{ description: payment.description, amount: payment.amount }] as any,
    },
  });

  // Activate the purchased item
  if (meta.type === 'subscription') {
    const months = parseInt(meta.durationMonths || '1');
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: { userId: payment.userId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    await prisma.subscription.create({
      data: {
        userId: payment.userId,
        organizationId: meta.organizationId || null,
        plan: meta.plan,
        status: 'active',
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
    });

    logger.info({ userId: payment.userId, plan: meta.plan, months }, 'subscription_activated');
  } else if (meta.type === 'promotion') {
    const days = parseInt(meta.durationDays || '7');
    const startAt = new Date();
    const endAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.promotion.create({
      data: {
        listingId: meta.listingId!,
        userId: payment.userId,
        type: meta.promotionType || 'boost',
        startAt,
        endAt,
        isActive: true,
        amount: payment.amount,
        currency: payment.currency,
      },
    });

    await prisma.listing.update({
      where: { id: meta.listingId },
      data: {
        isPromoted: true,
        isFeatured: meta.promotionType === 'featured' || meta.promotionType === 'top_of_search',
        promotionExpiresAt: endAt,
      },
    });

    logger.info({ listingId: meta.listingId, type: meta.promotionType, days }, 'promotion_activated');
  }
}

// ── Get payment status ──────────────────────────────────────────────

checkoutRouter.get('/payment/:id', authenticate, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoices: true },
    });
    if (!payment) throw new AppError(404, 'NOT_FOUND', 'תשלום לא נמצא');
    if (payment.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

// ── Get my payments ─────────────────────────────────────────────────

checkoutRouter.get('/payments', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: req.user!.id },
        include: { invoices: { select: { invoiceNumber: true, total: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({ success: true, data: { data: payments, total, page, pageSize } });
  } catch (err) {
    next(err);
  }
});

// ── Get subscription plans (public) ─────────────────────────────────

checkoutRouter.get('/plans', async (_req, res) => {
  const plans = [
    {
      id: 'free',
      nameHe: 'חינם',
      price: 0,
      features: [
        'עד 3 מודעות פעילות',
        'ציון אמון בסיסי',
        'הודעות ללא הגבלה',
      ],
    },
    {
      id: 'basic',
      nameHe: 'בסיסי',
      price: 9900,
      features: [
        'עד 20 מודעות פעילות',
        'ציון אמון מלא',
        'סטטיסטיקות בסיסיות',
        'לוגו סוחר',
        'תמיכה במייל',
      ],
    },
    {
      id: 'pro',
      nameHe: 'מקצועי',
      price: 24900,
      popular: true,
      features: [
        'מודעות ללא הגבלה',
        'ציון אמון מלא + תגים',
        'סטטיסטיקות מתקדמות',
        'ניהול צוות',
        'קידום מודעות בהנחה',
        'תמיכה בצ\'אט',
      ],
    },
    {
      id: 'enterprise',
      nameHe: 'ארגוני',
      price: 49900,
      features: [
        'הכל ב-Pro',
        'API גישה',
        'אינטגרציות מותאמות',
        'מנהל לקוח ייעודי',
        'SLA מובטח',
        'חשבוניות מסודרות',
      ],
    },
  ];

  res.json({ success: true, data: plans });
});
