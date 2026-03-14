import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { updateProfileSchema } from '@zuzz/validation';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const usersRouter = Router();

// Get user profile by ID (public)
usersRouter.get('/:id/profile', async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findFirst({
      where: { userId: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'פרופיל לא נמצא');
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// Update own profile
usersRouter.put('/profile', authenticate, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        ...data,
        city: data.location?.city,
        region: data.location?.region,
      },
      create: {
        userId: req.user!.id,
        displayName: data.displayName || req.user!.name,
        city: data.location?.city,
        region: data.location?.region,
        bio: data.bio,
        website: data.website,
      },
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// Get user's listings
usersRouter.get('/:id/listings', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { userId: req.params.id, status: 'active' },
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          carDetails: true,
          propertyDetails: true,
          marketDetails: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({
        where: { userId: req.params.id, status: 'active' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        data: listings,
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

// Get seller card (public info for listing contact)
usersRouter.get('/:id/seller-card', async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findFirst({
      where: { userId: req.params.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        organizationMembers: {
          include: {
            organization: {
              include: { dealerProfile: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'מוכר לא נמצא');
    }

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, memberSince: user.createdAt },
        profile,
        organizations: user.organizationMembers.map((m) => m.organization),
      },
    });
  } catch (err) {
    next(err);
  }
});
