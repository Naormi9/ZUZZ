import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn> };
  listingWatch: {
    upsert: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

let authToken: string;

beforeEach(() => {
  vi.clearAllMocks();
  authToken = generateToken(testUser);
});

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
// POST /api/listing-watches
// ---------------------------------------------------------------------------
describe('POST /api/listing-watches', () => {
  it('creates a watch on a listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      priceAmount: 150000,
      userId: 'other-user',
    });
    mockPrisma.listingWatch.count.mockResolvedValueOnce(0);
    mockPrisma.listingWatch.upsert.mockResolvedValueOnce({
      id: 'watch-1',
      userId: testUser.id,
      listingId: 'listing-1',
      priceAtWatch: 150000,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priceAtWatch).toBe(150000);
  });

  it('rejects watching own listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      priceAmount: 150000,
      userId: testUser.id,
    });

    const res = await request(app)
      .post('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID');
  });

  it('rejects when listing not found', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'nonexistent' });

    expect(res.status).toBe(404);
  });

  it('rejects when at watch limit', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      priceAmount: 150000,
      userId: 'other-user',
    });
    mockPrisma.listingWatch.count.mockResolvedValueOnce(50);

    const res = await request(app)
      .post('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LIMIT');
  });

  it('returns 400 without listingId', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/listing-watches
// ---------------------------------------------------------------------------
describe('GET /api/listing-watches', () => {
  it('returns watches with price drop info', async () => {
    mockAuthUser();

    mockPrisma.listingWatch.findMany.mockResolvedValueOnce([
      {
        id: 'watch-1',
        userId: testUser.id,
        listingId: 'listing-1',
        priceAtWatch: 200000,
        isActive: true,
        listing: {
          id: 'listing-1',
          title: 'Toyota Corolla',
          priceAmount: 180000,
          priceCurrency: 'ILS',
          status: 'active',
          media: [],
        },
      },
    ]);

    const res = await request(app)
      .get('/api/listing-watches')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].priceDrop).toBe(20000);
    expect(res.body.data[0].priceDropPercent).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/listing-watches/:listingId
// ---------------------------------------------------------------------------
describe('DELETE /api/listing-watches/:listingId', () => {
  it('unwatches a listing', async () => {
    mockAuthUser();

    mockPrisma.listingWatch.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app)
      .delete('/api/listing-watches/listing-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
