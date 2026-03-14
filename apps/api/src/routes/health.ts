import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { pingRedis } from '@zuzz/redis';

export const healthRouter = Router();

const startedAt = new Date().toISOString();
const APP_VERSION = process.env.npm_package_version ?? '0.1.0';
const GIT_SHA = process.env.GIT_SHA ?? 'unknown';

/** Liveness probe — process is alive, no dep checks */
healthRouter.get('/live', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/** Full health check — reports each dependency's status */
healthRouter.get('/', async (_req, res) => {
  const services: Record<string, string> = {};
  const timings: Record<string, number> = {};

  // Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    timings.database = Date.now() - dbStart;
    services.database = 'connected';
  } catch {
    services.database = 'disconnected';
  }

  // Redis
  try {
    const redisStart = Date.now();
    const ok = await pingRedis();
    timings.redis = Date.now() - redisStart;
    services.redis = ok ? 'connected' : 'disconnected';
  } catch {
    services.redis = 'disconnected';
  }

  const critical = services.database === 'connected' && services.redis === 'connected';
  const status = critical ? 'ok' : 'unhealthy';

  res.status(critical ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    gitSha: GIT_SHA,
    uptime: process.uptime(),
    startedAt,
    environment: process.env.NODE_ENV ?? 'development',
    services,
    timings,
  });
});

/** Readiness probe — all services must be healthy */
healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await pingRedis();
    if (!redisOk) throw new Error('Redis not ready');
    res.json({ ready: true, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
});

/** Startup probe — run once to verify initial connectivity */
healthRouter.get('/startup', async (_req, res) => {
  const checks: Record<string, boolean> = {};
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }
  try {
    checks.redis = await pingRedis();
  } catch {
    checks.redis = false;
  }

  const ok = checks.database && checks.redis;
  res.status(ok ? 200 : 503).json({
    started: ok,
    checks,
    timestamp: new Date().toISOString(),
  });
});
