import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  savedSearch: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
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
// POST /api/saved-searches
// ---------------------------------------------------------------------------
describe('POST /api/saved-searches', () => {
  it('creates a saved search', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.count.mockResolvedValueOnce(0);
    mockPrisma.savedSearch.create.mockResolvedValueOnce({
      id: 'ss-1',
      userId: testUser.id,
      vertical: 'cars',
      name: 'My Search',
      filters: { make: 'Toyota' },
      alertEnabled: true,
      alertFrequency: 'daily',
    });

    const res = await request(app)
      .post('/api/saved-searches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vertical: 'cars',
        name: 'My Search',
        filters: { make: 'Toyota' },
        alertEnabled: true,
        alertFrequency: 'daily',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vertical).toBe('cars');
  });

  it('rejects when over 20 saved searches', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.count.mockResolvedValueOnce(20);

    const res = await request(app)
      .post('/api/saved-searches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ vertical: 'cars', filters: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LIMIT');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/saved-searches')
      .send({ vertical: 'cars', filters: {} });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/saved-searches
// ---------------------------------------------------------------------------
describe('GET /api/saved-searches', () => {
  it('returns saved searches', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.findMany.mockResolvedValueOnce([
      { id: 'ss-1', vertical: 'cars', name: 'Test', filters: {}, alertEnabled: false },
    ]);

    const res = await request(app)
      .get('/api/saved-searches')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/saved-searches/:id
// ---------------------------------------------------------------------------
describe('PATCH /api/saved-searches/:id', () => {
  it('updates alert settings', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.findUnique.mockResolvedValueOnce({
      id: 'ss-1',
      userId: testUser.id,
    });
    mockPrisma.savedSearch.update.mockResolvedValueOnce({
      id: 'ss-1',
      alertEnabled: true,
      alertFrequency: 'weekly',
    });

    const res = await request(app)
      .patch('/api/saved-searches/ss-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ alertEnabled: true, alertFrequency: 'weekly' });

    expect(res.status).toBe(200);
    expect(res.body.data.alertEnabled).toBe(true);
  });

  it('returns 404 for non-owned search', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.findUnique.mockResolvedValueOnce({
      id: 'ss-1',
      userId: 'other-user',
    });

    const res = await request(app)
      .patch('/api/saved-searches/ss-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ alertEnabled: false });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/saved-searches/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/saved-searches/:id', () => {
  it('deletes a saved search', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.findUnique.mockResolvedValueOnce({
      id: 'ss-1',
      userId: testUser.id,
    });
    mockPrisma.savedSearch.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/saved-searches/ss-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for non-owned search', async () => {
    mockAuthUser();

    mockPrisma.savedSearch.findUnique.mockResolvedValueOnce({
      id: 'ss-1',
      userId: 'other-user',
    });

    const res = await request(app)
      .delete('/api/saved-searches/ss-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});
