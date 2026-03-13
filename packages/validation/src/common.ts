import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const moneySchema = z.object({
  amount: z.number().min(0),
  currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
});

export const israeliPhoneSchema = z.string().regex(
  /^(\+972|0)(5[0-9]|7[2-9])\d{7}$/,
  'מספר טלפון ישראלי לא תקין',
);

export const israeliIdSchema = z.string().regex(
  /^\d{9}$/,
  'מספר תעודת זהות לא תקין',
);

export const licensePlateSchema = z.string().regex(
  /^\d{2,3}-?\d{2,3}-?\d{2,3}$/,
  'מספר רישוי לא תקין',
);

export const vinSchema = z.string().regex(
  /^[A-HJ-NPR-Z0-9]{17}$/,
  'VIN לא תקין',
);
