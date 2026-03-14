import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';

export const analyticsRouter = Router();

const eventSchema = z.object({
  type: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  sessionId: z.string().max(200).optional(),
  source: z.enum(['web', 'admin', 'mobile']).optional(),
});

// Track event
analyticsRouter.post('/event', optionalAuth, async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);

    await prisma.analyticsEvent.create({
      data: {
        type: data.type,
        userId: req.user?.id,
        sessionId: data.sessionId || 'anonymous',
        properties: (data.properties || {}) as any,
        source: data.source || 'web',
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get analytics summary (admin only — was previously unauthenticated)
analyticsRouter.get(
  '/summary',
  authenticate,
  requireRole('admin', 'moderator'),
  async (req, res, next) => {
    try {
      const period = (req.query.period as string) || 'week';
      const now = new Date();
      let since: Date;

      if (period === 'day') since = new Date(now.getTime() - 86400000);
      else if (period === 'month') since = new Date(now.getTime() - 30 * 86400000);
      else since = new Date(now.getTime() - 7 * 86400000);

      const events = await prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { type: true },
      });

      const metrics: Record<string, number> = {};
      for (const e of events) {
        metrics[e.type] = e._count.type;
      }

      res.json({ success: true, data: { period, metrics } });
    } catch (err) {
      next(err);
    }
  },
);
