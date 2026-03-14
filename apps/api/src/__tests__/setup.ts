import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @zuzz/database (Prisma)
// ---------------------------------------------------------------------------
vi.mock('@zuzz/database', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    otpCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    listing: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    carListing: {
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    listingMedia: {
      create: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    listingDocument: {
      create: vi.fn(),
    },
    trustFactor: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    conversation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    favorite: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    listingReport: {
      create: vi.fn(),
    },
    moderationCase: {
      create: vi.fn(),
    },
    recentlyViewed: {
      upsert: vi.fn(),
    },
    listingStatusHistory: {
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    organizationMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    dealerProfile: {
      upsert: vi.fn(),
    },
    promotion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  };

  return { prisma: mockPrisma };
});

// ---------------------------------------------------------------------------
// Mock @zuzz/redis
// ---------------------------------------------------------------------------
vi.mock('@zuzz/redis', () => ({
  getRedis: vi.fn(() => ({ call: vi.fn() })),
  pingRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @zuzz/logger — silent in tests
// ---------------------------------------------------------------------------
vi.mock('@zuzz/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
}));

// ---------------------------------------------------------------------------
// Mock pino-http — noop middleware
// ---------------------------------------------------------------------------
vi.mock('pino-http', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}));

// ---------------------------------------------------------------------------
// Mock @sentry/node
// ---------------------------------------------------------------------------
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  isInitialized: vi.fn(() => false),
  captureException: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @zuzz/trust-engine
// ---------------------------------------------------------------------------
vi.mock('@zuzz/trust-engine', () => ({
  TrustEngine: vi.fn().mockImplementation(() => ({
    computeScore: vi.fn().mockReturnValue({ overall: 75, factors: [] }),
    computeCompleteness: vi.fn().mockReturnValue({ score: 80, missing: [] }),
  })),
}));

// ---------------------------------------------------------------------------
// Mock @zuzz/storage — in-memory stub for tests
// ---------------------------------------------------------------------------
vi.mock('@zuzz/storage', () => ({
  createStorageProvider: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue({ url: 'http://localhost/uploads/test.jpg', key: 'test.jpg', size: 100 }),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrl: vi.fn().mockReturnValue('http://localhost/uploads/test.jpg'),
    healthCheck: vi.fn().mockResolvedValue(true),
  })),
}));

// ---------------------------------------------------------------------------
// Mock @zuzz/email — silent in tests
// ---------------------------------------------------------------------------
vi.mock('@zuzz/email', () => ({
  createEmailProvider: vi.fn(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
  otpTemplate: {
    subject: vi.fn().mockReturnValue('OTP Code'),
    html: vi.fn().mockReturnValue('<p>OTP</p>'),
    text: vi.fn().mockReturnValue('OTP'),
  },
  welcomeTemplate: {
    subject: vi.fn().mockReturnValue('Welcome'),
    html: vi.fn().mockReturnValue('<p>Welcome</p>'),
    text: vi.fn().mockReturnValue('Welcome'),
  },
}));

// ---------------------------------------------------------------------------
// Mock rate-limit-redis — not needed in tests
// ---------------------------------------------------------------------------
vi.mock('rate-limit-redis', () => ({
  RedisStore: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Ensure AUTH_SECRET is set for JWT signing in tests
// ---------------------------------------------------------------------------
process.env.AUTH_SECRET = 'test-secret-for-integration-tests-minimum-32-chars';
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_ENABLED = 'false';
