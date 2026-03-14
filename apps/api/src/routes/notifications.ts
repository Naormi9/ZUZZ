import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';

export const notificationsRouter = Router();

// Get notifications
notificationsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: { data: notifications, total, unreadCount, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
notificationsRouter.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
notificationsRouter.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
