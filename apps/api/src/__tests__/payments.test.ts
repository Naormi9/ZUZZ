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

describe('GET /api/payments/plans', () => {
  it('should return available plans', async () => {
    const res = await request(app).get('/api/payments/plans');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.find((p: any) => p.id === 'free')).toBeTruthy();
    expect(res.body.data.find((p: any) => p.id === 'basic')).toBeTruthy();
    expect(res.body.data.find((p: any) => p.id === 'pro')).toBeTruthy();
  });
});

describe('GET /api/payments/promotion-prices', () => {
  it('should return promotion prices', async () => {
    const res = await request(app).get('/api/payments/promotion-prices');

    expect(res.status).toBe(200);
    expect(res.body.data.boost).toBeTruthy();
    expect(res.body.data.featured).toBeTruthy();
  });
});

describe('POST /api/payments/checkout/subscription', () => {
  it('should create subscription checkout', async () => {
    (prisma.payment.create as any).mockResolvedValue({ id: 'pay-1' });
    (prisma.subscription.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.subscription.create as any).mockResolvedValue({ id: 'sub-1' });
    (prisma.payment.findFirst as any).mockResolvedValue({ id: 'pay-1', userId: testUser.id });
    (prisma.payment.update as any).mockResolvedValue({});
    (prisma.invoice.create as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});

    const res = await request(app)
      .post('/api/payments/checkout/subscription')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ plan: 'basic' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeTruthy();
    expect(res.body.data.url).toBeTruthy();
  });

  it('should reject invalid plan', async () => {
    const res = await request(app)
      .post('/api/payments/checkout/subscription')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ plan: 'enterprise' });

    expect(res.status).toBe(400);
  });

  it('should require auth', async () => {
    const res = await request(app)
      .post('/api/payments/checkout/subscription')
      .send({ plan: 'basic' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/payments/checkout/promotion', () => {
  it('should create promotion checkout', async () => {
    (prisma.listing.findUnique as any).mockResolvedValue({
      id: 'listing-1',
      userId: testUser.id,
      title: 'Test Car',
    });
    (prisma.payment.create as any).mockResolvedValue({ id: 'pay-1' });
    (prisma.promotion.create as any).mockResolvedValue({ id: 'promo-1' });
    (prisma.listing.update as any).mockResolvedValue({});
    (prisma.payment.findFirst as any).mockResolvedValue({
      id: 'pay-1',
      userId: testUser.id,
      providerPaymentId: 'sandbox_sess_123',
    });
    (prisma.payment.update as any).mockResolvedValue({});
    (prisma.invoice.create as any).mockResolvedValue({});

    const res = await request(app)
      .post('/api/payments/checkout/promotion')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ listingId: 'listing-1', type: 'boost', durationWeeks: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject if not listing owner', async () => {
    (prisma.listing.findUnique as any).mockResolvedValue({
      id: 'listing-1',
      userId: 'other-user',
      organizationId: null,
    });

    const res = await request(app)
      .post('/api/payments/checkout/promotion')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ listingId: 'listing-1', type: 'boost', durationWeeks: 1 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/payments/my', () => {
  it('should return user payments', async () => {
    (prisma.payment.findMany as any).mockResolvedValue([
      { id: 'pay-1', amount: 9900, status: 'completed', invoices: [] },
    ]);

    const res = await request(app)
      .get('/api/payments/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/payments/invoices', () => {
  it('should return user invoices', async () => {
    (prisma.invoice.findMany as any).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/payments/invoices')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /api/payments/admin/all', () => {
  it('should return all payments for admin', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      roles: testAdmin.roles,
      isActive: true,
    });
    (prisma.payment.findMany as any).mockResolvedValue([]);
    (prisma.payment.count as any).mockResolvedValue(0);

    const res = await request(app)
      .get('/api/payments/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
