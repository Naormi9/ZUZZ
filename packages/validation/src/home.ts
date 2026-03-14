import { z } from 'zod';

export const propertyDetailsSchema = z.object({
  propertyType: z.enum([
    'apartment',
    'house',
    'penthouse',
    'garden_apartment',
    'duplex',
    'studio',
    'villa',
    'cottage',
    'lot',
    'commercial',
    'office',
    'other',
  ]),
  listingType: z.enum(['sale', 'rent', 'roommates']),
  rooms: z.number().min(1).max(20),
  bathrooms: z.number().min(0).max(10),
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  sizeSqm: z.number().min(1, 'יש להזין שטח'),
  balconySqm: z.number().optional(),
  gardenSqm: z.number().optional(),
  parkingSpots: z.number().min(0).optional(),
  condition: z.enum(['new', 'renovated', 'good', 'needs_renovation', 'shell']),
  yearBuilt: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 5)
    .optional(),
  isAccessible: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasSafeRoom: z.boolean().optional(),
  hasStorage: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  hasCentralHeating: z.boolean().optional(),
  hasSolarHeater: z.boolean().optional(),
  furniture: z.enum(['none', 'partial', 'full']).optional(),
  entryDate: z.string().optional(),
  isImmediate: z.boolean().optional(),
  arnona: z.number().optional(),
  vaadBait: z.number().optional(),
});

export const propertySearchFiltersSchema = z.object({
  propertyType: z.array(z.string()).optional(),
  listingType: z.enum(['sale', 'rent', 'roommates']).optional(),
  roomsFrom: z.coerce.number().optional(),
  roomsTo: z.coerce.number().optional(),
  priceFrom: z.coerce.number().optional(),
  priceTo: z.coerce.number().optional(),
  sizeSqmFrom: z.coerce.number().optional(),
  sizeSqmTo: z.coerce.number().optional(),
  city: z.array(z.string()).optional(),
  hasParking: z.coerce.boolean().optional(),
  hasElevator: z.coerce.boolean().optional(),
  hasSafeRoom: z.coerce.boolean().optional(),
  isImmediate: z.coerce.boolean().optional(),
});
