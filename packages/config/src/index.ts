import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  STORAGE_ENDPOINT: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
  STORAGE_BUCKET: z.string().default('zuzz-media'),
  STORAGE_REGION: z.string().default('us-east-1'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_FROM: z.string().email().default('noreply@zuzz.co.il'),
  API_URL: z.string().url().default('http://localhost:4000'),
  API_PORT: z.coerce.number().default(4000),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:4000'),
  MAPS_PROVIDER: z.enum(['mock', 'google', 'mapbox']).default('mock'),
  MAPS_API_KEY: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(['sandbox', 'stripe', 'tranzilla']).default('sandbox'),
  PAYMENT_API_KEY: z.string().optional(),
  FEATURE_FLAGS_PROVIDER: z.enum(['local', 'launchdarkly']).default('local'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (data.AUTH_SECRET.includes('change-me') || data.AUTH_SECRET.includes('dev-secret')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_SECRET must not contain placeholder values in production',
        path: ['AUTH_SECRET'],
      });
    }
    if (data.STORAGE_ACCESS_KEY === 'minioadmin') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STORAGE_ACCESS_KEY must not be default value in production',
        path: ['STORAGE_ACCESS_KEY'],
      });
    }
    if (data.MAPS_PROVIDER === 'mock') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MAPS_PROVIDER must not be mock in production',
        path: ['MAPS_PROVIDER'],
      });
    }
    if (data.PAYMENT_PROVIDER === 'sandbox') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PAYMENT_PROVIDER must not be sandbox in production',
        path: ['PAYMENT_PROVIDER'],
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}

export function validateConfig(): void {
  envSchema.parse(process.env);
}

export { envSchema };

// Israeli regions for location data
export const ISRAELI_REGIONS = [
  { id: 'north', name: 'צפון', nameEn: 'North' },
  { id: 'haifa', name: 'חיפה', nameEn: 'Haifa' },
  { id: 'center', name: 'מרכז', nameEn: 'Center' },
  { id: 'tel_aviv', name: 'תל אביב', nameEn: 'Tel Aviv' },
  { id: 'jerusalem', name: 'ירושלים', nameEn: 'Jerusalem' },
  { id: 'south', name: 'דרום', nameEn: 'South' },
  { id: 'sharon', name: 'שרון', nameEn: 'Sharon' },
  { id: 'shfela', name: 'שפלה', nameEn: 'Shfela' },
  { id: 'judea_samaria', name: 'יהודה ושומרון', nameEn: 'Judea & Samaria' },
] as const;

export const ISRAELI_CITIES = [
  { name: 'תל אביב-יפו', nameEn: 'Tel Aviv-Yafo', region: 'tel_aviv' },
  { name: 'ירושלים', nameEn: 'Jerusalem', region: 'jerusalem' },
  { name: 'חיפה', nameEn: 'Haifa', region: 'haifa' },
  { name: 'ראשון לציון', nameEn: 'Rishon LeZion', region: 'center' },
  { name: 'פתח תקווה', nameEn: 'Petah Tikva', region: 'center' },
  { name: 'אשדוד', nameEn: 'Ashdod', region: 'south' },
  { name: 'נתניה', nameEn: 'Netanya', region: 'sharon' },
  { name: 'באר שבע', nameEn: 'Beer Sheva', region: 'south' },
  { name: 'חולון', nameEn: 'Holon', region: 'tel_aviv' },
  { name: 'בני ברק', nameEn: 'Bnei Brak', region: 'tel_aviv' },
  { name: 'רמת גן', nameEn: 'Ramat Gan', region: 'tel_aviv' },
  { name: 'אשקלון', nameEn: 'Ashkelon', region: 'south' },
  { name: 'רחובות', nameEn: 'Rehovot', region: 'center' },
  { name: 'בת ים', nameEn: 'Bat Yam', region: 'tel_aviv' },
  { name: 'הרצליה', nameEn: 'Herzliya', region: 'sharon' },
  { name: 'כפר סבא', nameEn: 'Kfar Saba', region: 'sharon' },
  { name: 'רעננה', nameEn: 'Raanana', region: 'sharon' },
  { name: 'מודיעין-מכבים-רעות', nameEn: 'Modiin', region: 'center' },
  { name: 'לוד', nameEn: 'Lod', region: 'center' },
  { name: 'רמלה', nameEn: 'Ramla', region: 'center' },
  { name: 'נצרת', nameEn: 'Nazareth', region: 'north' },
  { name: 'עכו', nameEn: 'Akko', region: 'north' },
  { name: 'אילת', nameEn: 'Eilat', region: 'south' },
  { name: 'קריית גת', nameEn: 'Kiryat Gat', region: 'south' },
  { name: 'גבעתיים', nameEn: 'Givatayim', region: 'tel_aviv' },
] as const;
