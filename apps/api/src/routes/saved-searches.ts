import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const savedSearchesRouter = Router();

const createSchema = z.object({
  vertical: z.enum(['cars', 'homes', 'market']),
  name: z.string().max(100).optional(),
  filters: z.record(z.unknown()),
  alertEnabled: z.boolean().optional().default(false),
  alertFrequency: z.enum(['instant', 'daily', 'weekly']).optional().default('daily'),
});

const updateSchema = z.object({
  name: z.string().max(100).optional(),
  alertEnabled: z.boolean().optional(),
  alertFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
});

// ── Create saved search ─────────────────────────────────────────────

savedSearchesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    // Limit: max 20 saved searches per user
    const count = await prisma.savedSearch.count({ where: { userId: req.user!.id } });
    if (count >= 20) {
      throw new AppError(400, 'LIMIT', 'ניתן לשמור עד 20 חיפושים');
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: req.user!.id,
        vertical: data.vertical,
        name: data.name || null,
        filters: data.filters as any,
        alertEnabled: data.alertEnabled,
        alertFrequency: data.alertFrequency,
      },
    });

    res.status(201).json({ success: true, data: savedSearch });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'VALIDATION', 'נתונים לא תקינים'));
    }
    next(err);
  }
});

// ── Get my saved searches ───────────────────────────────────────────

savedSearchesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const vertical = req.query.vertical as string | undefined;
    const where: Record<string, unknown> = { userId: req.user!.id };
    if (vertical) where.vertical = vertical;

    const savedSearches = await prisma.savedSearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: savedSearches });
  } catch (err) {
    next(err);
  }
});

// ── Update saved search ─────────────────────────────────────────────

savedSearchesRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'חיפוש שמור לא נמצא');
    }

    const data = updateSchema.parse(req.body);

    const updated = await prisma.savedSearch.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.alertEnabled !== undefined && { alertEnabled: data.alertEnabled }),
        ...(data.alertFrequency !== undefined && { alertFrequency: data.alertFrequency }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError(400, 'VALIDATION', 'נתונים לא תקינים'));
    }
    next(err);
  }
});

// ── Delete saved search ─────────────────────────────────────────────

savedSearchesRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'חיפוש שמור לא נמצא');
    }

    await prisma.savedSearch.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
