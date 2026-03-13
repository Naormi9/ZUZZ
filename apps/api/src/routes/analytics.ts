import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { optionalAuth } from '../middleware/auth';

export const analyticsRouter = Router();

// Track event
analyticsRouter.post('/event', optionalAuth, async (req, res, next) => {
  try {
    const { type, properties, sessionId, source } = req.body;

    await prisma.analyticsEvent.create({
      data: {
        type,
        userId: req.user?.id,
        sessionId: sessionId || 'anonymous',
        properties: properties || {},
        source: source || 'web',
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get analytics summary (admin)
analyticsRouter.get('/summary', async (req, res, next) => {
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
});
