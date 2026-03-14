import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const organizationsRouter = Router();

// ── Middleware: check org membership ────────────────────────────────

async function requireOrgMember(userId: string, orgId: string, roles?: string[]) {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (!member) throw new AppError(403, 'FORBIDDEN', 'אינך חבר בארגון');
  if (roles && !roles.includes(member.role)) {
    throw new AppError(403, 'FORBIDDEN', 'אין לך הרשאה לפעולה זו');
  }
  return member;
}

// ── Create organization (dealer onboarding) ─────────────────────────

organizationsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, type, description, phone, email, website, city, region, address, licenseNumber } =
      req.body;
    if (!name || !type) throw new AppError(400, 'INVALID', 'שם וסוג ארגון נדרשים');

    const validTypes = ['dealer', 'agency', 'developer', 'business'];
    if (!validTypes.includes(type)) throw new AppError(400, 'INVALID', 'סוג ארגון לא תקין');

    // Check if user already owns an org
    const existing = await prisma.organizationMember.findFirst({
      where: { userId: req.user!.id, role: 'owner' },
    });
    if (existing) throw new AppError(400, 'ALREADY_EXISTS', 'כבר יש לך ארגון');

    const org = await prisma.organization.create({
      data: {
        name,
        type,
        description: description?.slice(0, 2000),
        phone,
        email,
        website,
        city,
        region,
        address,
        licenseNumber,
        verificationStatus: 'pending',
        members: {
          create: { userId: req.user!.id, role: 'owner' },
        },
        dealerProfile: type === 'dealer' ? { create: {} } : undefined,
      },
      include: { dealerProfile: true, members: true },
    });

    // Add dealer role to user if not present
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user && !user.roles.includes('dealer')) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { roles: { push: 'dealer' } },
      });
    }

    res.status(201).json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// ── Get my organizations ────────────────────────────────────────────

organizationsRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: req.user!.id },
      include: {
        organization: {
          include: {
            dealerProfile: true,
            _count: { select: { listings: true, members: true } },
          },
        },
      },
    });

    const orgs = memberships.map((m) => ({
      ...m.organization,
      myRole: m.role,
    }));

    res.json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
});

// ── Get organization by ID ──────────────────────────────────────────

organizationsRouter.get('/:id', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id! },
      include: {
        dealerProfile: true,
        _count: { select: { listings: true, members: true } },
      },
    });
    if (!org) throw new AppError(404, 'NOT_FOUND', 'ארגון לא נמצא');

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// ── Update organization ─────────────────────────────────────────────

organizationsRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!, ['owner', 'admin']);

    const { name, description, phone, email, website, city, region, address, logoUrl } = req.body;

    const org = await prisma.organization.update({
      where: { id: req.params.id! },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description?.slice(0, 2000) }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(city !== undefined && { city }),
        ...(region !== undefined && { region }),
        ...(address !== undefined && { address }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
      include: { dealerProfile: true },
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// ── Update dealer profile ───────────────────────────────────────────

organizationsRouter.patch('/:id/dealer-profile', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!, ['owner', 'admin']);

    const { specialties, openingHours } = req.body;

    const profile = await prisma.dealerProfile.upsert({
      where: { organizationId: req.params.id! },
      update: {
        ...(specialties && { specialties }),
        ...(openingHours !== undefined && { openingHours }),
      },
      create: {
        organizationId: req.params.id!,
        specialties: specialties || [],
        openingHours,
      },
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// ── Organization members ────────────────────────────────────────────

organizationsRouter.get('/:id/members', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!);

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.params.id! },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

// ── Invite member ───────────────────────────────────────────────────

organizationsRouter.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!, ['owner', 'admin']);

    const { email, role } = req.body;
    if (!email) throw new AppError(400, 'INVALID', 'אימייל נדרש');

    const validRoles = ['admin', 'member'];
    const memberRole = validRoles.includes(role) ? role : 'member';

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new AppError(404, 'NOT_FOUND', 'משתמש לא נמצא');

    const existing = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: req.params.id!, userId: targetUser.id } },
    });
    if (existing) throw new AppError(400, 'ALREADY_EXISTS', 'המשתמש כבר חבר בארגון');

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: req.params.id!,
        userId: targetUser.id,
        role: memberRole,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// ── Remove member ───────────────────────────────────────────────────

organizationsRouter.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const membership = await requireOrgMember(req.user!.id, req.params.id!, ['owner', 'admin']);

    if (req.params.userId! === req.user!.id && membership.role === 'owner') {
      throw new AppError(400, 'INVALID', 'בעל הארגון לא יכול להסיר את עצמו');
    }

    // Non-owners cannot remove owners
    const target = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: req.params.id!, userId: req.params.userId! },
      },
    });
    if (!target) throw new AppError(404, 'NOT_FOUND', 'חבר לא נמצא');
    if (target.role === 'owner' && membership.role !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה להסרת בעלים');
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId: req.params.id!, userId: req.params.userId! },
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Organization listings (inventory) ───────────────────────────────

organizationsRouter.get('/:id/listings', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!);

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
    const status = req.query.status as string;

    const where: Record<string, unknown> = { organizationId: req.params.id! };
    if (status) where.status = status;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          _count: { select: { leads: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: listings, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// ── Organization leads ──────────────────────────────────────────────

organizationsRouter.get('/:id/leads', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!);

    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    // Get all org listing IDs
    const orgListings = await prisma.listing.findMany({
      where: { organizationId: req.params.id! },
      select: { id: true },
    });
    const listingIds = orgListings.map((l) => l.id);

    const where: Record<string, unknown> = { listingId: { in: listingIds } };
    if (status) where.status = status;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, vertical: true } },
          buyer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: leads, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// ── Organization analytics ──────────────────────────────────────────

organizationsRouter.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    await requireOrgMember(req.user!.id, req.params.id!);

    const [
      activeListings,
      totalListings,
      totalLeads,
      newLeads,
      totalViews,
      totalFavorites,
      promotions,
    ] = await Promise.all([
      prisma.listing.count({ where: { organizationId: req.params.id!, status: 'active' } }),
      prisma.listing.count({ where: { organizationId: req.params.id! } }),
      prisma.lead.count({
        where: { listing: { organizationId: req.params.id! } },
      }),
      prisma.lead.count({
        where: { listing: { organizationId: req.params.id! }, status: 'new' },
      }),
      prisma.listing.aggregate({
        where: { organizationId: req.params.id! },
        _sum: { viewCount: true },
      }),
      prisma.listing.aggregate({
        where: { organizationId: req.params.id! },
        _sum: { favoriteCount: true },
      }),
      prisma.promotion.count({
        where: { listing: { organizationId: req.params.id! }, isActive: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        activeListings,
        totalListings,
        totalLeads,
        newLeads,
        totalViews: totalViews._sum.viewCount || 0,
        totalFavorites: totalFavorites._sum.favoriteCount || 0,
        activePromotions: promotions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Public: organization inventory (for dealer profile page) ────────

organizationsRouter.get('/:id/public-listings', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const org = await prisma.organization.findUnique({
      where: { id: req.params.id!, isActive: true },
    });
    if (!org) throw new AppError(404, 'NOT_FOUND', 'ארגון לא נמצא');

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { organizationId: req.params.id!, status: 'active' },
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          carDetails: {
            select: { make: true, model: true, year: true, mileage: true, gearbox: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where: { organizationId: req.params.id!, status: 'active' } }),
    ]);

    res.json({
      success: true,
      data: { data: listings, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});
