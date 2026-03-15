import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  deviceToken: {
    upsert: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
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
// POST /api/device-tokens/register
// ---------------------------------------------------------------------------
describe('POST /api/device-tokens/register', () => {
  it('registers a device token', async () => {
    mockAuthUser();

    mockPrisma.deviceToken.upsert.mockResolvedValueOnce({
      id: 'dt-1',
      userId: testUser.id,
      token: 'fcm-token-abc123',
      platform: 'ios',
      provider: 'fcm',
    });

    const res = await request(app)
      .post('/api/device-tokens/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'fcm-token-abc123', platform: 'ios' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('dt-1');
  });

  it('returns 400 for invalid token', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/device-tokens/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'short', platform: 'ios' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/device-tokens/register')
      .send({ token: 'fcm-token-abc123', platform: 'ios' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/device-tokens/unregister
// ---------------------------------------------------------------------------
describe('DELETE /api/device-tokens/unregister', () => {
  it('deactivates a device token', async () => {
    mockAuthUser();

    mockPrisma.deviceToken.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app)
      .delete('/api/device-tokens/unregister')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: 'fcm-token-abc123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 without token', async () => {
    mockAuthUser();

    const res = await request(app)
      .delete('/api/device-tokens/unregister')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/device-tokens/my
// ---------------------------------------------------------------------------
describe('GET /api/device-tokens/my', () => {
  it('returns active tokens', async () => {
    mockAuthUser();

    mockPrisma.deviceToken.findMany.mockResolvedValueOnce([
      { id: 'dt-1', platform: 'ios', provider: 'fcm', createdAt: new Date(), appVersion: '1.0.0' },
    ]);

    const res = await request(app)
      .get('/api/device-tokens/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].platform).toBe('ios');
  });
});
