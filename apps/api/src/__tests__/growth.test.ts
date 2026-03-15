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

describe('PATCH /api/growth/saved-searches/:id', () => {
  it('should update saved search alert settings', async () => {
    (prisma.savedSearch.findUnique as any).mockResolvedValue({
      id: 'ss-1',
      userId: testUser.id,
    });
    (prisma.savedSearch.update as any).mockResolvedValue({
      id: 'ss-1',
      alertEnabled: true,
      alertFrequency: 'daily',
    });

    const res = await request(app)
      .patch('/api/growth/saved-searches/ss-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ alertEnabled: true, alertFrequency: 'daily' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject if not owner', async () => {
    (prisma.savedSearch.findUnique as any).mockResolvedValue({
      id: 'ss-1',
      userId: 'other-user',
    });

    const res = await request(app)
      .patch('/api/growth/saved-searches/ss-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ alertEnabled: true });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/growth/recently-viewed/:listingId', () => {
  it('should track recently viewed', async () => {
    (prisma.recentlyViewed.upsert as any).mockResolvedValue({});
    (prisma.analyticsEvent.create as any).mockResolvedValue({});

    const res = await request(app)
      .post('/api/growth/recently-viewed/listing-1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/growth/recommendations/popular', () => {
  it('should return popular listings', async () => {
    (prisma.listing.findMany as any).mockResolvedValue([
      { id: 'l-1', title: 'Popular Car', viewCount: 100 },
    ]);

    const res = await request(app).get('/api/growth/recommendations/popular');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /api/growth/recommendations/similar/:listingId', () => {
  it('should return similar listings', async () => {
    (prisma.listing.findUnique as any).mockResolvedValue({
      id: 'l-1',
      vertical: 'cars',
      priceAmount: 100000,
      carDetails: { make: 'Toyota' },
    });
    (prisma.listing.findMany as any).mockResolvedValue([]);

    const res = await request(app).get('/api/growth/recommendations/similar/l-1');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /api/growth/recommendations/for-you', () => {
  it('should return personalized recommendations', async () => {
    (prisma.recentlyViewed.findMany as any).mockResolvedValue([
      { listingId: 'l-1', listing: { vertical: 'cars', city: 'Tel Aviv', priceAmount: 100000 } },
    ]);
    (prisma.favorite.findMany as any).mockResolvedValue([]);
    (prisma.listing.findMany as any).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/growth/recommendations/for-you')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Digest Preferences', () => {
  it('should get digest preferences', async () => {
    (prisma.emailDigestPreference.findUnique as any).mockResolvedValue({
      userId: testUser.id,
      weeklyDigest: true,
      savedSearchAlerts: true,
      priceAlerts: true,
    });

    const res = await request(app)
      .get('/api/growth/digest-preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.weeklyDigest).toBe(true);
  });

  it('should update digest preferences', async () => {
    (prisma.emailDigestPreference.upsert as any).mockResolvedValue({
      userId: testUser.id,
      weeklyDigest: false,
    });

    const res = await request(app)
      .patch('/api/growth/digest-preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ weeklyDigest: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/growth/track', () => {
  it('should track analytics event', async () => {
    (prisma.analyticsEvent.create as any).mockResolvedValue({});

    const res = await request(app)
      .post('/api/growth/track')
      .send({ type: 'listing_view', properties: { listingId: 'l-1' } });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/growth/admin/metrics', () => {
  it('should return growth metrics for admin', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      roles: testAdmin.roles,
      isActive: true,
    });
    (prisma.user.count as any).mockResolvedValue(10);
    (prisma.listing.count as any).mockResolvedValue(5);
    (prisma.analyticsEvent.count as any).mockResolvedValue(100);
    (prisma.favorite.count as any).mockResolvedValue(20);
    (prisma.lead.count as any).mockResolvedValue(3);
    (prisma.message.count as any).mockResolvedValue(50);
    (prisma.savedSearch.count as any).mockResolvedValue(8);
    (prisma.promotion.count as any).mockResolvedValue(2);
    (prisma.payment.aggregate as any).mockResolvedValue({ _sum: { amount: 50000 } });
    (prisma.analyticsEvent.groupBy as any).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/growth/admin/metrics?period=week')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.newUsers).toBe(10);
    expect(res.body.data.revenue).toBe(50000);
  });
});
