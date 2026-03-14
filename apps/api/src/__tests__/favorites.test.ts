import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { update: ReturnType<typeof vi.fn> };
  favorite: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
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
// GET /api/favorites
// ---------------------------------------------------------------------------
describe('GET /api/favorites', () => {
  it('returns user favorites with pagination', async () => {
    mockAuthUser();

    const now = new Date();
    const favorites = [
      {
        id: 'fav-1',
        userId: testUser.id,
        listingId: 'listing-1',
        createdAt: now,
        listing: {
          id: 'listing-1',
          title: 'Toyota Corolla 2022',
          priceAmount: 100000,
          priceCurrency: 'ILS',
          vertical: 'cars',
          media: [{ id: 'media-1', url: '/img.jpg', type: 'image', order: 0 }],
          carDetails: { make: 'Toyota', model: 'Corolla', year: 2022 },
          propertyDetails: null,
          marketDetails: null,
        },
      },
    ];

    mockPrisma.favorite.findMany.mockResolvedValueOnce(favorites);
    mockPrisma.favorite.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.data[0].id).toBe('listing-1');
    expect(res.body.data.data[0].favoritedAt).toBeDefined();
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.hasMore).toBe(false);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/favorites');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// POST /api/favorites/:listingId — Toggle favorite
// ---------------------------------------------------------------------------
describe('POST /api/favorites/:listingId', () => {
  it('toggles favorite on (create) when not yet favorited', async () => {
    mockAuthUser();

    mockPrisma.favorite.findUnique.mockResolvedValueOnce(null); // not yet favorited
    mockPrisma.favorite.create.mockResolvedValueOnce({
      id: 'fav-new',
      userId: testUser.id,
      listingId: 'listing-1',
    });
    mockPrisma.listing.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/favorites/listing-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFavorited).toBe(true);
    expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
      data: { userId: testUser.id, listingId: 'listing-1' },
    });
    expect(mockPrisma.listing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { favoriteCount: { increment: 1 } },
    });
  });

  it('toggles favorite off (delete) when already favorited', async () => {
    mockAuthUser();

    const existingFavorite = {
      id: 'fav-1',
      userId: testUser.id,
      listingId: 'listing-1',
    };

    mockPrisma.favorite.findUnique.mockResolvedValueOnce(existingFavorite);
    mockPrisma.favorite.delete.mockResolvedValueOnce({});
    mockPrisma.listing.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/favorites/listing-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isFavorited).toBe(false);
    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
      where: { id: 'fav-1' },
    });
    expect(mockPrisma.listing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { favoriteCount: { decrement: 1 } },
    });
  });
});
