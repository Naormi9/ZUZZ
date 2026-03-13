import { z } from 'zod';

export const carIdentifySchema = z.object({
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
}).refine(
  (data) => data.licensePlate || data.vin || (data.make && data.model && data.year),
  { message: 'יש לספק מספר רישוי, VIN, או מותג+דגם+שנה' },
);

export const carDetailsSchema = z.object({
  make: z.string().min(1, 'יש לבחור יצרן'),
  model: z.string().min(1, 'יש לבחור דגם'),
  trim: z.string().optional(),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  firstRegistrationDate: z.string().optional(),
  bodyType: z.enum(['sedan', 'hatchback', 'suv', 'crossover', 'coupe', 'convertible', 'wagon', 'van', 'pickup', 'minivan', 'commercial', 'other']).optional(),
  mileage: z.number().min(0, 'קילומטראז\' חייב להיות חיובי'),
  handCount: z.number().min(0).max(20),
  ownershipType: z.enum(['private', 'company', 'leasing', 'rental', 'government', 'taxi']),
  gearbox: z.enum(['automatic', 'manual', 'robotic', 'cvt']),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'phev', 'electric', 'lpg', 'cng']),
  engineVolume: z.number().optional(),
  horsepower: z.number().optional(),
  seats: z.number().min(1).max(12).optional(),
  color: z.string().optional(),
  interiorColor: z.string().optional(),
  testUntil: z.string().optional(),
});

export const carSellerStatementsSchema = z.object({
  accidentDeclared: z.boolean(),
  accidentDetails: z.string().max(1000).optional(),
  engineReplaced: z.boolean(),
  gearboxReplaced: z.boolean(),
  frameDamage: z.boolean(),
  maintenanceHistory: z.enum(['full_agency', 'partial_agency', 'independent', 'none']).optional(),
  numKeys: z.number().min(0).max(5).optional(),
  warrantyExists: z.boolean(),
  warrantyDetails: z.string().max(500).optional(),
  recallStatus: z.enum(['none', 'open', 'resolved']).optional(),
  personalImport: z.boolean(),
});

export const carPricingSchema = z.object({
  price: z.object({
    amount: z.number().min(1000, 'מחיר מינימלי 1,000 ₪'),
    currency: z.enum(['ILS', 'USD', 'EUR']).default('ILS'),
  }),
  isNegotiable: z.boolean().default(false),
});

export const carEvSchema = z.object({
  isElectric: z.boolean(),
  batteryCapacity: z.number().optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
  batteryWarrantyUntil: z.string().optional(),
  rangeKm: z.number().optional(),
  acChargeKw: z.number().optional(),
  dcChargeKw: z.number().optional(),
  chargeConnectorType: z.enum(['type1', 'type2', 'ccs', 'chademo', 'tesla']).optional(),
});

export const carSearchFiltersSchema = z.object({
  make: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  yearFrom: z.coerce.number().optional(),
  yearTo: z.coerce.number().optional(),
  priceFrom: z.coerce.number().optional(),
  priceTo: z.coerce.number().optional(),
  mileageFrom: z.coerce.number().optional(),
  mileageTo: z.coerce.number().optional(),
  fuelType: z.array(z.enum(['petrol', 'diesel', 'hybrid', 'phev', 'electric', 'lpg', 'cng'])).optional(),
  gearbox: z.array(z.enum(['automatic', 'manual', 'robotic', 'cvt'])).optional(),
  handCountMax: z.coerce.number().optional(),
  bodyType: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  sellerType: z.array(z.enum(['private', 'dealer', 'leasing_company'])).optional(),
  city: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  hasTest: z.coerce.boolean().optional(),
  noAccidents: z.coerce.boolean().optional(),
  isElectric: z.coerce.boolean().optional(),
  verifiedSeller: z.coerce.boolean().optional(),
  hasDocuments: z.coerce.boolean().optional(),
  trustScoreMin: z.coerce.number().optional(),
});
