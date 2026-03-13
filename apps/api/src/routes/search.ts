import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const searchRouter = Router();

// Global search across verticals
searchRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const q = req.query.q as string;
    const vertical = req.query.vertical as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const where: any = { status: 'active' };
    if (vertical) where.vertical = vertical;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          carDetails: true,
          propertyDetails: true,
          marketDetails: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: [{ isPromoted: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items: listings, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total },
    });
  } catch (err) {
    next(err);
  }
});

// Save search
searchRouter.post('/saved', authenticate, async (req, res, next) => {
  try {
    const { vertical, name, filters, alertEnabled, alertFrequency } = req.body;

    const saved = await prisma.savedSearch.create({
      data: {
        userId: req.user!.id,
        vertical,
        name,
        filters: filters || {},
        alertEnabled: alertEnabled || false,
        alertFrequency,
      },
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

// Get saved searches
searchRouter.get('/saved', authenticate, async (req, res, next) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: searches });
  } catch (err) {
    next(err);
  }
});

// Delete saved search
searchRouter.delete('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const search = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!search || search.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'חיפוש שמור לא נמצא');
    }

    await prisma.savedSearch.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get recently viewed
searchRouter.get('/recent', authenticate, async (req, res, next) => {
  try {
    const recent = await prisma.recentlyViewed.findMany({
      where: { userId: req.user!.id },
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
      orderBy: { viewedAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: recent.map((r) => r.listing) });
  } catch (err) {
    next(err);
  }
});

// Suggest search terms
searchRouter.get('/suggest', async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Search car makes/models matching query
    const carSuggestions = await prisma.carListing.findMany({
      where: {
        OR: [
          { make: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { make: true, model: true },
      distinct: ['make', 'model'],
      take: 5,
    });

    const suggestions = carSuggestions.map((c) => `${c.make} ${c.model}`);

    res.json({ success: true, data: suggestions });
  } catch (err) {
    next(err);
  }
});
