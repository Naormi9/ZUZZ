import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '@zuzz/redis';

const isEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

function createStore(prefix?: string) {
  if (!isEnabled) return undefined;
  try {
    const redis = getRedis();
    return new RedisStore({
      prefix: prefix ? `rl:${prefix}:` : 'rl:',
      sendCommand: (...args: string[]) => redis.call(args[0]!, ...args.slice(1)) as Promise<any>,
    });
  } catch {
    return undefined;
  }
}

function createLimiter(windowMs: number, max: number, message: string, prefix?: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !isEnabled,
    store: createStore(prefix),
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message },
    },
  });
}

/** Global rate limit: 200 requests/minute per IP */
export const globalRateLimiter = createLimiter(
  60_000, 200,
  'יותר מדי בקשות. נסה שוב בעוד דקה.',
  'global',
);

/** Auth rate limit: 10 requests/minute per IP */
export const authRateLimiter = createLimiter(
  60_000, 10,
  'יותר מדי ניסיונות. נסה שוב בעוד דקה.',
  'auth',
);

/** Upload rate limit: 20 requests/minute per IP */
export const uploadRateLimiter = createLimiter(
  60_000, 20,
  'יותר מדי העלאות. נסה שוב בעוד דקה.',
  'upload',
);

/** Message send rate limit: 30 messages/minute per IP */
export const messageRateLimiter = createLimiter(
  60_000, 30,
  'יותר מדי הודעות. נסה שוב בעוד דקה.',
  'message',
);

/** Lead creation rate limit: 15 leads/minute per IP */
export const leadRateLimiter = createLimiter(
  60_000, 15,
  'יותר מדי בקשות ליצירת לידים. נסה שוב בעוד דקה.',
  'lead',
);

/** Report rate limit: 5 reports/minute per IP */
export const reportRateLimiter = createLimiter(
  60_000, 5,
  'יותר מדי דיווחים. נסה שוב בעוד דקה.',
  'report',
);
