/**
 * Creates an Express app instance configured for testing.
 * This avoids importing the main index.ts which starts the HTTP server.
 */
import express from 'express';
import cookieParser from 'cookie-parser';

import { authRouter } from '../routes/auth';
import { carsRouter } from '../routes/cars';
import { healthRouter } from '../routes/health';
import { uploadRouter } from '../routes/upload';
import { messagesRouter } from '../routes/messages';
import { leadsRouter } from '../routes/leads';
import { favoritesRouter } from '../routes/favorites';
import { listingsRouter } from '../routes/listings';
import { notificationsRouter } from '../routes/notifications';
import { analyticsRouter } from '../routes/analytics';
import { adminRouter } from '../routes/admin';
import { organizationsRouter } from '../routes/organizations';
import { promotionsRouter } from '../routes/promotions';
import { subscriptionsRouter } from '../routes/subscriptions';
import { deviceTokensRouter } from '../routes/device-tokens';
import { savedSearchesRouter } from '../routes/saved-searches';
import { listingWatchesRouter } from '../routes/listing-watches';
import { checkoutRouter } from '../routes/checkout';
import { pushRouter } from '../routes/push';
import { growthRouter } from '../routes/growth';
import { paymentsRouter } from '../routes/payments';
import { errorHandler } from '../middleware/error-handler';

export function createTestApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Mount routes (no rate limiters in tests)
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/cars', carsRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/promotions', promotionsRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/device-tokens', deviceTokensRouter);
  app.use('/api/saved-searches', savedSearchesRouter);
  app.use('/api/listing-watches', listingWatchesRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/growth', growthRouter);
  app.use('/api/payments', paymentsRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}
