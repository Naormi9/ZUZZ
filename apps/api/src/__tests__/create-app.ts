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

  // Error handling
  app.use(errorHandler);

  return app;
}
