import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const listingWatchesRouter = Router();

// ── Watch a listing (price alerts) ──────────────────────────────────

listingWatchesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) throw new AppError(400, 'INVALID', 'מזהה מודעה נדרש');

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, priceAmount: true, userId: true },
    });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    // Don't allow watching your own listing
    if (listing.userId === req.user!.id) {
      throw new AppError(400, 'INVALID', 'לא ניתן לעקוב אחרי מודעה שלך');
    }

    // Limit: max 50 watches per user
    const count = await prisma.listingWatch.count({ where: { userId: req.user!.id, isActive: true } });
    if (count >= 50) {
      throw new AppError(400, 'LIMIT', 'ניתן לעקוב אחרי עד 50 מודעות');
    }

    const watch = await prisma.listingWatch.upsert({
      where: {
        userId_listingId: { userId: req.user!.id, listingId },
      },
      update: {
        isActive: true,
        priceAtWatch: listing.priceAmount,
      },
      create: {
        userId: req.user!.id,
        listingId,
        priceAtWatch: listing.priceAmount,
      },
    });

    res.status(201).json({ success: true, data: watch });
  } catch (err) {
    next(err);
  }
});

// ── Get my watches ──────────────────────────────────────────────────

listingWatchesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const watches = await prisma.listingWatch.findMany({
      where: { userId: req.user!.id, isActive: true },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            priceAmount: true,
            priceCurrency: true,
            status: true,
            media: { select: { url: true, thumbnailUrl: true }, take: 1, orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with price change info
    const enriched = watches.map((w) => ({
      ...w,
      currentPrice: w.listing.priceAmount,
      priceDrop: w.priceAtWatch > w.listing.priceAmount
        ? w.priceAtWatch - w.listing.priceAmount
        : 0,
      priceDropPercent: w.priceAtWatch > w.listing.priceAmount
        ? Math.round(((w.priceAtWatch - w.listing.priceAmount) / w.priceAtWatch) * 100)
        : 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// ── Unwatch ─────────────────────────────────────────────────────────

listingWatchesRouter.delete('/:listingId', authenticate, async (req, res, next) => {
  try {
    await prisma.listingWatch.updateMany({
      where: { userId: req.user!.id, listingId: req.params.listingId },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
