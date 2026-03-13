import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { propertyDetailsSchema, propertySearchFiltersSchema } from '@zuzz/validation';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const homesRouter = Router();

// Create property listing
homesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.create({
      data: {
        userId: req.user!.id,
        vertical: 'homes',
        status: 'draft',
        title: '',
        priceAmount: 0,
        priceCurrency: 'ILS',
        propertyDetails: {
          create: {
            propertyType: 'apartment',
            listingType: 'sale',
            rooms: 3,
            bathrooms: 1,
            sizeSqm: 0,
            condition: 'good',
            sellerType: 'owner',
          },
        },
      },
      include: { propertyDetails: true },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
});

// Update property details
homesRouter.put('/:id/details', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const data = propertyDetailsSchema.parse(req.body);

    await prisma.propertyListing.update({
      where: { listingId: req.params.id },
      data: {
        ...data,
        entryDate: data.entryDate ? new Date(data.entryDate) : null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Search properties
homesRouter.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const filters = propertySearchFiltersSchema.parse(req.query);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const where: any = { vertical: 'homes', status: 'active' };
    if (filters.city?.length) where.city = { in: filters.city };
    if (filters.priceFrom || filters.priceTo) {
      where.priceAmount = {};
      if (filters.priceFrom) where.priceAmount.gte = filters.priceFrom;
      if (filters.priceTo) where.priceAmount.lte = filters.priceTo;
    }

    const propWhere: any = {};
    if (filters.propertyType?.length) propWhere.propertyType = { in: filters.propertyType };
    if (filters.listingType) propWhere.listingType = filters.listingType;
    if (filters.roomsFrom || filters.roomsTo) {
      propWhere.rooms = {};
      if (filters.roomsFrom) propWhere.rooms.gte = filters.roomsFrom;
      if (filters.roomsTo) propWhere.rooms.lte = filters.roomsTo;
    }
    if (filters.sizeSqmFrom || filters.sizeSqmTo) {
      propWhere.sizeSqm = {};
      if (filters.sizeSqmFrom) propWhere.sizeSqm.gte = filters.sizeSqmFrom;
      if (filters.sizeSqmTo) propWhere.sizeSqm.lte = filters.sizeSqmTo;
    }
    if (filters.hasParking) propWhere.parkingSpots = { gt: 0 };
    if (filters.hasElevator) propWhere.hasElevator = true;
    if (filters.hasSafeRoom) propWhere.hasSafeRoom = true;
    if (filters.isImmediate) propWhere.isImmediate = true;

    if (Object.keys(propWhere).length) where.propertyDetails = propWhere;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          propertyDetails: true,
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
