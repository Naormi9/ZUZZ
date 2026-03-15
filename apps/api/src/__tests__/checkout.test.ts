import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  organizationMember: { findUnique: ReturnType<typeof vi.fn> };
  payment: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  invoice: { create: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  subscription: {
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  promotion: { create: ReturnType<typeof vi.fn> };
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
// POST /api/checkout/create-session — Subscription
// ---------------------------------------------------------------------------
describe('POST /api/checkout/create-session (subscription)', () => {
  it('creates a subscription checkout session', async () => {
    mockAuthUser();

    mockPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-1',
      userId: testUser.id,
      amount: 9900,
      currency: 'ILS',
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'subscription', plan: 'basic', durationMonths: 1 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(9900);
    expect(res.body.data.currency).toBe('ILS');
    expect(res.body.data.checkoutUrl).toContain('paymentId=pay-1');
  });

  it('calculates multi-month subscription correctly', async () => {
    mockAuthUser();

    mockPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-2',
      userId: testUser.id,
      amount: 59400,
      currency: 'ILS',
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'subscription', plan: 'basic', durationMonths: 6 });

    expect(res.status).toBe(201);
    // 9900 * 6 = 59400
    expect(res.body.data.amount).toBe(59400);
  });

  it('returns 400 for invalid plan', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'subscription', plan: 'invalid_plan' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/checkout/create-session — Promotion
// ---------------------------------------------------------------------------
describe('POST /api/checkout/create-session (promotion)', () => {
  it('creates a promotion checkout session', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
      organizationId: null,
    });
    mockPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-3',
      userId: testUser.id,
      amount: 2900,
      currency: 'ILS',
      status: 'pending',
    });

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'promotion', promotionType: 'boost', listingId: 'listing-1', durationDays: 7 });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(2900);
  });

  it('rejects when listing not owned', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'other-user',
      organizationId: null,
    });

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'promotion', promotionType: 'boost', listingId: 'listing-1' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for nonexistent listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/checkout/create-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'promotion', promotionType: 'boost', listingId: 'nonexistent' });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/checkout/payment/:id
// ---------------------------------------------------------------------------
describe('GET /api/checkout/payment/:id', () => {
  it('returns payment with invoices', async () => {
    mockAuthUser();

    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      userId: testUser.id,
      amount: 9900,
      status: 'completed',
      invoices: [{ invoiceNumber: 'INV-000001', total: 11583 }],
    });

    const res = await request(app)
      .get('/api/checkout/payment/pay-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.invoices).toHaveLength(1);
  });

  it('returns 403 for non-owned payment', async () => {
    mockAuthUser();

    mockPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      userId: 'other-user',
      amount: 9900,
      invoices: [],
    });

    const res = await request(app)
      .get('/api/checkout/payment/pay-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/checkout/plans
// ---------------------------------------------------------------------------
describe('GET /api/checkout/plans', () => {
  it('returns plan list without auth', async () => {
    const res = await request(app).get('/api/checkout/plans');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.data[0].id).toBe('free');
    expect(res.body.data[2].popular).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/checkout/payments
// ---------------------------------------------------------------------------
describe('GET /api/checkout/payments', () => {
  it('returns payment history', async () => {
    mockAuthUser();

    mockPrisma.payment.findMany.mockResolvedValueOnce([
      { id: 'pay-1', amount: 9900, status: 'completed', invoices: [] },
    ]);
    mockPrisma.payment.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/checkout/payments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});
