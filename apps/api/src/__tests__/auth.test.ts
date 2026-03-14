import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, generateExpiredToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  otpCode: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null); // no existing user
    mockPrisma.user.create.mockResolvedValueOnce({
      id: 'new-user-1',
      email: 'new@example.com',
      name: 'New User',
      roles: ['user'],
    });
    mockPrisma.otpCode.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', name: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
    expect(mockPrisma.otpCode.create).toHaveBeenCalledOnce();
  });

  it('returns 409 when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'existing@example.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', name: 'Existing User' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when name is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'valid@example.com', name: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  it('sends OTP when user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
    });
    mockPrisma.otpCode.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.otpCode.create).toHaveBeenCalledOnce();
  });

  it('returns 404 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify
// ---------------------------------------------------------------------------
describe('POST /api/auth/verify', () => {
  it('returns token and user on valid OTP', async () => {
    const validOtp = {
      id: 'otp-1',
      email: 'test@example.com',
      code: '123456',
      usedAt: null,
      expiresAt: new Date(Date.now() + 600_000),
      attempts: 0,
    };

    mockPrisma.otpCode.findFirst.mockResolvedValueOnce(validOtp);
    mockPrisma.otpCode.update.mockResolvedValueOnce({});
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
    });
    mockPrisma.user.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/verify')
      .send({ email: 'test@example.com', code: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.id).toBe('user-1');
    expect(res.body.data.user.email).toBe('test@example.com');

    // Should set httpOnly cookie
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    expect(cookies!.some((c: string) => c.startsWith('token='))).toBe(true);
  });

  it('returns 400 for invalid OTP code', async () => {
    // First findFirst returns null (no matching valid OTP)
    mockPrisma.otpCode.findFirst
      .mockResolvedValueOnce(null) // no valid OTP found
      .mockResolvedValueOnce({ id: 'otp-1' }); // latest OTP for attempt increment
    mockPrisma.otpCode.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/verify')
      .send({ email: 'test@example.com', code: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  it('returns 400 for expired OTP (no matching record)', async () => {
    // findFirst with expiry filter returns null
    mockPrisma.otpCode.findFirst
      .mockResolvedValueOnce(null) // expired, so not found
      .mockResolvedValueOnce(null); // no latest OTP either

    const res = await request(app)
      .post('/api/auth/verify')
      .send({ email: 'test@example.com', code: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  it('increments attempts on failed verification', async () => {
    const latestOtp = { id: 'otp-latest' };
    mockPrisma.otpCode.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(latestOtp);
    mockPrisma.otpCode.update.mockResolvedValueOnce({});

    await request(app)
      .post('/api/auth/verify')
      .send({ email: 'test@example.com', code: '000000' });

    expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: 'otp-latest' },
      data: { attempts: { increment: 1 } },
    });
  });

  it('returns 400 for code with wrong length', async () => {
    const res = await request(app)
      .post('/api/auth/verify')
      .send({ email: 'test@example.com', code: '12' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const token = generateToken(testUser);

    // authenticate middleware calls prisma.user.findUnique to verify user is active
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roles: testUser.roles,
        isActive: true,
      })
      // The /me route itself calls prisma.user.findUnique again
      .mockResolvedValueOnce({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roles: testUser.roles,
        profile: { displayName: 'Test User', verificationStatus: 'pending' },
        organizationMembers: [],
      });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testUser.id);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token is expired', async () => {
    const token = generateExpiredToken(testUser);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when user is inactive', async () => {
    const token = generateToken(testUser);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      roles: testUser.roles,
      isActive: false,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts token from cookie', async () => {
    const token = generateToken(testUser);

    mockPrisma.user.findUnique
      .mockResolvedValueOnce({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roles: testUser.roles,
        isActive: true,
      })
      .mockResolvedValueOnce({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        roles: testUser.roles,
        profile: null,
        organizationMembers: [],
      });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testUser.id);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/auth/logout', () => {
  it('clears the token cookie and returns success', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    // Cookie should be cleared (expires in the past or value empty)
    expect(cookies!.some((c: string) => c.startsWith('token='))).toBe(true);
  });
});
