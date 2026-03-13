import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '@zuzz/redis';

const isEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

function createStore() {
  if (!isEnabled) return undefined;
  try {
    const redis = getRedis();
    return new RedisStore({
      sendCommand: (...args: string[]) => redis.call(args[0]!, ...args.slice(1)) as Promise<any>,
    });
  } catch {
    return undefined;
  }
}

/** Global rate limit: 200 requests/minute per IP */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled,
  store: createStore(),
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
  },
});

/** Auth rate limit: 10 requests/minute per IP */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled,
  store: createStore(),
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'יותר מדי ניסיונות. נסה שוב בעוד דקה.' },
  },
});

/** Upload rate limit: 20 requests/minute per IP */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isEnabled,
  store: createStore(),
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'יותר מדי העלאות. נסה שוב בעוד דקה.' },
  },
});
