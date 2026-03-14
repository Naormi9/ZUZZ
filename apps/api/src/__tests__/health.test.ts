import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { pingRedis } from '@zuzz/redis';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>;
};
const mockPingRedis = pingRedis as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/health/live
// ---------------------------------------------------------------------------
describe('GET /api/health/live', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
describe('GET /api/health', () => {
  it('returns 200 when all services are connected', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
    mockPingRedis.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services.database).toBe('connected');
    expect(res.body.services.redis).toBe('connected');
    expect(res.body.version).toBe('0.1.0');
  });

  it('returns 503 when database is disconnected', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
    mockPingRedis.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.services.database).toBe('disconnected');
    expect(res.body.services.redis).toBe('connected');
  });

  it('returns 503 when redis is disconnected', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
    mockPingRedis.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.services.database).toBe('connected');
    expect(res.body.services.redis).toBe('disconnected');
  });

  it('returns 503 when both services are down', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'));
    mockPingRedis.mockRejectedValueOnce(new Error('Redis down'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.services.database).toBe('disconnected');
    expect(res.body.services.redis).toBe('disconnected');
  });
});

// ---------------------------------------------------------------------------
// GET /api/health/ready
// ---------------------------------------------------------------------------
describe('GET /api/health/ready', () => {
  it('returns ready: true when all services are healthy', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
    mockPingRedis.mockResolvedValueOnce(true);

    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('returns 503 with ready: false when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
  });

  it('returns 503 with ready: false when redis is not ready', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
    mockPingRedis.mockResolvedValueOnce(false);

    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
  });
});
