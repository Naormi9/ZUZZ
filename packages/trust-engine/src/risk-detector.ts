import type {
  RiskFlag,
  ListingBase,
  CarListing,
  CarDetails,
  PropertyListing,
  MarketListing,
} from '@zuzz/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskDetectionContext {
  listing: ListingBase;
  /** Optional estimated market price for price-based heuristics. */
  estimatedMarketPrice?: number;
  /**
   * Optional list of content hashes from other active listings, used for
   * duplicate detection. Each entry should be a stable hash of the listing's
   * canonical content (e.g. title + description + key attributes).
   */
  existingContentHashes?: string[];
  /** Content hash of the current listing, for comparison. */
  contentHash?: string;
}

type RiskHeuristic = (ctx: RiskDetectionContext) => RiskFlag | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flag(
  type: string,
  severity: RiskFlag['severity'],
  message: string,
  messageHe: string,
): RiskFlag {
  return { type, severity, message, messageHe, detectedAt: new Date() };
}

function getCarDetails(listing: ListingBase): CarDetails | null {
  const car = listing as Partial<CarListing>;
  if (car.vertical !== 'cars' || !car.car) return null;
  return car.car;
}

// ---------------------------------------------------------------------------
// Price heuristics
// ---------------------------------------------------------------------------

/**
 * Flags listings priced far below market value — a common indicator of scam
 * listings or bait-and-switch tactics.
 */
const suspiciousLowPrice: RiskHeuristic = (ctx) => {
  if (!ctx.estimatedMarketPrice || ctx.estimatedMarketPrice <= 0) return null;
  const price = ctx.listing.price.amount;
  if (price <= 0) {
    return flag(
      'zero_price',
      'high',
      'Listing has zero or negative price.',
      'המודעה ללא מחיר או עם מחיר שלילי.',
    );
  }

  const ratio = price / ctx.estimatedMarketPrice;
  if (ratio < 0.4) {
    return flag(
      'suspicious_low_price',
      'high',
      `Price is ${Math.round(ratio * 100)}% of estimated market value — potentially fraudulent.`,
      `המחיר הוא ${Math.round(ratio * 100)}% מערך השוק המשוער — חשד להונאה.`,
    );
  }
  if (ratio < 0.6) {
    return flag(
      'below_market_price',
      'medium',
      `Price is significantly below market value (${Math.round(ratio * 100)}%).`,
      `המחיר נמוך משמעותית ממחיר השוק (${Math.round(ratio * 100)}%).`,
    );
  }
  return null;
};

/**
 * Flags listings priced unreasonably high — might indicate placeholder or
 * erroneous pricing.
 */
const suspiciousHighPrice: RiskHeuristic = (ctx) => {
  if (!ctx.estimatedMarketPrice || ctx.estimatedMarketPrice <= 0) return null;
  const ratio = ctx.listing.price.amount / ctx.estimatedMarketPrice;
  if (ratio > 3) {
    return flag(
      'suspicious_high_price',
      'medium',
      `Price is ${Math.round(ratio * 100)}% of estimated market value — possibly erroneous.`,
      `המחיר הוא ${Math.round(ratio * 100)}% ממחיר השוק המשוער — ייתכן שגיאה.`,
    );
  }
  return null;
};

// ---------------------------------------------------------------------------
// Car-specific mismatch heuristics
// ---------------------------------------------------------------------------

/**
 * Year vs mileage mismatch — a brand-new-year car shouldn't have extremely
 * high mileage, and a very old car with almost-zero mileage is suspicious.
 */
const yearMileageMismatch: RiskHeuristic = (ctx) => {
  const car = getCarDetails(ctx.listing);
  if (!car) return null;

  const currentYear = new Date().getFullYear();
  const age = Math.max(currentYear - car.year, 0);

  // New car (0-1 years) with > 60,000 km
  if (age <= 1 && car.mileage > 60_000) {
    return flag(
      'year_mileage_mismatch',
      'high',
      `Vehicle is from ${car.year} but has ${car.mileage.toLocaleString()} km — unusually high for a ${age <= 0 ? 'new' : 'one-year-old'} car.`,
      `הרכב משנת ${car.year} אך עם ${car.mileage.toLocaleString()} ק"מ — חריג לרכב ${age <= 0 ? 'חדש' : 'בן שנה'}.`,
    );
  }

  // Old car (10+ years) with < 10,000 km — possible odometer rollback
  if (age >= 10 && car.mileage < 10_000) {
    return flag(
      'year_mileage_mismatch',
      'high',
      `Vehicle is ${age} years old but has only ${car.mileage.toLocaleString()} km — possible odometer rollback.`,
      `הרכב בן ${age} שנים אך עם ${car.mileage.toLocaleString()} ק"מ בלבד — חשד לאיפוס מונה.`,
    );
  }

  return null;
};

/**
 * Price vs condition mismatch — a car with frame damage, accidents, and high
 * mileage should not be priced at a premium.
 */
const priceConditionMismatch: RiskHeuristic = (ctx) => {
  const car = getCarDetails(ctx.listing);
  if (!car || !ctx.estimatedMarketPrice) return null;

  const negativeSignals = [
    car.frameDamage,
    car.accidentDeclared,
    car.engineReplaced,
    car.gearboxReplaced,
    car.mileage > 200_000,
  ].filter(Boolean).length;

  // If multiple negative signals but price is at or above market
  if (negativeSignals >= 2) {
    const ratio = ctx.listing.price.amount / ctx.estimatedMarketPrice;
    if (ratio >= 0.95) {
      return flag(
        'price_condition_mismatch',
        'medium',
        'Price seems high given the reported condition issues (accidents, damage, high mileage).',
        'המחיר נראה גבוה בהתחשב בבעיות המצב המדווחות (תאונות, נזקים, קילומטראז\' גבוה).',
      );
    }
  }

  return null;
};

/**
 * Frame damage combined with "no accident" — contradictory declarations.
 */
const contradictoryDeclarations: RiskHeuristic = (ctx) => {
  const car = getCarDetails(ctx.listing);
  if (!car) return null;

  if (car.frameDamage && !car.accidentDeclared) {
    return flag(
      'contradictory_declarations',
      'high',
      'Frame damage declared but no accident reported — contradictory information.',
      'נזק שלדה מוצהר אך לא דווחה תאונה — מידע סותר.',
    );
  }

  return null;
};

/**
 * EV-specific: very low battery health in a relatively new vehicle.
 */
const evBatteryAnomaly: RiskHeuristic = (ctx) => {
  const car = getCarDetails(ctx.listing);
  if (!car || !car.isElectric || car.batteryHealth == null) return null;

  const currentYear = new Date().getFullYear();
  const age = currentYear - car.year;

  // New EV (< 3 years) with battery health below 80%
  if (age < 3 && car.batteryHealth < 80) {
    return flag(
      'ev_battery_anomaly',
      'medium',
      `Battery health is ${car.batteryHealth}% on a ${age}-year-old EV — abnormally degraded.`,
      `תקינות הסוללה ${car.batteryHealth}% ברכב חשמלי בן ${age} שנים — ירידה חריגה.`,
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// Duplicate detection framework
// ---------------------------------------------------------------------------

/**
 * Simple duplicate detection based on content hash comparison.
 * In production this would be backed by a more sophisticated similarity
 * engine (e.g. fuzzy title matching, image perceptual hashing).
 */
const duplicateDetection: RiskHeuristic = (ctx) => {
  if (!ctx.contentHash || !ctx.existingContentHashes) return null;

  if (ctx.existingContentHashes.includes(ctx.contentHash)) {
    return flag(
      'potential_duplicate',
      'medium',
      'This listing appears to be a duplicate of an existing listing.',
      'נראה שמודעה זו כפולה של מודעה קיימת.',
    );
  }

  return null;
};

/**
 * Missing media — listings with no photos are inherently less trustworthy.
 */
const missingMedia: RiskHeuristic = (ctx) => {
  if (!ctx.listing.media || ctx.listing.media.length === 0) {
    return flag(
      'missing_media',
      'medium',
      'Listing has no photos — buyers cannot visually verify the item.',
      'למודעה אין תמונות — הקונים לא יכולים לאמת ויזואלית.',
    );
  }
  if (ctx.listing.media.length === 1) {
    return flag(
      'insufficient_media',
      'low',
      'Listing has only one photo — consider adding more for credibility.',
      'למודעה תמונה אחת בלבד — מומלץ להוסיף עוד לאמינות.',
    );
  }
  return null;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const allHeuristics: RiskHeuristic[] = [
  suspiciousLowPrice,
  suspiciousHighPrice,
  yearMileageMismatch,
  priceConditionMismatch,
  contradictoryDeclarations,
  evBatteryAnomaly,
  duplicateDetection,
  missingMedia,
];

/**
 * Runs all applicable risk heuristics against a listing and returns the
 * collected risk flags.
 */
export function detectRisks(ctx: RiskDetectionContext): RiskFlag[] {
  const flags: RiskFlag[] = [];

  for (const heuristic of allHeuristics) {
    const result = heuristic(ctx);
    if (result) {
      flags.push(result);
    }
  }

  // Sort by severity: critical > high > medium > low
  const severityOrder: Record<RiskFlag['severity'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags;
}

/**
 * Utility: generates a simple content hash for duplicate detection.
 * This is a basic implementation; production would use a more robust approach.
 */
export function generateContentHash(listing: ListingBase): string {
  const parts: string[] = [
    listing.vertical,
    listing.title.toLowerCase().trim(),
    String(listing.price.amount),
    listing.price.currency,
    listing.location.city ?? '',
  ];

  // Add car-specific fields if available
  const car = getCarDetails(listing);
  if (car) {
    parts.push(car.make, car.model, String(car.year), String(car.mileage));
  }

  // Simple hash — in production use a proper hash function
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `zh_${Math.abs(hash).toString(36)}`;
}
