import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser, testAdmin } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  organization: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  organizationMember: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  dealerProfile: { upsert: ReturnType<typeof vi.fn> };
  listing: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  lead: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  promotion: { count: ReturnType<typeof vi.fn> };
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
// POST /api/organizations — Create organization
// ---------------------------------------------------------------------------
describe('POST /api/organizations', () => {
  it('creates a dealer organization', async () => {
    mockAuthUser();

    mockPrisma.organizationMember.findFirst.mockResolvedValueOnce(null); // no existing org
    mockPrisma.organization.create.mockResolvedValueOnce({
      id: 'org-1',
      name: 'My Dealership',
      type: 'dealer',
      verificationStatus: 'pending',
      dealerProfile: {},
      members: [{ userId: testUser.id, role: 'owner' }],
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: testUser.id,
      roles: ['user'],
    });
    mockPrisma.user.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'My Dealership', type: 'dealer', city: 'Tel Aviv' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My Dealership');
    expect(res.body.data.verificationStatus).toBe('pending');
  });

  it('returns 400 if user already owns an org', async () => {
    mockAuthUser();

    mockPrisma.organizationMember.findFirst.mockResolvedValueOnce({
      userId: testUser.id,
      role: 'owner',
    });

    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Another Org', type: 'dealer' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_EXISTS');
  });

  it('returns 400 for missing name', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'dealer' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID');
  });

  it('returns 400 for invalid type', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Org', type: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// GET /api/organizations/my — My organizations
// ---------------------------------------------------------------------------
describe('GET /api/organizations/my', () => {
  it('returns user organizations with role', async () => {
    mockAuthUser();

    mockPrisma.organizationMember.findMany.mockResolvedValueOnce([
      {
        role: 'owner',
        organization: {
          id: 'org-1',
          name: 'My Dealership',
          type: 'dealer',
          dealerProfile: {},
          _count: { listings: 5, members: 2 },
        },
      },
    ]);

    const res = await request(app)
      .get('/api/organizations/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].myRole).toBe('owner');
    expect(res.body.data[0].name).toBe('My Dealership');
  });
});

// ---------------------------------------------------------------------------
// GET /api/organizations/:id — Public organization
// ---------------------------------------------------------------------------
describe('GET /api/organizations/:id', () => {
  it('returns organization by ID', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Dealership',
      type: 'dealer',
      dealerProfile: {},
      _count: { listings: 10, members: 3 },
    });

    const res = await request(app).get('/api/organizations/org-1');

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Dealership');
  });

  it('returns 404 for nonexistent org', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/organizations/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/organizations/:id — Update organization
// ---------------------------------------------------------------------------
describe('PATCH /api/organizations/:id', () => {
  it('updates org as owner', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
      userId: testUser.id,
      role: 'owner',
    });
    mockPrisma.organization.update.mockResolvedValueOnce({
      id: 'org-1',
      name: 'Updated Name',
      dealerProfile: {},
    });

    const res = await request(app)
      .patch('/api/organizations/org-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('returns 403 for non-member', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .patch('/api/organizations/org-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });

  it('returns 403 for member without admin/owner role', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
      userId: testUser.id,
      role: 'member',
    });

    const res = await request(app)
      .patch('/api/organizations/org-1')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Not Allowed' });

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/organizations/:id/members — Invite member
// ---------------------------------------------------------------------------
describe('POST /api/organizations/:id/members', () => {
  it('invites a new member', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique
      .mockResolvedValueOnce({ userId: testUser.id, role: 'owner' }) // requireOrgMember
      .mockResolvedValueOnce(null); // check existing membership
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'new-user-1',
      email: 'new@example.com',
      name: 'New Member',
    });
    mockPrisma.organizationMember.create.mockResolvedValueOnce({
      id: 'mem-1',
      organizationId: 'org-1',
      userId: 'new-user-1',
      role: 'member',
      user: { id: 'new-user-1', name: 'New Member', email: 'new@example.com' },
    });

    const res = await request(app)
      .post('/api/organizations/org-1/members')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'new@example.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe('new-user-1');
  });

  it('returns 400 for already-member', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique
      .mockResolvedValueOnce({ userId: testUser.id, role: 'owner' })
      .mockResolvedValueOnce({ userId: 'existing-user', role: 'member' }); // already exists
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'existing@example.com',
    });

    const res = await request(app)
      .post('/api/organizations/org-1/members')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'existing@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_EXISTS');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/organizations/:id/members/:userId — Remove member
// ---------------------------------------------------------------------------
describe('DELETE /api/organizations/:id/members/:userId', () => {
  it('removes a member as owner', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique
      .mockResolvedValueOnce({ userId: testUser.id, role: 'owner' }) // requireOrgMember
      .mockResolvedValueOnce({ userId: 'target-user', role: 'member' }); // target
    mockPrisma.organizationMember.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/organizations/org-1/members/target-user')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('prevents non-owner from removing owner', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique
      .mockResolvedValueOnce({ userId: testUser.id, role: 'admin' })
      .mockResolvedValueOnce({ userId: 'owner-user', role: 'owner' });

    const res = await request(app)
      .delete('/api/organizations/org-1/members/owner-user')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/organizations/:id/listings — Org inventory (authenticated)
// ---------------------------------------------------------------------------
describe('GET /api/organizations/:id/listings', () => {
  it('returns paginated org listings', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce({
      userId: testUser.id,
      role: 'member',
    });
    mockPrisma.listing.findMany.mockResolvedValueOnce([
      { id: 'l1', title: 'Car 1', media: [], _count: { leads: 2 } },
    ]);
    mockPrisma.listing.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/organizations/org-1/listings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('returns 403 for non-member', async () => {
    mockAuthUser();
    mockPrisma.organizationMember.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/organizations/org-1/listings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/organizations/:id/public-listings — Public inventory
// ---------------------------------------------------------------------------
describe('GET /api/organizations/:id/public-listings', () => {
  it('returns public active listings', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org-1',
      isActive: true,
    });
    mockPrisma.listing.findMany.mockResolvedValueOnce([
      { id: 'l1', title: 'Public Car', media: [], carDetails: null },
    ]);
    mockPrisma.listing.count.mockResolvedValueOnce(1);

    const res = await request(app).get('/api/organizations/org-1/public-listings');

    expect(res.status).toBe(200);
    expect(res.body.data.data).toHaveLength(1);
  });
});
