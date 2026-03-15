import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '@zuzz/database';
import { createTestApp } from './create-app';
import { generateToken, testUser, testAdmin } from './helpers';

const app = createTestApp();
const userToken = generateToken(testUser);
const adminToken = generateToken(testAdmin);

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockResolvedValue({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
    roles: testUser.roles,
    isActive: true,
  });
});

describe('POST /api/push/register', () => {
  it('should register a device token', async () => {
    (prisma.deviceToken.upsert as any).mockResolvedValue({
      id: 'dt-1',
      userId: testUser.id,
      token: 'test-fcm-token',
      platform: 'android',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/push/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: 'test-fcm-token', platform: 'android' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject invalid platform', async () => {
    const res = await request(app)
      .post('/api/push/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: 'test-token', platform: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/push/register')
      .send({ token: 'test-token', platform: 'android' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/push/unregister', () => {
  it('should unregister a device token', async () => {
    (prisma.deviceToken.updateMany as any).mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/api/push/unregister')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: 'test-fcm-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/push/devices', () => {
  it('should list active device tokens', async () => {
    (prisma.deviceToken.findMany as any).mockResolvedValue([
      { id: 'dt-1', platform: 'android', createdAt: new Date() },
    ]);

    const res = await request(app)
      .get('/api/push/devices')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('POST /api/push/admin/test', () => {
  it('should send test notification (admin)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      roles: testAdmin.roles,
      isActive: true,
    });
    (prisma.notification.create as any).mockResolvedValue({});
    (prisma.deviceToken.findMany as any).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/push/admin/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'user-1', title: 'Test', body: 'Test body' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject non-admin', async () => {
    const res = await request(app)
      .post('/api/push/admin/test')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 'user-1', title: 'Test', body: 'Body' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/push/admin/tokens', () => {
  it('should list tokens for admin', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      roles: testAdmin.roles,
      isActive: true,
    });
    (prisma.deviceToken.findMany as any).mockResolvedValue([]);
    (prisma.deviceToken.count as any).mockResolvedValue(0);

    const res = await request(app)
      .get('/api/push/admin/tokens')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
