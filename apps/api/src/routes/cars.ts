import { Router } from 'express';
import { prisma } from '@zuzz/database';
import {
  carDetailsSchema,
  carSellerStatementsSchema,
  carPricingSchema,
  carSearchFiltersSchema,
} from '@zuzz/validation';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { serializeListingCard, serializeSearchResults } from '../serializers/listing';
import { computeAndPersistTrust } from '../lib/trust';

export const carsRouter = Router();

// Create car listing (multi-step wizard)
carsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    // Create draft listing + car details
    const listing = await prisma.listing.create({
      data: {
        userId: req.user!.id,
        vertical: 'cars',
        status: 'draft',
        title: '',
        priceAmount: 0,
        priceCurrency: 'ILS',
        carDetails: {
          create: {
            make: '',
            model: '',
            year: new Date().getFullYear(),
            mileage: 0,
            gearbox: 'automatic',
            fuelType: 'petrol',
            accidentDeclared: false,
            engineReplaced: false,
            gearboxReplaced: false,
            frameDamage: false,
            warrantyExists: false,
            personalImport: false,
            isElectric: false,
          },
        },
      },
      include: { carDetails: true },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
});

// Update car details (wizard step 1+2)
carsRouter.put('/:id/details', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { carDetails: true },
    });

    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const data = carDetailsSchema.parse(req.body);

    // Auto-generate title
    const title = `${data.make} ${data.model}${data.trim ? ' ' + data.trim : ''} ${data.year}`;

    await prisma.listing.update({
      where: { id: req.params.id },
      data: { title },
    });

    const carListing = await prisma.carListing.update({
      where: { listingId: req.params.id },
      data: {
        make: data.make,
        model: data.model,
        trim: data.trim,
        year: data.year,
        firstRegistrationDate: data.firstRegistrationDate
          ? new Date(data.firstRegistrationDate)
          : null,
        bodyType: data.bodyType,
        mileage: data.mileage,
        handCount: data.handCount,
        ownershipType: data.ownershipType,
        gearbox: data.gearbox,
        fuelType: data.fuelType,
        engineVolume: data.engineVolume,
        horsepower: data.horsepower,
        seats: data.seats,
        color: data.color,
        interiorColor: data.interiorColor,
        testUntil: data.testUntil ? new Date(data.testUntil) : null,
        isElectric: data.fuelType === 'electric',
      },
    });

    res.json({ success: true, data: carListing });
  } catch (err) {
    next(err);
  }
});

// Update seller statements (wizard step 3)
carsRouter.put('/:id/statements', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const data = carSellerStatementsSchema.parse(req.body);

    const carListing = await prisma.carListing.update({
      where: { listingId: req.params.id },
      data: {
        accidentDeclared: data.accidentDeclared,
        accidentDetails: data.accidentDetails,
        engineReplaced: data.engineReplaced,
        gearboxReplaced: data.gearboxReplaced,
        frameDamage: data.frameDamage,
        maintenanceHistory: data.maintenanceHistory,
        numKeys: data.numKeys,
        warrantyExists: data.warrantyExists,
        warrantyDetails: data.warrantyDetails,
        recallStatus: data.recallStatus,
        personalImport: data.personalImport,
      },
    });

    res.json({ success: true, data: carListing });
  } catch (err) {
    next(err);
  }
});

// Update pricing (wizard step 4)
carsRouter.put('/:id/pricing', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const data = carPricingSchema.parse(req.body);

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        priceAmount: data.price.amount,
        priceCurrency: data.price.currency,
        isNegotiable: data.isNegotiable,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Update location (part of wizard)
carsRouter.put('/:id/location', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const { city, region } = req.body;
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new AppError(400, 'INVALID', 'עיר נדרשת');
    }
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { city: city.trim(), region: region?.trim() || null },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Publish car listing (wizard step 7)
carsRouter.post('/:id/publish', authenticate, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { carDetails: true, media: true },
    });

    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    if (!listing.carDetails?.make || !listing.carDetails?.model) {
      throw new AppError(400, 'INCOMPLETE', 'יש להשלים את פרטי הרכב');
    }
    if (listing.priceAmount <= 0) {
      throw new AppError(400, 'INCOMPLETE', 'יש להזין מחיר');
    }
    if (!listing.city) {
      throw new AppError(400, 'INCOMPLETE', 'יש להזין מיקום');
    }

    // Publish the listing first
    await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        status: 'active',
        moderationStatus: 'pending', // Goes live immediately but flagged for async moderation review
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Compute trust score, completeness, and persist factors via the trust engine
    await computeAndPersistTrust(req.params.id!);

    const updated = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { carDetails: true, media: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Get featured/recent cars for landing page
carsRouter.get('/featured', async (_req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        vertical: 'cars',
        status: 'active',
      },
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        carDetails: true,
        trustFactors: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { isPromoted: 'desc' }, { publishedAt: 'desc' }],
      take: 8,
    });

    res.json({ success: true, data: listings.map(serializeListingCard) });
  } catch (err) {
    next(err);
  }
});

// Search cars
carsRouter.get('/search', optionalAuth, async (req, res, next) => {
  try {
    // Normalize query params: accept both single values and arrays
    const query: Record<string, any> = { ...req.query };
    // Map frontend param names to backend schema names
    if (query.maxMileage && !query.mileageTo) query.mileageTo = query.maxMileage;
    if (query.maxHand && !query.handCountMax) query.handCountMax = query.maxHand;
    if (query.evOnly === 'true' && !query.isElectric) query.isElectric = 'true';
    // Ensure array fields accept single values
    [
      'make',
      'model',
      'fuelType',
      'gearbox',
      'bodyType',
      'color',
      'sellerType',
      'city',
      'region',
    ].forEach((key) => {
      if (query[key] && typeof query[key] === 'string') {
        query[key] = [query[key]];
      }
    });

    const filters = carSearchFiltersSchema.parse(query);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    // Map sort string to sortBy/sortOrder
    const sortParam = (req.query.sort as string) || '';
    let sortBy = (req.query.sortBy as string) || 'createdAt';
    let sortOrder = (req.query.sortOrder as string) || 'desc';
    if (sortParam) {
      const sortMap: Record<string, [string, string]> = {
        price_asc: ['price', 'asc'],
        price_desc: ['price', 'desc'],
        year_desc: ['year', 'desc'],
        year_asc: ['year', 'asc'],
        mileage_asc: ['mileage', 'asc'],
        mileage_desc: ['mileage', 'desc'],
        trust_desc: ['trustScore', 'desc'],
        newest: ['createdAt', 'desc'],
      };
      if (sortMap[sortParam]) {
        [sortBy, sortOrder] = sortMap[sortParam];
      }
    }

    const where: any = {
      vertical: 'cars',
      status: 'active',
    };

    // Apply filters
    if (filters.city?.length) where.city = { in: filters.city };
    if (filters.region?.length) where.region = { in: filters.region };
    if (filters.priceFrom || filters.priceTo) {
      where.priceAmount = {};
      if (filters.priceFrom) where.priceAmount.gte = filters.priceFrom;
      if (filters.priceTo) where.priceAmount.lte = filters.priceTo;
    }
    if (filters.trustScoreMin) where.trustScore = { gte: filters.trustScoreMin };
    if (filters.verifiedSeller) {
      where.trustFactors = {
        some: { type: { in: ['verified_owner', 'verified_dealer'] }, status: 'positive' },
      };
    }

    // Car-specific filters
    const carWhere: any = {};
    if (filters.make?.length) carWhere.make = { in: filters.make };
    if (filters.model?.length) carWhere.model = { in: filters.model };
    if (filters.yearFrom || filters.yearTo) {
      carWhere.year = {};
      if (filters.yearFrom) carWhere.year.gte = filters.yearFrom;
      if (filters.yearTo) carWhere.year.lte = filters.yearTo;
    }
    if (filters.mileageFrom || filters.mileageTo) {
      carWhere.mileage = {};
      if (filters.mileageFrom) carWhere.mileage.gte = filters.mileageFrom;
      if (filters.mileageTo) carWhere.mileage.lte = filters.mileageTo;
    }
    if (filters.fuelType?.length) carWhere.fuelType = { in: filters.fuelType };
    if (filters.gearbox?.length) carWhere.gearbox = { in: filters.gearbox };
    if (filters.handCountMax) carWhere.handCount = { lte: filters.handCountMax };
    if (filters.bodyType?.length) carWhere.bodyType = { in: filters.bodyType };
    if (filters.color?.length) carWhere.color = { in: filters.color };
    if (filters.sellerType?.length) carWhere.sellerType = { in: filters.sellerType };
    if (filters.isElectric) carWhere.isElectric = true;
    if (filters.noAccidents) carWhere.accidentDeclared = false;
    if (filters.hasTest) carWhere.testUntil = { gt: new Date() };

    if (Object.keys(carWhere).length > 0) {
      where.carDetails = carWhere;
    }

    // Sort mapping
    const orderBy: any = {};
    if (sortBy === 'price') orderBy.priceAmount = sortOrder;
    else if (sortBy === 'year') orderBy.carDetails = { year: sortOrder };
    else if (sortBy === 'mileage') orderBy.carDetails = { mileage: sortOrder };
    else if (sortBy === 'trustScore') orderBy.trustScore = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { take: 1, orderBy: { order: 'asc' } },
          carDetails: true,
          trustFactors: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: [{ isPromoted: 'desc' }, { isFeatured: 'desc' }, orderBy],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    // Facets
    const facets = await Promise.all([
      prisma.carListing.groupBy({
        by: ['make'],
        _count: { make: true },
        orderBy: { _count: { make: 'desc' } },
        take: 20,
      }),
      prisma.carListing.groupBy({ by: ['fuelType'], _count: { fuelType: true } }),
      prisma.carListing.groupBy({ by: ['gearbox'], _count: { gearbox: true } }),
      prisma.carListing.groupBy({
        by: ['bodyType'],
        _count: { bodyType: true },
        where: { bodyType: { not: null } },
      }),
    ]);

    res.json({
      success: true,
      data: serializeSearchResults(listings, { total, page, pageSize }, [
        {
          field: 'make',
          label: 'יצרן',
          values: facets[0].map((f: any) => ({ value: f.make, label: f.make, count: f._count.make })),
        },
        {
          field: 'fuelType',
          label: 'סוג דלק',
          values: facets[1].map((f: any) => ({
            value: f.fuelType,
            label: f.fuelType,
            count: f._count.fuelType,
          })),
        },
        {
          field: 'gearbox',
          label: 'תיבת הילוכים',
          values: facets[2].map((f: any) => ({
            value: f.gearbox,
            label: f.gearbox,
            count: f._count.gearbox,
          })),
        },
        {
          field: 'bodyType',
          label: 'סוג מרכב',
          values: facets[3]
            .filter((f: any) => f.bodyType)
            .map((f: any) => ({ value: f.bodyType!, label: f.bodyType!, count: f._count.bodyType })),
        },
      ]),
    });
  } catch (err) {
    next(err);
  }
});

// Get car makes and models
carsRouter.get('/makes', async (_req, res, next) => {
  try {
    const makes = await prisma.carListing.groupBy({
      by: ['make'],
      _count: { make: true },
      orderBy: { _count: { make: 'desc' } },
    });

    res.json({
      success: true,
      data: makes.map((m: any) => ({ make: m.make, count: m._count.make })),
    });
  } catch (err) {
    next(err);
  }
});

carsRouter.get('/models/:make', async (req, res, next) => {
  try {
    const models = await prisma.carListing.groupBy({
      by: ['model'],
      where: { make: req.params.make },
      _count: { model: true },
      orderBy: { _count: { model: 'desc' } },
    });

    res.json({
      success: true,
      data: models.map((m: any) => ({ model: m.model, count: m._count.model })),
    });
  } catch (err) {
    next(err);
  }
});

// Get similar cars
carsRouter.get('/:id/similar', async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { carDetails: true },
    });

    if (!listing?.carDetails) {
      return res.json({ success: true, data: [] });
    }

    const car = listing.carDetails;
    const similar = await prisma.listing.findMany({
      where: {
        id: { not: listing.id },
        vertical: 'cars',
        status: 'active',
        carDetails: {
          OR: [
            { make: car.make, model: car.model },
            { make: car.make, year: { gte: car.year - 2, lte: car.year + 2 } },
          ],
        },
      },
      include: {
        media: { take: 1, orderBy: { order: 'asc' } },
        carDetails: true,
        trustFactors: true,
        user: { select: { id: true, name: true } },
      },
      take: 6,
      orderBy: { trustScore: 'desc' },
    });

    res.json({ success: true, data: similar.map(serializeListingCard) });
  } catch (err) {
    next(err);
  }
});

// Vehicle lookup by license plate (mock)
carsRouter.get('/lookup/:plate', async (req, res, next) => {
  try {
    // TODO: Integrate with real Israeli vehicle registry API
    // For now, return mock data for development
    const plate = req.params.plate.replace(/-/g, '');

    // Mock response
    const mockVehicles: Record<string, any> = {
      '1234567': {
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        engineVolume: 1800,
        fuelType: 'hybrid',
        gearbox: 'automatic',
        color: 'לבן',
        bodyType: 'sedan',
        seats: 5,
        testUntil: '2025-12-01',
        ownershipType: 'private',
      },
      '7654321': {
        make: 'Tesla',
        model: 'Model Y',
        year: 2024,
        fuelType: 'electric',
        gearbox: 'automatic',
        color: 'שחור',
        bodyType: 'suv',
        seats: 5,
        testUntil: '2027-06-01',
        ownershipType: 'private',
        isElectric: true,
        batteryCapacity: 75,
        rangeKm: 533,
      },
    };

    const vehicle = mockVehicles[plate];
    if (vehicle) {
      res.json({ success: true, data: vehicle });
    } else {
      res.json({
        success: true,
        data: null,
        message: 'רכב לא נמצא. ניתן להזין פרטים ידנית.',
      });
    }
  } catch (err) {
    next(err);
  }
});
