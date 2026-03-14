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

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code, requestId }, err.message);
      captureException(err);
    } else {
      logger.warn({ code: err.code, statusCode: err.statusCode, requestId }, err.message);
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

  // Multer file size errors
  if (err && 'code' in err && (err as any).code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'הקובץ גדול מדי (מקסימום 10MB)',
      },
    });
  }

  logger.error({ err, requestId, url: req.url, method: req.method }, 'Unhandled error');
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
