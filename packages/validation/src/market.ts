import { z } from 'zod';

export const marketListingSchema = z.object({
  category: z.enum(['electronics', 'furniture', 'fashion', 'sports', 'garden', 'kids', 'pets', 'books', 'music', 'collectibles', 'tools', 'other']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'for_parts']),
  brand: z.string().optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  shippingAvailable: z.boolean().optional(),
  isFreeDelivery: z.boolean().optional(),
});

export const marketSearchFiltersSchema = z.object({
  category: z.array(z.string()).optional(),
  condition: z.array(z.string()).optional(),
  priceFrom: z.coerce.number().optional(),
  priceTo: z.coerce.number().optional(),
  city: z.array(z.string()).optional(),
  freeDelivery: z.coerce.boolean().optional(),
  query: z.string().optional(),
});
