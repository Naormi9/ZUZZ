import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { z } from 'zod';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { notifyUser } from '../lib/push';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:growth');

export const growthRouter = Router();

// ═══════════════════════════════════════
// SAVED SEARCHES WITH ALERTS
// ═══════════════════════════════════════

const savedSearchSchema = z.object({
  vertical: z.enum(['cars', 'homes', 'market']),
  name: z.string().max(100).optional(),
  filters: z.record(z.unknown()),
  alertEnabled: z.boolean().default(false),
  alertFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
});

// Update saved search (enable/disable alerts)
growthRouter.patch('/saved-searches/:id', authenticate, async (req, res, next) => {
  try {
    const search = await prisma.savedSearch.findUnique({ where: { id: req.params.id } });
    if (!search || search.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'חיפוש שמור לא נמצא');
    }

    const { alertEnabled, alertFrequency, name } = req.body;
    const updated = await prisma.savedSearch.update({
      where: { id: req.params.id },
      data: {
        ...(alertEnabled !== undefined ? { alertEnabled } : {}),
        ...(alertFrequency ? { alertFrequency } : {}),
        ...(name !== undefined ? { name } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// PRICE ALERTS
// ═══════════════════════════════════════

// Subscribe to price alerts for a listing (via favorites)
growthRouter.post('/price-alerts/:listingId', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.listingId },
      select: { id: true, priceAmount: true },
    });

    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    // Ensure listing is in favorites
    await prisma.favorite.upsert({
      where: {
        userId_listingId: { userId: req.user!.id, listingId: listing.id },
      },
      create: { userId: req.user!.id, listingId: listing.id },
      update: {},
    });

    res.json({ success: true, message: 'מעקב מחיר הופעל' });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// RECENTLY VIEWED
// ═══════════════════════════════════════

growthRouter.post('/recently-viewed/:listingId', authenticate, async (req, res, next) => {
  try {
    await prisma.recentlyViewed.upsert({
      where: {
        userId_listingId: { userId: req.user!.id, listingId: req.params.listingId },
      },
      create: { userId: req.user!.id, listingId: req.params.listingId },
      update: { viewedAt: new Date() },
    });

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        type: 'listing_view',
        userId: req.user!.id,
        properties: { listingId: req.params.listingId } as any,
        source: req.body.source || 'web',
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════

// Similar listings
growthRouter.get('/recommendations/similar/:listingId', optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.listingId },
      include: { carDetails: true, propertyDetails: true },
    });

    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    const where: any = {
      id: { not: listing.id },
      vertical: listing.vertical,
      status: 'active',
    };

    // For cars: same make, similar price range
    if (listing.vertical === 'cars' && listing.carDetails) {
      where.carDetails = { make: listing.carDetails.make };
      where.priceAmount = {
        gte: Math.round(listing.priceAmount * 0.7),
        lte: Math.round(listing.priceAmount * 1.3),
      };
    }

    // For homes: same city, similar size
    if (listing.vertical === 'homes' && listing.propertyDetails) {
      if (listing.city) where.city = listing.city;
      where.priceAmount = {
        gte: Math.round(listing.priceAmount * 0.7),
        lte: Math.round(listing.priceAmount * 1.3),
      };
    }

    // For market: same region, similar price
    if (listing.vertical === 'market') {
      if (listing.city) where.city = listing.city;
    }

    const similar = await prisma.listing.findMany({
      where,
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        carDetails: true,
        propertyDetails: true,
        marketDetails: true,
      },
      orderBy: [{ isPromoted: 'desc' }, { trustScore: 'desc' }],
      take: 8,
    });

    res.json({ success: true, data: similar });
  } catch (err) {
    next(err);
  }
});

// Popular listings
growthRouter.get('/recommendations/popular', optionalAuth, async (req, res, next) => {
  try {
    const vertical = req.query.vertical as string;

    const where: any = { status: 'active' };
    if (vertical && ['cars', 'homes', 'market'].includes(vertical)) {
      where.vertical = vertical;
    }

    const popular = await prisma.listing.findMany({
      where,
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        carDetails: true,
        propertyDetails: true,
        marketDetails: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ isPromoted: 'desc' }, { viewCount: 'desc' }, { favoriteCount: 'desc' }],
      take: 12,
    });

    res.json({ success: true, data: popular });
  } catch (err) {
    next(err);
  }
});

// Personalized recommendations
growthRouter.get('/recommendations/for-you', authenticate, async (req, res, next) => {
  try {
    // Based on recently viewed and favorites
    const [recentViews, favorites] = await Promise.all([
      prisma.recentlyViewed.findMany({
        where: { userId: req.user!.id },
        include: { listing: { select: { vertical: true, city: true, priceAmount: true } } },
        orderBy: { viewedAt: 'desc' },
        take: 10,
      }),
      prisma.favorite.findMany({
        where: { userId: req.user!.id },
        include: { listing: { select: { vertical: true, city: true, priceAmount: true } } },
        take: 10,
      }),
    ]);

    // Extract patterns
    const viewedListingIds = recentViews.map((r: any) => r.listingId);
    const favListingIds = favorites.map((f: any) => f.listingId);
    const excludeIds = [...new Set([...viewedListingIds, ...favListingIds])];

    // Get most common vertical and city
    const verticals = [...recentViews.map((r: any) => r.listing.vertical), ...favorites.map((f: any) => f.listing.vertical)];
    const cities = [...recentViews.map((r: any) => r.listing.city), ...favorites.map((f: any) => f.listing.city)].filter(Boolean);

    const topVertical = getMostCommon(verticals);
    const topCity = getMostCommon(cities as string[]);

    const where: any = {
      status: 'active',
      id: { notIn: excludeIds },
    };
    if (topVertical) where.vertical = topVertical;
    if (topCity) where.city = topCity;

    const recommended = await prisma.listing.findMany({
      where,
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        carDetails: true,
        propertyDetails: true,
        marketDetails: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ isPromoted: 'desc' }, { trustScore: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });

    res.json({ success: true, data: recommended });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// EMAIL DIGEST PREFERENCES
// ═══════════════════════════════════════

growthRouter.get('/digest-preferences', authenticate, async (req, res, next) => {
  try {
    let prefs = await prisma.emailDigestPreference.findUnique({
      where: { userId: req.user!.id },
    });

    if (!prefs) {
      prefs = await prisma.emailDigestPreference.create({
        data: { userId: req.user!.id },
      });
    }

    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

growthRouter.patch('/digest-preferences', authenticate, async (req, res, next) => {
  try {
    const { weeklyDigest, savedSearchAlerts, priceAlerts } = req.body;

    const prefs = await prisma.emailDigestPreference.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        weeklyDigest: weeklyDigest ?? true,
        savedSearchAlerts: savedSearchAlerts ?? true,
        priceAlerts: priceAlerts ?? true,
      },
      update: {
        ...(weeklyDigest !== undefined ? { weeklyDigest } : {}),
        ...(savedSearchAlerts !== undefined ? { savedSearchAlerts } : {}),
        ...(priceAlerts !== undefined ? { priceAlerts } : {}),
      },
    });

    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// ANALYTICS EVENTS
// ═══════════════════════════════════════

const trackSchema = z.object({
  type: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  source: z.enum(['web', 'mobile', 'admin']).optional(),
});

growthRouter.post('/track', optionalAuth, async (req, res, next) => {
  try {
    const { type, properties, source } = trackSchema.parse(req.body);

    await prisma.analyticsEvent.create({
      data: {
        type,
        userId: req.user?.id,
        properties: (properties || {}) as any,
        source: source || 'web',
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// ADMIN: GROWTH METRICS
// ═══════════════════════════════════════

growthRouter.get(
  '/admin/metrics',
  authenticate,
  requireRole('admin', 'moderator'),
  async (req, res, next) => {
    try {
      const period = (req.query.period as string) || 'week';
      const now = new Date();
      let since: Date;

      if (period === 'day') since = new Date(now.getTime() - 86400000);
      else if (period === 'month') since = new Date(now.getTime() - 30 * 86400000);
      else since = new Date(now.getTime() - 7 * 86400000);

      const [
        newUsers,
        newListings,
        totalViews,
        totalFavorites,
        totalLeads,
        totalMessages,
        savedSearches,
        activePromotions,
        revenue,
        conversionEvents,
      ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.listing.count({ where: { createdAt: { gte: since } } }),
        prisma.analyticsEvent.count({ where: { type: 'listing_view', createdAt: { gte: since } } }),
        prisma.favorite.count({ where: { createdAt: { gte: since } } }),
        prisma.lead.count({ where: { createdAt: { gte: since } } }),
        prisma.message.count({ where: { createdAt: { gte: since } } }),
        prisma.savedSearch.count({ where: { alertEnabled: true } }),
        prisma.promotion.count({ where: { isActive: true } }),
        prisma.payment.aggregate({
          where: { status: 'completed', createdAt: { gte: since } },
          _sum: { amount: true },
        }),
        prisma.analyticsEvent.groupBy({
          by: ['type'],
          where: {
            type: { in: ['listing_view', 'lead_created', 'message_sent', 'favorite_added', 'phone_revealed'] },
            createdAt: { gte: since },
          },
          _count: true,
        }),
      ]);

      const conversions: Record<string, number> = {};
      for (const e of conversionEvents) {
        conversions[e.type] = e._count;
      }

      res.json({
        success: true,
        data: {
          period,
          newUsers,
          newListings,
          totalViews,
          totalFavorites,
          totalLeads,
          totalMessages,
          savedSearches,
          activePromotions,
          revenue: revenue._sum.amount || 0,
          conversions,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ═══════════════════════════════════════
// CRON: SAVED SEARCH MATCHING
// ═══════════════════════════════════════

/**
 * Process saved search alerts.
 * In production, call this via a cron job: POST /api/growth/cron/saved-search-alerts
 */
growthRouter.post(
  '/cron/saved-search-alerts',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const searches = await prisma.savedSearch.findMany({
        where: {
          alertEnabled: true,
          alertFrequency: { in: ['instant', 'daily'] },
        },
        include: { user: { select: { id: true, name: true } } },
      });

      let notified = 0;

      for (const search of searches) {
        const filters = search.filters as any;
        const since = search.lastAlertAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

        const where: any = {
          vertical: search.vertical,
          status: 'active',
          publishedAt: { gte: since },
        };

        // Apply basic filters
        if (filters.city) where.city = filters.city;
        if (filters.minPrice) where.priceAmount = { ...where.priceAmount, gte: filters.minPrice };
        if (filters.maxPrice) where.priceAmount = { ...where.priceAmount, lte: filters.maxPrice };

        const matchCount = await prisma.listing.count({ where });

        if (matchCount > 0) {
          await notifyUser(
            search.userId,
            'saved_search_match',
            'מודעות חדשות תואמות',
            `נמצאו ${matchCount} מודעות חדשות שתואמות לחיפוש "${search.name || 'חיפוש שמור'}"`,
            `/search?${new URLSearchParams(filters).toString()}`,
          );

          await prisma.savedSearch.update({
            where: { id: search.id },
            data: { lastAlertAt: new Date() },
          });

          notified++;
        }
      }

      logger.info({ processed: searches.length, notified }, 'Saved search alerts processed');
      res.json({ success: true, data: { processed: searches.length, notified } });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Process price change alerts.
 * Call via cron: POST /api/growth/cron/price-alerts
 */
growthRouter.post(
  '/cron/price-alerts',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      // Find un-notified price alerts
      const alerts = await prisma.priceAlert.findMany({
        where: { notified: false },
        include: {
          listing: { select: { id: true, title: true } },
          user: { select: { id: true } },
        },
        take: 100,
      });

      for (const alert of alerts) {
        const direction = alert.newPrice < alert.oldPrice ? 'ירד' : 'עלה';
        const diff = Math.abs(alert.newPrice - alert.oldPrice);

        await notifyUser(
          alert.userId,
          'price_alert',
          `מחיר ${direction}`,
          `המחיר של "${alert.listing.title}" ${direction} ב-₪${(diff / 100).toLocaleString()}`,
          `/listings/${alert.listingId}`,
          { listingId: alert.listingId },
        );

        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { notified: true },
        });
      }

      res.json({ success: true, data: { processed: alerts.length } });
    } catch (err) {
      next(err);
    }
  },
);

// ── Helpers ───────────────────────────────────────────────────────

function getMostCommon<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let max = 0;
  let result: T | null = null;
  for (const [item, count] of counts) {
    if (count > max) {
      max = count;
      result = item;
    }
  }
  return result;
}
