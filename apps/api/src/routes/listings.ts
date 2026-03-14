import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { createListingBaseSchema, reportListingSchema } from '@zuzz/validation';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { reportRateLimiter } from '../middleware/rate-limiter';
import { serializeListingDetail } from '../serializers/listing';

export const listingsRouter = Router();

// Get listing by ID (public)
listingsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          include: {
            profile: true,
            organizationMembers: { include: { organization: true } },
          },
        },
        media: { orderBy: { order: 'asc' } },
        documents: true,
        carDetails: true,
        propertyDetails: true,
        marketDetails: true,
        trustFactors: true,
      },
    });

    if (!listing || (listing.status !== 'active' && listing.userId !== req.user?.id)) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    // Increment view count
    await prisma.listing.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    });

    // Track recently viewed
    if (req.user) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_listingId: { userId: req.user.id, listingId: listing.id },
        },
        update: { viewedAt: new Date() },
        create: { userId: req.user.id, listingId: listing.id },
      });
    }

    // Check if favorited
    let isFavorited = false;
    if (req.user) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_listingId: { userId: req.user.id, listingId: listing.id },
        },
      });
      isFavorited = !!fav;
    }

    const serialized = serializeListingDetail({ ...listing, isFavorited });
    res.json({ success: true, data: serialized });
  } catch (err) {
    next(err);
  }
});

// Update listing status
listingsRouter.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });

    if (!listing) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const isOwner = listing.userId === req.user!.id;
    const isAdmin = req.user!.roles.includes('admin') || req.user!.roles.includes('moderator');

    if (!isOwner && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    }

    const validTransitions: Record<string, string[]> = {
      draft: ['pending_review'],
      pending_review: ['active', 'rejected', 'draft'],
      active: ['paused', 'sold', 'archived'],
      paused: ['active', 'archived'],
      rejected: ['draft'],
    };

    if (!validTransitions[listing.status]?.includes(status)) {
      throw new AppError(400, 'INVALID_TRANSITION', `לא ניתן לשנות סטטוס מ-${listing.status} ל-${status}`);
    }

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        status,
        publishedAt: status === 'active' && !listing.publishedAt ? new Date() : undefined,
      },
    });

    await prisma.listingStatusHistory.create({
      data: {
        listingId: listing.id,
        fromStatus: listing.status,
        toStatus: status,
        reason,
        changedBy: req.user!.id,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Report listing
listingsRouter.post('/:id/report', authenticate, reportRateLimiter, async (req, res, next) => {
  try {
    const data = reportListingSchema.parse(req.body);

    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    // Prevent users from reporting their own listings
    if (listing.userId === req.user!.id) {
      throw new AppError(400, 'INVALID', 'לא ניתן לדווח על מודעה שלך');
    }

    // Prevent duplicate reports from the same user on the same listing
    const existingReport = await prisma.listingReport.findFirst({
      where: { listingId: req.params.id!, reportedBy: req.user!.id },
    });
    if (existingReport) {
      throw new AppError(409, 'ALREADY_REPORTED', 'כבר דיווחת על מודעה זו');
    }

    const report = await prisma.listingReport.create({
      data: {
        listingId: req.params.id!,
        reportedBy: req.user!.id,
        reason: data.reason,
        description: data.description ?? '',
      },
    });

    // Create moderation case
    await prisma.moderationCase.create({
      data: {
        listingId: listing.id,
        reportId: report.id,
        type: 'content_report',
        priority: data.reason === 'scam' ? 'high' : 'medium',
      },
    });

    res.json({ success: true, data: { message: 'הדיווח נשלח בהצלחה' } });
  } catch (err) {
    next(err);
  }
});

// Get user's own listings (all statuses)
listingsRouter.get('/my/all', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          carDetails: true,
          propertyDetails: true,
          marketDetails: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: listings, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total },
    });
  } catch (err) {
    next(err);
  }
});

// Delete listing (soft archive)
listingsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    if (listing.userId !== req.user!.id && !req.user!.roles.includes('admin')) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    }

    await prisma.listing.update({
      where: { id: req.params.id },
      data: { status: 'archived' },
    });

    res.json({ success: true, data: { message: 'המודעה הועברה לארכיון' } });
  } catch (err) {
    next(err);
  }
});
