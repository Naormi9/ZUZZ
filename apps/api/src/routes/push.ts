import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { notifyUser } from '../lib/push';

export const pushRouter = Router();

const registerSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
});

// ── Register device token ─────────────────────────────────────────

pushRouter.post('/register', authenticate, async (req, res, next) => {
  try {
    const { token, platform } = registerSchema.parse(req.body);

    await prisma.deviceToken.upsert({
      where: {
        userId_token: { userId: req.user!.id, token },
      },
      create: {
        userId: req.user!.id,
        token,
        platform,
        isActive: true,
      },
      update: {
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Unregister device token ───────────────────────────────────────

pushRouter.post('/unregister', authenticate, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    await prisma.deviceToken.updateMany({
      where: { userId: req.user!.id, token },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Get my device tokens ──────────────────────────────────────────

pushRouter.get('/devices', authenticate, async (req, res, next) => {
  try {
    const devices = await prisma.deviceToken.findMany({
      where: { userId: req.user!.id, isActive: true },
      select: { id: true, platform: true, createdAt: true },
    });

    res.json({ success: true, data: devices });
  } catch (err) {
    next(err);
  }
});

// ── Admin: notification inspector ─────────────────────────────────

pushRouter.get(
  '/admin/tokens',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
      const userId = req.query.userId as string;

      const where: any = { isActive: true };
      if (userId) where.userId = userId;

      const [tokens, total] = await Promise.all([
        prisma.deviceToken.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.deviceToken.count({ where }),
      ]);

      res.json({
        success: true,
        data: { data: tokens, total, page, pageSize },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Admin: resend notification ────────────────────────────────────

pushRouter.post(
  '/admin/resend/:notificationId',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.notificationId },
      });

      if (!notification) {
        throw new AppError(404, 'NOT_FOUND', 'התראה לא נמצאה');
      }

      await notifyUser(
        notification.userId,
        notification.type as any,
        notification.title,
        notification.body,
        notification.link || undefined,
        (notification.metadata as Record<string, string>) || undefined,
      );

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

// ── Admin: send test notification ─────────────────────────────────

pushRouter.post(
  '/admin/test',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { userId, title, body } = req.body;
      if (!userId || !title || !body) {
        throw new AppError(400, 'INVALID', 'userId, title, body נדרשים');
      }

      await notifyUser(userId, 'listing_status', title, body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);
