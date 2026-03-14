import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser, testAdmin } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  subscription: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  auditLog: { create: ReturnType<typeof vi.fn> };
};

let authToken: string;
let adminToken: string;

beforeEach(() => {
  vi.clearAllMocks();
  authToken = generateToken(testUser);
  adminToken = generateToken(testAdmin);
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
// GET /api/subscriptions/my — My subscription
// ---------------------------------------------------------------------------
describe('GET /api/subscriptions/my', () => {
  it('returns active subscription', async () => {
    mockAuthUser();

    mockPrisma.subscription.findFirst.mockResolvedValueOnce({
      id: 'sub-1',
      userId: testUser.id,
      plan: 'pro',
      status: 'active',
      organization: { id: 'org-1', name: 'My Org', type: 'dealer' },
    });

    const res = await request(app)
      .get('/api/subscriptions/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('pro');
    expect(res.body.data.organization.name).toBe('My Org');
  });

  it('returns null if no active subscription', async () => {
    mockAuthUser();

    mockPrisma.subscription.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/subscriptions/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/admin/assign — Admin assign subscription
// ---------------------------------------------------------------------------
describe('POST /api/subscriptions/admin/assign', () => {
  it('assigns subscription as admin', async () => {
    mockAuthUser(testAdmin);

    mockPrisma.subscription.updateMany.mockResolvedValueOnce({ count: 0 });
    mockPrisma.subscription.create.mockResolvedValueOnce({
      id: 'sub-new',
      userId: 'target-user',
      plan: 'basic',
      status: 'active',
      user: { id: 'target-user', name: 'Target', email: 'target@example.com' },
      organization: null,
    });
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/subscriptions/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'target-user', plan: 'basic', durationMonths: 6 });

    expect(res.status).toBe(201);
    expect(res.body.data.plan).toBe('basic');
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns 403 for non-admin', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/subscriptions/admin/assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ userId: 'target', plan: 'basic' });

    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid plan', async () => {
    mockAuthUser(testAdmin);

    const res = await request(app)
      .post('/api/subscriptions/admin/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'target', plan: 'ultra_premium' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/subscriptions/admin/:id/cancel — Admin cancel subscription
// ---------------------------------------------------------------------------
describe('PATCH /api/subscriptions/admin/:id/cancel', () => {
  it('cancels subscription as admin', async () => {
    mockAuthUser(testAdmin);

    mockPrisma.subscription.findUnique.mockResolvedValueOnce({
      id: 'sub-1',
      userId: 'some-user',
      plan: 'pro',
      status: 'active',
    });
    mockPrisma.subscription.update.mockResolvedValueOnce({});
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const res = await request(app)
      .patch('/api/subscriptions/admin/sub-1/cancel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns 404 for nonexistent subscription', async () => {
    mockAuthUser(testAdmin);

    mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch('/api/subscriptions/admin/nonexistent/cancel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
