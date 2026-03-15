import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const deviceTokensRouter = Router();

const registerSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(['ios', 'android', 'web']),
  provider: z.enum(['fcm', 'apns', 'web_push']).optional().default('fcm'),
  appVersion: z.string().max(50).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
});

// ── Register device token ──────────────────────────────────────────

deviceTokensRouter.post('/register', authenticate, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const token = await prisma.deviceToken.upsert({
      where: {
        userId_token: { userId: req.user!.id, token: data.token },
      },
      update: {
        isActive: true,
        platform: data.platform,
        provider: data.provider,
        appVersion: data.appVersion || null,
        deviceInfo: (data.deviceInfo || {}) as any,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user!.id,
        token: data.token,
        platform: data.platform,
        provider: data.provider,
        appVersion: data.appVersion || null,
        deviceInfo: (data.deviceInfo || {}) as any,
      },
    });

    res.status(201).json({ success: true, data: { id: token.id } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'VALIDATION', 'נתונים לא תקינים'));
    }
    next(err);
  }
});

// ── Unregister device token ────────────────────────────────────────

deviceTokensRouter.delete('/unregister', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new AppError(400, 'INVALID', 'token נדרש');

    await prisma.deviceToken.updateMany({
      where: { userId: req.user!.id, token },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Get my device tokens ───────────────────────────────────────────

deviceTokensRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userId: req.user!.id, isActive: true },
      select: { id: true, platform: true, provider: true, createdAt: true, appVersion: true },
    });

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
});
