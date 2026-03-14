import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  carListing: {
    update: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
  trustFactor: {
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
};

let authToken: string;

beforeEach(() => {
  vi.clearAllMocks();
  authToken = generateToken(testUser);
});

/**
 * Helper: mock the authenticate middleware's user lookup.
 */
function mockAuthUser() {
  mockPrisma.user.findUnique.mockResolvedValueOnce({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
    roles: testUser.roles,
    isActive: true,
  });
}

// ---------------------------------------------------------------------------
// POST /api/cars — Create draft listing
// ---------------------------------------------------------------------------
describe('POST /api/cars', () => {
  it('creates a draft car listing and returns 201', async () => {
    mockAuthUser();

    const draftListing = {
      id: 'listing-1',
      userId: testUser.id,
      vertical: 'cars',
      status: 'draft',
      title: '',
      priceAmount: 0,
      priceCurrency: 'ILS',
      carDetails: {
        id: 'car-1',
        make: '',
        model: '',
        year: 2026,
        mileage: 0,
      },
    };

    mockPrisma.listing.create.mockResolvedValueOnce(draftListing);

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.vertical).toBe('cars');
    expect(res.body.data.carDetails).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/cars');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/cars/:id/details — Update car details
// ---------------------------------------------------------------------------
describe('PUT /api/cars/:id/details', () => {
  const validDetails = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2022,
    mileage: 50000,
    handCount: 2,
    ownershipType: 'private',
    gearbox: 'automatic',
    fuelType: 'petrol',
  };

  it('updates car details when user owns the listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      carDetails: { id: 'car-1' },
    });
    mockPrisma.listing.update.mockResolvedValueOnce({});
    mockPrisma.carListing.update.mockResolvedValueOnce({
      id: 'car-1',
      make: 'Toyota',
      model: 'Corolla',
      year: 2022,
    });

    const res = await request(app)
      .put('/api/cars/listing-1/details')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validDetails);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.listing.update).toHaveBeenCalledOnce();
    expect(mockPrisma.carListing.update).toHaveBeenCalledOnce();
  });

  it('returns 404 when listing does not exist', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/cars/nonexistent/details')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validDetails);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when user does not own the listing', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'other-user-id',
      carDetails: { id: 'car-1' },
    });

    const res = await request(app)
      .put('/api/cars/listing-1/details')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validDetails);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid details (missing required fields)', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      carDetails: { id: 'car-1' },
    });

    const res = await request(app)
      .put('/api/cars/listing-1/details')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ make: 'Toyota' }); // missing model, year, etc.

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .put('/api/cars/listing-1/details')
      .send(validDetails);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/cars/:id/statements — Update seller statements
// ---------------------------------------------------------------------------
describe('PUT /api/cars/:id/statements', () => {
  const validStatements = {
    accidentDeclared: false,
    engineReplaced: false,
    gearboxReplaced: false,
    frameDamage: false,
    warrantyExists: true,
    warrantyDetails: 'Factory warranty until 2027',
    personalImport: false,
  };

  it('updates seller statements for owned listing', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });
    mockPrisma.carListing.update.mockResolvedValueOnce({
      id: 'car-1',
      ...validStatements,
    });

    const res = await request(app)
      .put('/api/cars/listing-1/statements')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validStatements);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.carListing.update).toHaveBeenCalledOnce();
  });

  it('returns 404 when listing not found or not owned', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/cars/nonexistent/statements')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validStatements);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid statements (missing booleans)', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .put('/api/cars/listing-1/statements')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accidentDeclared: false }); // missing required boolean fields

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/cars/:id/pricing — Update pricing
// ---------------------------------------------------------------------------
describe('PUT /api/cars/:id/pricing', () => {
  const validPricing = {
    price: { amount: 120000, currency: 'ILS' },
    isNegotiable: true,
  };

  it('updates pricing for owned listing', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });
    mockPrisma.listing.update.mockResolvedValueOnce({
      id: 'listing-1',
      priceAmount: 120000,
      priceCurrency: 'ILS',
      isNegotiable: true,
    });

    const res = await request(app)
      .put('/api/cars/listing-1/pricing')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validPricing);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when listing not owned by user', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'someone-else',
    });

    const res = await request(app)
      .put('/api/cars/listing-1/pricing')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validPricing);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for price below minimum (1000)', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .put('/api/cars/listing-1/pricing')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ price: { amount: 500, currency: 'ILS' }, isNegotiable: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .put('/api/cars/listing-1/pricing')
      .send(validPricing);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/cars/:id/publish — Publish listing
// ---------------------------------------------------------------------------
describe('POST /api/cars/:id/publish', () => {
  it('publishes a complete listing', async () => {
    mockAuthUser();

    const completeListing = {
      id: 'listing-1',
      userId: testUser.id,
      status: 'draft',
      priceAmount: 100000,
      city: 'Tel Aviv',
      carDetails: { make: 'Toyota', model: 'Corolla' },
      media: [{ id: 'media-1' }],
    };

    mockPrisma.listing.findUnique
      .mockResolvedValueOnce(completeListing) // ownership check
      .mockResolvedValueOnce({ ...completeListing, status: 'active' }); // final read after publish
    mockPrisma.listing.update.mockResolvedValue({});
    mockPrisma.trustFactor.deleteMany.mockResolvedValueOnce({});
    mockPrisma.trustFactor.createMany.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/cars/listing-1/publish')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when car details are incomplete (no make/model)', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      priceAmount: 100000,
      city: 'Tel Aviv',
      carDetails: { make: '', model: '' }, // incomplete
      media: [],
    });

    const res = await request(app)
      .post('/api/cars/listing-1/publish')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INCOMPLETE');
  });

  it('returns 400 when price is zero', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      priceAmount: 0,
      city: 'Tel Aviv',
      carDetails: { make: 'Toyota', model: 'Corolla' },
      media: [],
    });

    const res = await request(app)
      .post('/api/cars/listing-1/publish')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INCOMPLETE');
  });

  it('returns 400 when city is missing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      priceAmount: 100000,
      city: null,
      carDetails: { make: 'Toyota', model: 'Corolla' },
      media: [],
    });

    const res = await request(app)
      .post('/api/cars/listing-1/publish')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INCOMPLETE');
  });

  it('returns 404 when listing not found', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/cars/nonexistent/publish')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// GET /api/cars/search — Search with filters
// ---------------------------------------------------------------------------
describe('GET /api/cars/search', () => {
  const now = new Date();

  function mockSearchResults(listings: any[] = [], total = 0) {
    mockPrisma.listing.findMany.mockResolvedValueOnce(listings);
    mockPrisma.listing.count.mockResolvedValueOnce(total);
    // 4 groupBy calls for facets
    mockPrisma.carListing.groupBy
      .mockResolvedValueOnce([]) // makes
      .mockResolvedValueOnce([]) // fuelType
      .mockResolvedValueOnce([]) // gearbox
      .mockResolvedValueOnce([]); // bodyType
  }

  it('returns search results with pagination', async () => {
    const listings = [
      {
        id: 'listing-1',
        title: 'Toyota Corolla 2022',
        priceAmount: 100000,
        priceCurrency: 'ILS',
        isNegotiable: false,
        status: 'active',
        vertical: 'cars',
        city: 'Tel Aviv',
        region: 'Center',
        trustScore: 80,
        completenessScore: 90,
        isFeatured: false,
        isPromoted: false,
        createdAt: now,
        publishedAt: now,
        viewCount: 10,
        favoriteCount: 2,
        description: null,
        media: [],
        carDetails: {
          make: 'Toyota',
          model: 'Corolla',
          trim: null,
          year: 2022,
          mileage: 50000,
          handCount: 2,
          gearbox: 'automatic',
          fuelType: 'petrol',
          engineVolume: 1800,
          horsepower: 140,
          seats: 5,
          color: 'white',
          bodyType: 'sedan',
          isElectric: false,
          sellerType: null,
        },
        trustFactors: [],
        user: { id: 'user-1', name: 'Test' },
      },
    ];

    mockSearchResults(listings, 1);

    const res = await request(app).get('/api/cars/search');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.totalPages).toBe(1);
    expect(res.body.data.hasMore).toBe(false);
    expect(res.body.data.facets).toBeDefined();
  });

  it('returns empty results when no listings match', async () => {
    mockSearchResults([], 0);

    const res = await request(app).get('/api/cars/search?make=NonExistent');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('passes filter parameters to Prisma query', async () => {
    mockSearchResults([], 0);

    await request(app).get('/api/cars/search?make=Toyota&yearFrom=2020&priceTo=200000');

    // Verify that listing.findMany was called with where clause containing car filters
    const findManyCall = mockPrisma.listing.findMany.mock.calls[0]?.[0];
    expect(findManyCall.where.vertical).toBe('cars');
    expect(findManyCall.where.status).toBe('active');
    expect(findManyCall.where.priceAmount.lte).toBe(200000);
    expect(findManyCall.where.carDetails.make.in).toContain('Toyota');
    expect(findManyCall.where.carDetails.year.gte).toBe(2020);
  });

  it('supports pagination parameters', async () => {
    mockSearchResults([], 0);

    await request(app).get('/api/cars/search?page=2&pageSize=10');

    const findManyCall = mockPrisma.listing.findMany.mock.calls[0]?.[0];
    expect(findManyCall.skip).toBe(10); // (page 2 - 1) * 10
    expect(findManyCall.take).toBe(10);
  });

  it('caps pageSize at 50', async () => {
    mockSearchResults([], 0);

    await request(app).get('/api/cars/search?pageSize=100');

    const findManyCall = mockPrisma.listing.findMany.mock.calls[0]?.[0];
    expect(findManyCall.take).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// GET /api/cars/featured — Featured listings
// ---------------------------------------------------------------------------
describe('GET /api/cars/featured', () => {
  it('returns featured car listings', async () => {
    const now = new Date();
    const listings = [
      {
        id: 'listing-1',
        title: 'Toyota Corolla 2022',
        priceAmount: 100000,
        priceCurrency: 'ILS',
        isNegotiable: false,
        status: 'active',
        vertical: 'cars',
        city: 'Tel Aviv',
        region: 'Center',
        trustScore: 85,
        completenessScore: 90,
        isFeatured: true,
        isPromoted: false,
        createdAt: now,
        publishedAt: now,
        viewCount: 100,
        favoriteCount: 15,
        description: null,
        media: [{ id: 'm1', url: '/uploads/img.jpg', thumbnailUrl: '/uploads/img.jpg', type: 'image', order: 0 }],
        carDetails: {
          make: 'Toyota', model: 'Corolla', trim: null,
          year: 2022, mileage: 30000, handCount: 1,
          gearbox: 'automatic', fuelType: 'petrol',
          engineVolume: 1800, horsepower: 140,
          seats: 5, color: 'white', bodyType: 'sedan',
          isElectric: false, sellerType: null,
        },
        trustFactors: [],
        user: { id: 'user-1', name: 'Seller' },
      },
    ];

    mockPrisma.listing.findMany.mockResolvedValueOnce(listings);

    const res = await request(app).get('/api/cars/featured');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('listing-1');
    expect(res.body.data[0].car).toBeDefined();
    expect(res.body.data[0].car.make).toBe('Toyota');
    expect(res.body.data[0].media).toHaveLength(1);
  });

  it('returns empty array when no featured listings exist', async () => {
    mockPrisma.listing.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/cars/featured');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('does not require authentication', async () => {
    mockPrisma.listing.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/cars/featured');

    expect(res.status).toBe(200);
  });
});
