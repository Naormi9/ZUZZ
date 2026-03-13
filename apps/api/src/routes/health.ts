import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { pingRedis } from '@zuzz/redis';

export const healthRouter = Router();

/** Liveness probe — process is alive, no dep checks */
healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Full health check — reports each dependency's status */
healthRouter.get('/', async (_req, res) => {
  const services: Record<string, string> = {};

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = 'connected';
  } catch {
    services.database = 'disconnected';
  }

  // Redis
  try {
    const ok = await pingRedis();
    services.redis = ok ? 'connected' : 'disconnected';
  } catch {
    services.redis = 'disconnected';
  }

  const critical = services.database === 'connected' && services.redis === 'connected';
  const status = critical ? 'ok' : 'unhealthy';

  res.status(critical ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services,
  });
});

/** Readiness probe — all services must be healthy */
healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await pingRedis();
    if (!redisOk) throw new Error('Redis not ready');
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});
