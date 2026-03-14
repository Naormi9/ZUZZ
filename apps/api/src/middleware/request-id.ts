import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Adds a unique request ID to each request for correlation in logs.
 * Uses X-Request-ID header if provided (from load balancer), otherwise generates one.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
