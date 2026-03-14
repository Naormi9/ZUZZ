import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const adminRouter = Router();

// All admin routes require authentication + admin/moderator role
adminRouter.use(authenticate, requireRole('admin', 'moderator'));

// Dashboard metrics
adminRouter.get('/metrics', async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      activeListings,
      pendingModeration,
      newUsersToday,
      newListingsToday,
      messagesExchangedToday,
      openReports,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.count({ where: { moderationStatus: 'pending' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.listing.count({ where: { createdAt: { gte: today } } }),
      prisma.message.count({ where: { createdAt: { gte: today } } }),
      prisma.listingReport.count({ where: { status: 'open' } }),
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeListings,
        pendingModeration,
        newUsersToday,
        newListingsToday,
        messagesExchangedToday,
        openReports,
        revenueThisMonth: totalRevenue._sum.amount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Users management
adminRouter.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true, _count: { select: { listings: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: { data: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// User detail
adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        listings: { take: 10, orderBy: { createdAt: 'desc' } },
        organizationMembers: { include: { organization: true } },
        _count: { select: { listings: true, favorites: true } },
      },
    });

    if (!user) throw new AppError(404, 'NOT_FOUND', 'משתמש לא נמצא');

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// Toggle user active status
adminRouter.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'משתמש לא נמצא');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Moderation queue
adminRouter.get('/moderation', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    const where: any = { moderationStatus: status };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          media: { take: 3, orderBy: { order: 'asc' } },
          carDetails: true,
          propertyDetails: true,
          marketDetails: true,
          reports: { where: { status: 'open' } },
        },
        orderBy: { createdAt: 'asc' },
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

// Moderate listing
adminRouter.post('/moderation/:listingId/action', async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    const statusMap: Record<string, { moderationStatus: string; status?: string }> = {
      approve: { moderationStatus: 'approved', status: 'active' },
      reject: { moderationStatus: 'rejected', status: 'rejected' },
      request_changes: { moderationStatus: 'changes_requested' },
      flag: { moderationStatus: 'flagged' },
    };

    const update = statusMap[action];
    if (!update) throw new AppError(400, 'INVALID_ACTION', 'פעולה לא תקינה');

    await prisma.listing.update({
      where: { id: req.params.listingId },
      data: {
        moderationStatus: update.moderationStatus,
        ...(update.status ? { status: update.status } : {}),
        ...(update.status === 'active' && !listing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });

    // Create moderation case record
    await prisma.moderationCase.create({
      data: {
        listingId: req.params.listingId,
        type: 'listing_review',
        status: 'resolved',
        actions: {
          create: {
            action,
            performedBy: req.user!.id,
            reason,
          },
        },
      },
    });

    // Notify listing owner
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: action === 'approve' ? 'listing_approved' : 'listing_rejected',
        title: action === 'approve' ? 'מודעה אושרה' : 'מודעה נדחתה',
        body:
          action === 'approve'
            ? `המודעה "${listing.title}" אושרה ופורסמה`
            : `המודעה "${listing.title}" נדחתה${reason ? ': ' + reason : ''}`,
        link: `/listings/${listing.id}`,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Reports
adminRouter.get('/reports', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'open';
    const reports = await prisma.listingReport.findMany({
      where: { status },
      include: {
        listing: {
          select: { id: true, title: true, userId: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

// Resolve report
adminRouter.patch('/reports/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    await prisma.listingReport.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Organizations
adminRouter.get('/organizations', async (req, res, next) => {
  try {
    const status = req.query.status as string;
    const where: any = {};
    if (status) where.verificationStatus = status;

    const orgs = await prisma.organization.findMany({
      where,
      include: {
        _count: { select: { listings: true, members: true } },
        dealerProfile: true,
        members: {
          where: { role: 'owner' },
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 1,
        },
        subscriptions: {
          where: { status: 'active' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orgs });
  } catch (err) {
    next(err);
  }
});

// Organization detail
adminRouter.get('/organizations/:id', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        dealerProfile: true,
        members: {
          include: { user: { select: { id: true, name: true, email: true, roles: true } } },
        },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 },
        listings: { take: 10, orderBy: { createdAt: 'desc' }, include: { media: { take: 1 } } },
        _count: { select: { listings: true, members: true } },
      },
    });
    if (!org) throw new AppError(404, 'NOT_FOUND', 'ארגון לא נמצא');

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

// Approve/reject/suspend organization
adminRouter.post('/organizations/:id/action', async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) throw new AppError(404, 'NOT_FOUND', 'ארגון לא נמצא');

    const actionMap: Record<string, { verificationStatus: string; isActive?: boolean }> = {
      approve: { verificationStatus: 'verified' },
      reject: { verificationStatus: 'rejected' },
      suspend: { verificationStatus: 'rejected', isActive: false },
      reactivate: { verificationStatus: 'verified', isActive: true },
    };

    const update = actionMap[action];
    if (!update) throw new AppError(400, 'INVALID', 'פעולה לא תקינה');

    await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: update.verificationStatus,
        ...(update.isActive !== undefined ? { isActive: update.isActive } : {}),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `organization_${action}`,
        entityType: 'organization',
        entityId: org.id,
        metadata: { organizationName: org.name, reason },
      },
    });

    // Notify org owner
    const ownerMember = await prisma.organizationMember.findFirst({
      where: { organizationId: org.id, role: 'owner' },
    });
    if (ownerMember) {
      const titleMap: Record<string, string> = {
        approve: 'הארגון אושר',
        reject: 'הארגון נדחה',
        suspend: 'הארגון הושעה',
        reactivate: 'הארגון הופעל מחדש',
      };
      await prisma.notification.create({
        data: {
          userId: ownerMember.userId,
          type: 'organization_status',
          title: titleMap[action] || 'עדכון ארגון',
          body: reason ? `סיבה: ${reason}` : `הסטטוס של "${org.name}" עודכן.`,
          link: '/dashboard/dealer',
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Feature flags
adminRouter.get('/feature-flags', async (_req, res, next) => {
  try {
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: flags });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/feature-flags/:id', async (req, res, next) => {
  try {
    const { isEnabled } = req.body;
    const flag = await prisma.featureFlag.update({
      where: { id: req.params.id },
      data: { isEnabled },
    });
    res.json({ success: true, data: flag });
  } catch (err) {
    next(err);
  }
});

// Audit logs
adminRouter.get('/audit-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: { data: logs, total, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});
