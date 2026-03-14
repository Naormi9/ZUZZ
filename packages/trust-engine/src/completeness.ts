import type {
  CompletenessScore,
  ListingBase,
  ListingVertical,
  CarListing,
  PropertyListing,
  MarketListing,
} from '@zuzz/types';

// ---------------------------------------------------------------------------
// Field definition
// ---------------------------------------------------------------------------

export interface FieldDefinition {
  /** Dot-path to the field on the listing object (e.g. "car.mileage"). */
  path: string;
  /** Whether the field is mandatory for a complete listing. */
  required: boolean;
  /** User-facing label used in "missing fields" suggestions. */
  label: string;
  labelHe: string;
}

// ---------------------------------------------------------------------------
// Per-vertical field lists
// ---------------------------------------------------------------------------

const baseFields: FieldDefinition[] = [
  { path: 'title', required: true, label: 'Title', labelHe: 'כותרת' },
  { path: 'description', required: false, label: 'Description', labelHe: 'תיאור' },
  { path: 'price.amount', required: true, label: 'Price', labelHe: 'מחיר' },
  { path: 'location.city', required: true, label: 'City', labelHe: 'עיר' },
  { path: 'media', required: true, label: 'Photos', labelHe: 'תמונות' },
];

const carFields: FieldDefinition[] = [
  ...baseFields,
  { path: 'car.make', required: true, label: 'Make', labelHe: 'יצרן' },
  { path: 'car.model', required: true, label: 'Model', labelHe: 'דגם' },
  { path: 'car.year', required: true, label: 'Year', labelHe: 'שנה' },
  { path: 'car.mileage', required: true, label: 'Mileage', labelHe: "קילומטראז'" },
  { path: 'car.handCount', required: true, label: 'Hand count', labelHe: 'מספר יד' },
  { path: 'car.gearbox', required: true, label: 'Gearbox', labelHe: 'תיבת הילוכים' },
  { path: 'car.fuelType', required: true, label: 'Fuel type', labelHe: 'סוג דלק' },
  { path: 'car.ownershipType', required: true, label: 'Ownership type', labelHe: 'סוג בעלות' },
  { path: 'car.bodyType', required: false, label: 'Body type', labelHe: 'סוג מרכב' },
  { path: 'car.color', required: false, label: 'Color', labelHe: 'צבע' },
  { path: 'car.engineVolume', required: false, label: 'Engine volume', labelHe: 'נפח מנוע' },
  { path: 'car.horsepower', required: false, label: 'Horsepower', labelHe: 'כוח סוס' },
  { path: 'car.testUntil', required: false, label: 'Test date', labelHe: 'תאריך טסט' },
  { path: 'car.licensePlate', required: false, label: 'License plate', labelHe: 'מספר רישוי' },
  { path: 'car.vin', required: false, label: 'VIN', labelHe: 'מספר שלדה' },
  { path: 'car.trim', required: false, label: 'Trim level', labelHe: 'רמת גימור' },
  {
    path: 'car.maintenanceHistory',
    required: false,
    label: 'Maintenance history',
    labelHe: 'היסטוריית טיפולים',
  },
  { path: 'car.features', required: false, label: 'Features', labelHe: 'תוספות' },
  { path: 'documents', required: false, label: 'Documents', labelHe: 'מסמכים' },
];

const homeFields: FieldDefinition[] = [
  ...baseFields,
  { path: 'property.propertyType', required: true, label: 'Property type', labelHe: 'סוג נכס' },
  { path: 'property.listingType', required: true, label: 'Listing type', labelHe: 'סוג מודעה' },
  { path: 'property.rooms', required: true, label: 'Rooms', labelHe: 'חדרים' },
  { path: 'property.bathrooms', required: true, label: 'Bathrooms', labelHe: 'חדרי רחצה' },
  { path: 'property.sizeSqm', required: true, label: 'Size (sqm)', labelHe: 'שטח (מ"ר)' },
  { path: 'property.condition', required: true, label: 'Condition', labelHe: 'מצב' },
  { path: 'property.floor', required: false, label: 'Floor', labelHe: 'קומה' },
  { path: 'property.totalFloors', required: false, label: 'Total floors', labelHe: 'סה"כ קומות' },
  { path: 'property.parkingSpots', required: false, label: 'Parking', labelHe: 'חניה' },
  { path: 'property.yearBuilt', required: false, label: 'Year built', labelHe: 'שנת בנייה' },
  { path: 'property.hasSafeRoom', required: false, label: 'Safe room (mamad)', labelHe: 'ממ"ד' },
  { path: 'property.hasElevator', required: false, label: 'Elevator', labelHe: 'מעלית' },
  { path: 'property.entryDate', required: false, label: 'Entry date', labelHe: 'תאריך כניסה' },
  { path: 'property.furniture', required: false, label: 'Furniture', labelHe: 'ריהוט' },
  { path: 'property.arnona', required: false, label: 'Arnona', labelHe: 'ארנונה' },
  { path: 'documents', required: false, label: 'Documents', labelHe: 'מסמכים' },
];

const marketFields: FieldDefinition[] = [
  ...baseFields,
  { path: 'category', required: true, label: 'Category', labelHe: 'קטגוריה' },
  { path: 'condition', required: true, label: 'Condition', labelHe: 'מצב' },
  { path: 'brand', required: false, label: 'Brand', labelHe: 'מותג' },
  { path: 'shippingAvailable', required: false, label: 'Shipping info', labelHe: 'מידע משלוח' },
];

// ---------------------------------------------------------------------------
// Field registry
// ---------------------------------------------------------------------------

const fieldsByVertical: Record<ListingVertical, FieldDefinition[]> = {
  cars: carFields,
  homes: homeFields,
  market: marketFields,
};

/**
 * Returns the field definitions for a given vertical.
 */
export function getFieldDefinitions(vertical: ListingVertical): FieldDefinition[] {
  return fieldsByVertical[vertical] ?? baseFields;
}

// ---------------------------------------------------------------------------
// Value resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a dot-path on an object. Returns `undefined` when any segment is
 * missing.
 */
function resolveField(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

/**
 * Determines whether a resolved value counts as "filled".
 * - null / undefined => not filled
 * - empty string => not filled
 * - empty array => not filled
 * - 0 for numeric fields is considered filled (explicit zero is meaningful)
 */
function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------

/**
 * Computes a completeness score for a listing based on the vertical-specific
 * field definitions.  Required fields are weighted more heavily than optional
 * ones.
 */
export function computeCompleteness(
  listing: ListingBase,
  overrideFields?: FieldDefinition[],
): CompletenessScore {
  const fields = overrideFields ?? getFieldDefinitions(listing.vertical);

  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  const listingObj = listing as unknown as Record<string, unknown>;

  const missingRequired: FieldDefinition[] = [];
  const missingOptional: FieldDefinition[] = [];
  let filledCount = 0;

  for (const field of requiredFields) {
    if (isFilled(resolveField(listingObj, field.path))) {
      filledCount++;
    } else {
      missingRequired.push(field);
    }
  }

  for (const field of optionalFields) {
    if (isFilled(resolveField(listingObj, field.path))) {
      filledCount++;
    } else {
      missingOptional.push(field);
    }
  }

  const totalFields = fields.length;

  // Weighted score: required fields contribute 70%, optional 30%
  const requiredRatio =
    requiredFields.length > 0
      ? (requiredFields.length - missingRequired.length) / requiredFields.length
      : 1;
  const optionalRatio =
    optionalFields.length > 0
      ? (optionalFields.length - missingOptional.length) / optionalFields.length
      : 1;

  const score = Math.round((requiredRatio * 70 + optionalRatio * 30) * 100) / 100;

  // Suggestions: prioritise missing required fields, then pick top optional
  const suggestions: string[] = [
    ...missingRequired.map((f) => `Add ${f.label} (required)`),
    ...missingOptional.slice(0, 3).map((f) => `Add ${f.label} to improve your listing`),
  ];

  return {
    score: Math.round(score),
    filledFields: filledCount,
    totalFields,
    missingFields: [...missingRequired.map((f) => f.path), ...missingOptional.map((f) => f.path)],
    suggestions,
  };
}
