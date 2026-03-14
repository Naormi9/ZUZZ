import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser, testAdmin } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  organizationMember: { findUnique: ReturnType<typeof vi.fn> };
  promotion: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

let authToken: string;

beforeEach(() => {
  vi.clearAllMocks();
  authToken = generateToken(testUser);
});

function mockAuthUser(user = testUser) {
  mockPrisma.user.findUnique.mockResolvedValueOnce({
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    isActive: true,
  });
}

// ---------------------------------------------------------------------------
// POST /api/promotions — Create promotion
// ---------------------------------------------------------------------------
describe('POST /api/promotions', () => {
  it('creates a promotion for own listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      organizationId: null,
    });
    mockPrisma.promotion.create.mockResolvedValueOnce({
      id: 'promo-1',
      listingId: 'listing-1',
      userId: testUser.id,
      type: 'boost',
      isActive: true,
      amount: 2900,
    });
    mockPrisma.listing.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'boost', durationDays: 7 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('boost');
    expect(mockPrisma.promotion.create).toHaveBeenCalledOnce();
  });

  it('returns 403 for non-owner listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'other-user',
      organizationId: null,
    });

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'boost' });

    expect(res.status).toBe(403);
  });

  it('allows org member to promote org listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'other-user',
      organizationId: 'org-1',
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
      userId: testUser.id,
      role: 'member',
    });
    mockPrisma.promotion.create.mockResolvedValueOnce({
      id: 'promo-2',
      listingId: 'listing-1',
      type: 'highlight',
      isActive: true,
    });
    mockPrisma.listing.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'highlight' });

    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid promotion type', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// GET /api/promotions/my — My promotions
// ---------------------------------------------------------------------------
describe('GET /api/promotions/my', () => {
  it('returns user promotions', async () => {
    mockAuthUser();

    mockPrisma.promotion.findMany.mockResolvedValueOnce([
      {
        id: 'promo-1',
        type: 'boost',
        isActive: true,
        listing: { id: 'l1', title: 'My Car', status: 'active' },
      },
    ]);

    const res = await request(app)
      .get('/api/promotions/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('boost');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/promotions/:id/cancel — Cancel promotion
// ---------------------------------------------------------------------------
describe('PATCH /api/promotions/:id/cancel', () => {
  it('cancels own promotion', async () => {
    mockAuthUser();

    mockPrisma.promotion.findUnique.mockResolvedValueOnce({
      id: 'promo-1',
      userId: testUser.id,
      listingId: 'listing-1',
      isActive: true,
    });
    mockPrisma.promotion.update.mockResolvedValueOnce({});
    mockPrisma.promotion.count.mockResolvedValueOnce(0); // no remaining active
    mockPrisma.listing.update.mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/api/promotions/promo-1/cancel')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.promotion.update).toHaveBeenCalledOnce();
  });

  it('returns 403 for another user promotion', async () => {
    mockAuthUser();

    mockPrisma.promotion.findUnique.mockResolvedValueOnce({
      id: 'promo-1',
      userId: 'other-user',
      isActive: true,
    });

    const res = await request(app)
      .patch('/api/promotions/promo-1/cancel')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});
