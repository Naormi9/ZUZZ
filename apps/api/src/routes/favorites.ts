import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';

export const favoritesRouter = Router();

// Get user's favorites
favoritesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
    const vertical = req.query.vertical as string;

    const where: any = { userId: req.user!.id };
    if (vertical) {
      where.listing = { vertical };
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        include: {
          listing: {
            include: {
              media: { take: 1, orderBy: { order: 'asc' } },
              carDetails: true,
              propertyDetails: true,
              marketDetails: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.favorite.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: favorites.map((f) => ({ ...f.listing, favoritedAt: f.createdAt })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Toggle favorite
favoritesRouter.post('/:listingId', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: req.user!.id,
          listingId: req.params.listingId!,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.listing.update({
        where: { id: req.params.listingId! },
        data: { favoriteCount: { decrement: 1 } },
      });
      res.json({ success: true, data: { isFavorited: false } });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user!.id, listingId: req.params.listingId! },
      });
      await prisma.listing.update({
        where: { id: req.params.listingId! },
        data: { favoriteCount: { increment: 1 } },
      });
      res.json({ success: true, data: { isFavorited: true } });
    }
  } catch (err) {
    next(err);
  }
});
