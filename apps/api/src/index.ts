// Sentry must be initialized before all other imports
try {
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }
} catch {
  // Sentry not installed — continue without it
}

import { validateConfig, getConfig } from '@zuzz/config';

// Validate environment eagerly on startup — fail fast if misconfigured
try {
  validateConfig();
} catch (err) {
  console.error('❌ Environment validation failed. Check your .env file:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import pinoHttp from 'pino-http';
import { createLogger } from '@zuzz/logger';
import { disconnectRedis } from '@zuzz/redis';
import { prisma } from '@zuzz/database';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { listingsRouter } from './routes/listings';
import { carsRouter } from './routes/cars';
import { homesRouter } from './routes/homes';
import { marketRouter } from './routes/market';
import { searchRouter } from './routes/search';
import { favoritesRouter } from './routes/favorites';
import { messagesRouter } from './routes/messages';
import { leadsRouter } from './routes/leads';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { analyticsRouter } from './routes/analytics';
import { uploadRouter } from './routes/upload';
import { healthRouter } from './routes/health';
import { articlesRouter } from './routes/articles';
import { organizationsRouter } from './routes/organizations';
import { promotionsRouter } from './routes/promotions';
import { subscriptionsRouter } from './routes/subscriptions';
import { deviceTokensRouter } from './routes/device-tokens';
import { savedSearchesRouter } from './routes/saved-searches';
import { listingWatchesRouter } from './routes/listing-watches';
import { checkoutRouter } from './routes/checkout';
import { errorHandler } from './middleware/error-handler';
import {
  globalRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  messageRateLimiter,
  leadRateLimiter,
} from './middleware/rate-limiter';
import { requestId } from './middleware/request-id';
import { setupWebSocket } from './websocket';

const logger = createLogger('api');

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
    ],
    credentials: true,
  },
});

// Middleware
app.use(requestId);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some((allowed) => origin === allowed)) {
        return callback(null, true);
      }

      // Allow capacitor:// origin for mobile app
      if (origin.startsWith('capacitor://')) {
        return callback(null, true);
      }

      callback(new Error('CORS not allowed'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger: logger as any,
    autoLogging: { ignore: (req) => (req as any).url === '/api/health/live' },
    genReqId: (req) => (req as any).requestId,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, requestId: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);
app.use(globalRateLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/cars', carsRouter);
app.use('/api/homes', homesRouter);
app.use('/api/market', marketRouter);
app.use('/api/search', searchRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/messages', messageRateLimiter, messagesRouter);
app.use('/api/leads', leadRateLimiter, leadsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/upload', uploadRateLimiter, uploadRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/device-tokens', deviceTokensRouter);
app.use('/api/saved-searches', savedSearchesRouter);
app.use('/api/listing-watches', listingWatchesRouter);
app.use('/api/checkout', checkoutRouter);

// Error handling
app.use(errorHandler);

// WebSocket
setupWebSocket(io);

const PORT = process.env.API_PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'ZUZZ API started');
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Shutting down gracefully...');

  // Hard timeout to force exit
  const forceTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  try {
    // Stop accepting new connections
    httpServer.close();
    io.close();

    // Disconnect services
    await prisma.$disconnect();
    await disconnectRedis();

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, io };
