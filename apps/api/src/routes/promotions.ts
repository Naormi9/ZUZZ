import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const promotionsRouter = Router();

const VALID_TYPES = ['boost', 'highlight', 'featured', 'top_of_search', 'gallery'] as const;

// ── Create promotion for a listing ──────────────────────────────────

promotionsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId, type, durationDays } = req.body;
    if (!listingId || !type) throw new AppError(400, 'INVALID', 'מזהה מודעה וסוג קידום נדרשים');
    if (!VALID_TYPES.includes(type)) throw new AppError(400, 'INVALID', 'סוג קידום לא תקין');

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    // Ownership: user owns the listing or is org member
    const isOwner = listing.userId === req.user!.id;
    const isAdmin = req.user!.roles.includes('admin');
    let isOrgMember = false;
    if (listing.organizationId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId: listing.organizationId, userId: req.user!.id },
        },
      });
      isOrgMember = !!member;
    }
    if (!isOwner && !isOrgMember && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה לקדם מודעה זו');
    }

    const days = Math.min(Math.max(durationDays || 7, 1), 90);
    const startAt = new Date();
    const endAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Price calculation (simple tier pricing in agorot)
    const priceMap: Record<string, number> = {
      boost: 2900, // ₪29
      highlight: 4900, // ₪49
      featured: 9900, // ₪99
      top_of_search: 14900, // ₪149
      gallery: 6900, // ₪69
    };
    const amount = (priceMap[type] || 4900) * Math.ceil(days / 7);

    const promotion = await prisma.promotion.create({
      data: {
        listingId,
        userId: req.user!.id,
        type,
        startAt,
        endAt,
        isActive: true,
        amount,
        currency: 'ILS',
      },
    });

    // Update listing promotion flags
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        isPromoted: true,
        isFeatured: type === 'featured' || type === 'top_of_search',
        promotionExpiresAt: endAt,
      },
    });

    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    next(err);
  }
});

// ── Get my promotions ───────────────────────────────────────────────

promotionsRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { userId: req.user!.id },
      include: {
        listing: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: promotions });
  } catch (err) {
    next(err);
  }
});

// ── Cancel promotion ────────────────────────────────────────────────

promotionsRouter.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const promo = await prisma.promotion.findUnique({ where: { id: req.params.id! } });
    if (!promo) throw new AppError(404, 'NOT_FOUND', 'קידום לא נמצא');
    if (promo.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    }

    await prisma.promotion.update({
      where: { id: req.params.id! },
      data: { isActive: false, endAt: new Date() },
    });

    // Check if listing has other active promotions
    const remaining = await prisma.promotion.count({
      where: { listingId: promo.listingId, isActive: true, id: { not: promo.id } },
    });
    if (remaining === 0) {
      await prisma.listing.update({
        where: { id: promo.listingId },
        data: { isPromoted: false, isFeatured: false, promotionExpiresAt: null },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Admin: list all promotions ──────────────────────────────────────

promotionsRouter.get(
  '/admin/all',
  authenticate,
  requireRole('admin', 'moderator'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
      const activeOnly = req.query.active === 'true';

      const where: Record<string, unknown> = {};
      if (activeOnly) where.isActive = true;

      const [promotions, total] = await Promise.all([
        prisma.promotion.findMany({
          where,
          include: {
            listing: { select: { id: true, title: true, userId: true, organizationId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.promotion.count({ where }),
      ]);

      res.json({
        success: true,
        data: { data: promotions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  },
);
