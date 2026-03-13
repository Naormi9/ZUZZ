import { z } from 'zod';

export const createListingBaseSchema = z.object({
  title: z.string().min(5, 'כותרת חייבת להכיל לפחות 5 תווים').max(200),
  description: z.string().max(5000).optional(),
  price: z.object({
    amount: z.number().min(0, 'מחיר חייב להיות חיובי'),
    currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
  }),
  isNegotiable: z.boolean().default(false),
  location: z.object({
    city: z.string().min(1, 'יש לבחור עיר'),
    region: z.string().optional(),
    neighborhood: z.string().optional(),
  }),
});

export const reportListingSchema = z.object({
  reason: z.enum([
    'fake_listing',
    'wrong_price',
    'wrong_info',
    'duplicate',
    'scam',
    'inappropriate',
    'sold_elsewhere',
    'other',
  ]),
  description: z.string().max(1000).optional(),
});
