import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const subscriptionsRouter = Router();

const VALID_PLANS = ['free', 'basic', 'pro', 'enterprise'] as const;
const VALID_STATUSES = ['active', 'past_due', 'cancelled', 'expired'] as const;

// ── Get my subscription ─────────────────────────────────────────────

subscriptionsRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user!.id, status: { in: ['active', 'past_due'] } },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// ── Admin: list all subscriptions ───────────────────────────────────

subscriptionsRouter.get('/admin/all', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscription.count(),
    ]);

    res.json({
      success: true,
      data: { data: subs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// ── Admin: assign/update subscription ───────────────────────────────

subscriptionsRouter.post('/admin/assign', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { userId, organizationId, plan, durationMonths } = req.body;
    if (!userId || !plan) throw new AppError(400, 'INVALID', 'userId ו-plan נדרשים');
    if (!VALID_PLANS.includes(plan)) throw new AppError(400, 'INVALID', 'תוכנית לא תקינה');

    const months = Math.min(Math.max(durationMonths || 1, 1), 24);
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    const sub = await prisma.subscription.create({
      data: {
        userId,
        organizationId: organizationId || null,
        plan,
        status: 'active',
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'subscription_assigned',
        entityType: 'subscription',
        entityId: sub.id,
        metadata: { plan, durationMonths: months, targetUserId: userId },
      },
    });

    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// ── Admin: cancel subscription ──────────────────────────────────────

subscriptionsRouter.patch('/admin/:id/cancel', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id! } });
    if (!sub) throw new AppError(404, 'NOT_FOUND', 'מנוי לא נמצא');

    await prisma.subscription.update({
      where: { id: req.params.id! },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'subscription_cancelled',
        entityType: 'subscription',
        entityId: sub.id,
        metadata: { plan: sub.plan, targetUserId: sub.userId },
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
