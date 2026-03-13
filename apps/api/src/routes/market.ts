import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { marketListingSchema, marketSearchFiltersSchema } from '@zuzz/validation';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const marketRouter = Router();

// Create market listing
marketRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const marketData = marketListingSchema.parse(req.body);

    const listing = await prisma.listing.create({
      data: {
        userId: req.user!.id,
        vertical: 'market',
        status: 'draft',
        title: '',
        priceAmount: 0,
        priceCurrency: 'ILS',
        marketDetails: {
          create: {
            category: marketData.category,
            condition: marketData.condition,
            brand: marketData.brand,
            attributes: marketData.attributes || {},
            shippingAvailable: marketData.shippingAvailable || false,
            isFreeDelivery: marketData.isFreeDelivery || false,
          },
        },
      },
      include: { marketDetails: true },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
});

// List market items (recent)
marketRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
    const sort = (req.query.sort as string) || 'newest';

    const where: any = { vertical: 'market', status: 'active' };

    const orderBy: any = sort === 'price_asc' ? { priceAmount: 'asc' } : sort === 'price_desc' ? { priceAmount: 'desc' } : { createdAt: 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          marketDetails: true,
          user: { select: { id: true, name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: listings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// Search market
marketRouter.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const filters = marketSearchFiltersSchema.parse(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const where: any = { vertical: 'market', status: 'active' };
    if (filters.city?.length) where.city = { in: filters.city };
    if (filters.priceFrom || filters.priceTo) {
      where.priceAmount = {};
      if (filters.priceFrom) where.priceAmount.gte = filters.priceFrom;
      if (filters.priceTo) where.priceAmount.lte = filters.priceTo;
    }
    if (filters.query) {
      where.title = { contains: filters.query, mode: 'insensitive' };
    }

    const marketWhere: any = {};
    if (filters.category?.length) marketWhere.category = { in: filters.category };
    if (filters.condition?.length) marketWhere.condition = { in: filters.condition };
    if (filters.freeDelivery) marketWhere.isFreeDelivery = true;

    if (Object.keys(marketWhere).length) where.marketDetails = marketWhere;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          marketDetails: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
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
