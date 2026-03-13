import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:error');

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code }, err.message);
      captureException(err);
    } else {
      logger.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'שגיאת תיקוף',
        details,
      },
    });
  }

  logger.error({ err }, 'Unhandled error');
  captureException(err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'שגיאת שרת פנימית',
    },
  });
}

/** Capture exception to Sentry if configured */
function captureException(err: Error) {
  try {
    const Sentry = require('@sentry/node');
    if (Sentry.isInitialized?.()) {
      Sentry.captureException(err);
    }
  } catch {
    // Sentry not installed or not configured — skip silently
  }
}
