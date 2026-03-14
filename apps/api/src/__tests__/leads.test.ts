import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn> };
  lead: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
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
// POST /api/leads — Create lead
// ---------------------------------------------------------------------------
describe('POST /api/leads', () => {
  it('creates lead for a listing', async () => {
    mockAuthUser();

    const listing = {
      id: 'listing-1',
      userId: 'seller-1',
      title: 'Toyota Corolla 2022',
    };

    const createdLead = {
      id: 'lead-1',
      listingId: 'listing-1',
      buyerId: testUser.id,
      sellerId: 'seller-1',
      type: 'contact',
      message: 'Interested',
      status: 'new',
      createdAt: new Date(),
    };

    mockPrisma.listing.findUnique.mockResolvedValueOnce(listing);
    mockPrisma.lead.create.mockResolvedValueOnce(createdLead);
    mockPrisma.notification.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'contact', message: 'Interested' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('lead-1');
    expect(res.body.data.type).toBe('contact');
    expect(mockPrisma.lead.create).toHaveBeenCalledOnce();
    expect(mockPrisma.notification.create).toHaveBeenCalledOnce();
  });

  it('returns 400 when creating lead on own listing', async () => {
    mockAuthUser();

    const listing = {
      id: 'listing-1',
      userId: testUser.id, // same as authenticated user
      title: 'My Own Listing',
    };

    mockPrisma.listing.findUnique.mockResolvedValueOnce(listing);

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'contact' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });

  it('returns 404 for nonexistent listing', async () => {
    mockAuthUser();

    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'nonexistent', type: 'contact' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid lead type', async () => {
    mockAuthUser();

    const listing = {
      id: 'listing-1',
      userId: 'seller-1',
      title: 'Toyota Corolla',
    };

    mockPrisma.listing.findUnique.mockResolvedValueOnce(listing);

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', type: 'invalid_type' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// GET /api/leads — Get leads for seller
// ---------------------------------------------------------------------------
describe('GET /api/leads', () => {
  it('returns leads for seller', async () => {
    mockAuthUser();

    const leads = [
      {
        id: 'lead-1',
        listingId: 'listing-1',
        buyerId: 'buyer-1',
        sellerId: testUser.id,
        type: 'contact',
        status: 'new',
        createdAt: new Date(),
        listing: { id: 'listing-1', title: 'Toyota Corolla', vertical: 'cars' },
        buyer: { id: 'buyer-1', name: 'Buyer One', email: 'buyer@example.com' },
      },
      {
        id: 'lead-2',
        listingId: 'listing-2',
        buyerId: 'buyer-2',
        sellerId: testUser.id,
        type: 'test_drive',
        status: 'contacted',
        createdAt: new Date(),
        listing: { id: 'listing-2', title: 'Honda Civic', vertical: 'cars' },
        buyer: { id: 'buyer-2', name: 'Buyer Two', email: 'buyer2@example.com' },
      },
    ];

    mockPrisma.lead.findMany.mockResolvedValueOnce(leads);

    const res = await request(app).get('/api/leads').set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe('lead-1');
    expect(res.body.data[1].type).toBe('test_drive');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/leads/:id/status — Update lead status
// ---------------------------------------------------------------------------
describe('PATCH /api/leads/:id/status', () => {
  it('updates lead status', async () => {
    mockAuthUser();

    const lead = {
      id: 'lead-1',
      sellerId: testUser.id,
      status: 'new',
    };

    const updatedLead = {
      ...lead,
      status: 'contacted',
      respondedAt: new Date(),
    };

    mockPrisma.lead.findUnique.mockResolvedValueOnce(lead);
    mockPrisma.lead.update.mockResolvedValueOnce(updatedLead);

    const res = await request(app)
      .patch('/api/leads/lead-1/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'contacted' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('contacted');
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: {
        status: 'contacted',
        respondedAt: expect.any(Date),
      },
    });
  });

  it('returns 404 when not the seller', async () => {
    mockAuthUser();

    const lead = {
      id: 'lead-1',
      sellerId: 'other-seller', // not testUser
      status: 'new',
    };

    mockPrisma.lead.findUnique.mockResolvedValueOnce(lead);

    const res = await request(app)
      .patch('/api/leads/lead-1/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'contacted' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid status', async () => {
    mockAuthUser();

    const lead = {
      id: 'lead-1',
      sellerId: testUser.id,
      status: 'new',
    };

    mockPrisma.lead.findUnique.mockResolvedValueOnce(lead);

    const res = await request(app)
      .patch('/api/leads/lead-1/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });
});
