import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn> };
  conversation: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  message: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
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
// GET /api/messages/conversations
// ---------------------------------------------------------------------------
describe('GET /api/messages/conversations', () => {
  it('returns user conversations when authenticated', async () => {
    mockAuthUser();

    const conversations = [
      {
        id: 'conv-1',
        buyerId: testUser.id,
        sellerId: 'seller-1',
        status: 'active',
        buyerUnreadCount: 2,
        sellerUnreadCount: 0,
        lastMessageAt: new Date(),
        listing: {
          id: 'listing-1',
          title: 'Toyota Corolla',
          priceAmount: 100000,
          priceCurrency: 'ILS',
          vertical: 'cars',
        },
        buyer: { id: testUser.id, name: testUser.name },
        seller: { id: 'seller-1', name: 'Seller' },
      },
    ];

    mockPrisma.conversation.findMany.mockResolvedValueOnce(conversations);

    const res = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].unreadCount).toBe(2);
    expect(res.body.data[0].otherUser.id).toBe('seller-1');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/messages/conversations');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// GET /api/messages/conversations/:id
// ---------------------------------------------------------------------------
describe('GET /api/messages/conversations/:id', () => {
  it('returns messages for authorized user (buyer)', async () => {
    mockAuthUser();

    const conversation = {
      id: 'conv-1',
      buyerId: testUser.id,
      sellerId: 'seller-1',
      status: 'active',
      buyerUnreadCount: 1,
      sellerUnreadCount: 0,
    };

    const messages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'seller-1',
        content: 'Hello',
        type: 'text',
        isRead: false,
        createdAt: new Date(),
        sender: { id: 'seller-1', name: 'Seller' },
      },
    ];

    mockPrisma.conversation.findUnique.mockResolvedValueOnce(conversation);
    mockPrisma.message.findMany.mockResolvedValueOnce(messages);
    mockPrisma.conversation.update.mockResolvedValueOnce({});
    mockPrisma.message.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(app)
      .get('/api/messages/conversations/conv-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content).toBe('Hello');
    // Should mark as read for buyer
    expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { buyerUnreadCount: 0 },
    });
  });

  it('returns 403 for non-participant', async () => {
    mockAuthUser();

    const conversation = {
      id: 'conv-1',
      buyerId: 'other-buyer',
      sellerId: 'other-seller',
      status: 'active',
    };

    mockPrisma.conversation.findUnique.mockResolvedValueOnce(conversation);

    const res = await request(app)
      .get('/api/messages/conversations/conv-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/messages/send
// ---------------------------------------------------------------------------
describe('POST /api/messages/send', () => {
  it('creates message with existing conversationId', async () => {
    mockAuthUser();

    const conversation = {
      id: 'conv-1',
      buyerId: testUser.id,
      sellerId: 'seller-1',
    };

    const createdMessage = {
      id: 'msg-new',
      conversationId: 'conv-1',
      senderId: testUser.id,
      content: 'Hi there',
      type: 'text',
      createdAt: new Date(),
    };

    mockPrisma.conversation.findUnique.mockResolvedValueOnce(conversation);
    mockPrisma.message.create.mockResolvedValueOnce(createdMessage);
    mockPrisma.conversation.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ conversationId: 'conv-1', content: 'Hi there' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.content).toBe('Hi there');
    expect(res.body.data.conversationId).toBe('conv-1');
  });

  it('creates new conversation when using listingId', async () => {
    mockAuthUser();

    const listing = {
      id: 'listing-1',
      userId: 'seller-1',
      title: 'Toyota Corolla',
    };

    const newConversation = {
      id: 'conv-new',
      listingId: 'listing-1',
      buyerId: testUser.id,
      sellerId: 'seller-1',
    };

    const createdMessage = {
      id: 'msg-new',
      conversationId: 'conv-new',
      senderId: testUser.id,
      content: 'Interested in this car',
      type: 'text',
    };

    mockPrisma.listing.findUnique.mockResolvedValueOnce(listing);
    // First findUnique for existing conversation returns null
    mockPrisma.conversation.findUnique.mockResolvedValueOnce(null);
    mockPrisma.conversation.create.mockResolvedValueOnce(newConversation);
    mockPrisma.message.create.mockResolvedValueOnce(createdMessage);
    mockPrisma.conversation.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', content: 'Interested in this car' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.conversationId).toBe('conv-new');
    expect(mockPrisma.conversation.create).toHaveBeenCalledOnce();
  });

  it('returns 400 for self-messaging', async () => {
    mockAuthUser();

    const listing = {
      id: 'listing-1',
      userId: testUser.id, // same as authenticated user
      title: 'My Own Listing',
    };

    mockPrisma.listing.findUnique.mockResolvedValueOnce(listing);

    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ listingId: 'listing-1', content: 'Hello myself' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });

  it('returns 400 for empty content', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ conversationId: 'conv-1', content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });

  it('returns 400 for content exceeding 5000 chars', async () => {
    mockAuthUser();

    const longContent = 'a'.repeat(5001);

    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ conversationId: 'conv-1', content: longContent });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID');
  });
});

// ---------------------------------------------------------------------------
// GET /api/messages/unread-count
// ---------------------------------------------------------------------------
describe('GET /api/messages/unread-count', () => {
  it('returns unread count', async () => {
    mockAuthUser();

    const conversations = [
      {
        id: 'conv-1',
        buyerId: testUser.id,
        sellerId: 'seller-1',
        buyerUnreadCount: 3,
        sellerUnreadCount: 0,
      },
      {
        id: 'conv-2',
        buyerId: 'buyer-2',
        sellerId: testUser.id,
        buyerUnreadCount: 0,
        sellerUnreadCount: 5,
      },
    ];

    mockPrisma.conversation.findMany.mockResolvedValueOnce(conversations);

    const res = await request(app)
      .get('/api/messages/unread-count')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(8); // 3 + 5
  });
});
