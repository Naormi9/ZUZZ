import type { CarListing, CarDetails, TrustFactor } from '@zuzz/types';
import type { TrustRuleDefinition, RuleEvaluationContext, EvaluatedRule } from './common-rules';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCarDetails(ctx: RuleEvaluationContext): CarDetails | null {
  const listing = ctx.listing as Partial<CarListing>;
  return listing.car ?? null;
}

function getCarListing(ctx: RuleEvaluationContext): CarListing | null {
  const listing = ctx.listing as Partial<CarListing>;
  if (listing.vertical !== 'cars' || !listing.car) return null;
  return listing as CarListing;
}

// ---------------------------------------------------------------------------
// Car-specific trust rules
// ---------------------------------------------------------------------------

/**
 * Verified owner / dealer badge.
 * Checks the listing's `sellerType` and whether trust factors already include
 * a verified_owner or verified_dealer entry.
 */
export const verifiedOwnerDealerRule: TrustRuleDefinition = {
  id: 'car:verified_owner_dealer',
  name: 'Verified Owner / Dealer',
  vertical: 'cars',
  category: 'verification',
  weight: 15,
  evaluate(ctx) {
    const car = getCarListing(ctx);
    if (!car) return null;

    const hasVerifiedOwner = car.trustFactors?.some(
      (f) => f.type === 'verified_owner' && f.status === 'positive',
    );
    const hasVerifiedDealer = car.trustFactors?.some(
      (f) => f.type === 'verified_dealer' && f.status === 'positive',
    );

    if (hasVerifiedOwner || hasVerifiedDealer) {
      const isDealer = hasVerifiedDealer;
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive' as const,
        label: isDealer ? 'Verified dealer' : 'Verified owner',
        labelHe: isDealer ? 'סוחר מאומת' : 'בעלים מאומת',
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0,
      status: 'neutral' as const,
      label: 'Owner not verified',
      labelHe: 'בעלים לא מאומת',
    };
  },
};

/**
 * Accident history declaration.
 * A declared "no accidents" is positive; declared accidents with details is
 * neutral (honest disclosure); declared accidents without details is a warning.
 */
export const accidentHistoryRule: TrustRuleDefinition = {
  id: 'car:accident_history',
  name: 'Accident History',
  vertical: 'cars',
  category: 'history',
  weight: 12,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    if (!car.accidentDeclared) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'No accidents declared',
        labelHe: 'ללא תאונות מוצהרות',
      };
    }

    // Accident declared — honest disclosure is better than nothing
    if (car.accidentDetails && car.accidentDetails.trim().length > 0) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.4,
        status: 'neutral',
        label: 'Accident declared with details',
        labelHe: 'תאונה מוצהרת עם פרטים',
        description: car.accidentDetails,
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0.2,
      status: 'warning',
      label: 'Accident declared without details',
      labelHe: 'תאונה מוצהרת ללא פירוט',
    };
  },
};

/**
 * Test (Teset / טסט) validity.
 * In Israel every vehicle must pass periodic road-worthiness tests. A valid
 * test is a strong trust signal; an expired one is a red flag.
 */
export const testValidityRule: TrustRuleDefinition = {
  id: 'car:test_validity',
  name: 'Test Validity',
  vertical: 'cars',
  category: 'documentation',
  weight: 10,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    if (!car.testUntil) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.2,
        status: 'warning',
        label: 'Test date not provided',
        labelHe: 'תאריך טסט לא צוין',
      };
    }

    const testDate = new Date(car.testUntil);
    const now = new Date();
    const daysUntilExpiry = (testDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry > 60) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Valid test',
        labelHe: 'טסט בתוקף',
      };
    }

    if (daysUntilExpiry > 0) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.6,
        status: 'warning',
        label: 'Test expiring soon',
        labelHe: 'טסט עומד לפוג',
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0,
      status: 'negative',
      label: 'Test expired',
      labelHe: 'טסט פג תוקף',
    };
  },
};

/**
 * Mileage consistency — checks whether the declared mileage is plausible
 * given the vehicle's age. Average annual mileage in Israel is roughly
 * 15,000 km. Listings claiming significantly lower mileage than expected may
 * indicate odometer tampering, while very high mileage is just informational.
 */
export const mileageConsistencyRule: TrustRuleDefinition = {
  id: 'car:mileage_consistency',
  name: 'Mileage Consistency',
  vertical: 'cars',
  category: 'history',
  weight: 8,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(currentYear - car.year, 1);
    const avgAnnualKm = 15_000;
    const expectedMileage = vehicleAge * avgAnnualKm;
    const ratio = car.mileage / expectedMileage;

    // Suspiciously low — possible odometer rollback
    if (ratio < 0.3 && vehicleAge > 3) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.2,
        status: 'warning',
        label: 'Unusually low mileage for vehicle age',
        labelHe: "קילומטראז' נמוך באופן חשוד ביחס לגיל הרכב",
      };
    }

    // Reasonable range
    if (ratio <= 1.5) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Mileage consistent with vehicle age',
        labelHe: "קילומטראז' תואם לגיל הרכב",
      };
    }

    // Higher than average but not extreme
    if (ratio <= 2.5) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.6,
        status: 'neutral',
        label: 'Higher than average mileage',
        labelHe: "קילומטראז' גבוה מהממוצע",
      };
    }

    // Very high mileage
    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0.3,
      status: 'warning',
      label: 'Very high mileage',
      labelHe: "קילומטראז' גבוה מאוד",
    };
  },
};

/**
 * Price analysis — flags suspiciously low prices.
 *
 * Without access to real-time market data we rely on a simple heuristic:
 * the caller can supply `extra.estimatedMarketPrice` (number). When absent
 * the rule returns neutral.
 */
export const priceAnalysisRule: TrustRuleDefinition = {
  id: 'car:price_analysis',
  name: 'Price Analysis',
  vertical: 'cars',
  category: 'pricing',
  weight: 10,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    const marketPrice = ctx.extra?.estimatedMarketPrice as number | undefined;
    const listingPrice = ctx.listing.price.amount;

    if (!marketPrice || marketPrice <= 0) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.5,
        status: 'neutral',
        label: 'Market price data unavailable',
        labelHe: 'נתוני מחיר שוק לא זמינים',
      };
    }

    const ratio = listingPrice / marketPrice;

    // Suspiciously cheap — less than 60% of market value
    if (ratio < 0.6) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.1,
        status: 'negative',
        label: 'Price significantly below market value',
        labelHe: 'מחיר נמוך משמעותית ממחיר השוק',
        description: `Listed at ${Math.round(ratio * 100)}% of estimated market value.`,
      };
    }

    // Below market but not suspicious
    if (ratio < 0.85) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.7,
        status: 'neutral',
        label: 'Below market price',
        labelHe: 'מתחת למחיר השוק',
      };
    }

    // Fair market range (85% - 120%)
    if (ratio <= 1.2) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Price in market range',
        labelHe: 'מחיר בטווח השוק',
      };
    }

    // Above market
    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0.6,
      status: 'neutral',
      label: 'Above market price',
      labelHe: 'מעל מחיר השוק',
    };
  },
};

/**
 * Documentation completeness — checks how many key documents are attached
 * and verified.
 */
export const documentationCompletenessRule: TrustRuleDefinition = {
  id: 'car:documentation_completeness',
  name: 'Documentation Completeness',
  vertical: 'cars',
  category: 'documentation',
  weight: 10,
  evaluate(ctx) {
    const car = getCarListing(ctx);
    if (!car) return null;

    const docs = car.documents ?? [];
    const verifiedDocs = docs.filter((d) => d.verificationStatus === 'verified');

    const importantDocTypes = [
      'vehicle_license',
      'vehicle_test',
      'insurance',
      'ownership_certificate',
    ] as const;

    let coveredCount = 0;
    for (const docType of importantDocTypes) {
      if (docs.some((d) => d.type === docType)) {
        coveredCount++;
      }
    }

    const coverageRatio = coveredCount / importantDocTypes.length;
    const verificationBonus = docs.length > 0 ? verifiedDocs.length / docs.length : 0;

    // Weighted: 70% coverage, 30% verification status
    const score = coverageRatio * 0.7 + verificationBonus * 0.3;

    let status: TrustFactor['status'];
    if (score >= 0.8) status = 'positive';
    else if (score >= 0.4) status = 'neutral';
    else status = 'warning';

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score,
      status,
      label: `${coveredCount}/${importantDocTypes.length} key documents provided`,
      labelHe: `${coveredCount}/${importantDocTypes.length} מסמכים מרכזיים צורפו`,
    };
  },
};

/**
 * Maintenance history — full agency service history scores best; none is worst.
 */
export const maintenanceHistoryRule: TrustRuleDefinition = {
  id: 'car:maintenance_history',
  name: 'Maintenance History',
  vertical: 'cars',
  category: 'history',
  weight: 8,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    const history = car.maintenanceHistory;

    const scoreMap: Record<string, number> = {
      full_agency: 1,
      partial_agency: 0.7,
      independent: 0.4,
      none: 0.1,
    };

    const labelMap: Record<string, { en: string; he: string }> = {
      full_agency: { en: 'Full agency maintenance', he: 'טיפולים מלאים ביבואן' },
      partial_agency: { en: 'Partial agency maintenance', he: 'טיפולים חלקיים ביבואן' },
      independent: { en: 'Independent maintenance', he: 'טיפולים במוסך עצמאי' },
      none: { en: 'No maintenance records', he: 'ללא רישומי טיפולים' },
    };

    if (!history) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.3,
        status: 'neutral',
        label: 'Maintenance history not specified',
        labelHe: 'היסטוריית טיפולים לא צוינה',
      };
    }

    const score = scoreMap[history] ?? 0.3;
    const labels = labelMap[history];

    let status: TrustFactor['status'];
    if (score >= 0.8) status = 'positive';
    else if (score >= 0.5) status = 'neutral';
    else status = 'warning';

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score,
      status,
      label: labels?.en ?? 'Unknown maintenance history',
      labelHe: labels?.he ?? 'היסטוריית טיפולים לא ידועה',
    };
  },
};

/**
 * Warranty check — an active warranty is a positive signal.
 */
export const warrantyRule: TrustRuleDefinition = {
  id: 'car:warranty',
  name: 'Warranty Status',
  vertical: 'cars',
  category: 'documentation',
  weight: 5,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    if (car.warrantyExists) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Warranty active',
        labelHe: 'אחריות בתוקף',
        description: car.warrantyDetails ?? undefined,
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0.3,
      status: 'neutral',
      label: 'No warranty',
      labelHe: 'ללא אחריות',
    };
  },
};

/**
 * Single owner bonus — first-hand vehicles are generally preferred.
 */
export const singleOwnerRule: TrustRuleDefinition = {
  id: 'car:single_owner',
  name: 'Single Owner',
  vertical: 'cars',
  category: 'history',
  weight: 5,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    if (car.handCount === 1) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Single owner (first hand)',
        labelHe: 'יד ראשונה',
      };
    }

    if (car.handCount === 2) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.7,
        status: 'neutral',
        label: 'Second hand',
        labelHe: 'יד שנייה',
      };
    }

    // Three or more
    const score = Math.max(0.2, 1 - car.handCount * 0.15);
    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score,
      status: 'neutral',
      label: `Hand ${car.handCount}`,
      labelHe: `יד ${car.handCount}`,
    };
  },
};

/**
 * Frame damage flag — declared frame damage is a significant negative signal.
 */
export const frameDamageRule: TrustRuleDefinition = {
  id: 'car:frame_damage',
  name: 'Frame Damage',
  vertical: 'cars',
  category: 'history',
  weight: 12,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    if (car.frameDamage) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0,
        status: 'negative',
        label: 'Frame damage declared',
        labelHe: 'נזק שלדה מוצהר',
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 1,
      status: 'positive',
      label: 'No frame damage',
      labelHe: 'ללא נזק שלדה',
    };
  },
};

/**
 * EV battery health — relevant only for electric/PHEV vehicles.
 * Battery health >= 90% is excellent; >= 80% is acceptable; below 70% is a concern.
 */
export const evBatteryHealthRule: TrustRuleDefinition = {
  id: 'car:ev_battery_health',
  name: 'EV Battery Health',
  vertical: 'cars',
  category: 'history',
  weight: 10,
  evaluate(ctx) {
    const car = getCarDetails(ctx);
    if (!car) return null;

    // Only applies to electric vehicles
    if (!car.isElectric) return null;

    if (car.batteryHealth == null) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.3,
        status: 'warning',
        label: 'Battery health not reported',
        labelHe: 'תקינות סוללה לא דווחה',
      };
    }

    const health = car.batteryHealth;

    if (health >= 90) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: `Battery health: ${health}%`,
        labelHe: `תקינות סוללה: ${health}%`,
      };
    }

    if (health >= 80) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.7,
        status: 'neutral',
        label: `Battery health: ${health}%`,
        labelHe: `תקינות סוללה: ${health}%`,
      };
    }

    if (health >= 70) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.4,
        status: 'warning',
        label: `Battery health: ${health}%`,
        labelHe: `תקינות סוללה: ${health}%`,
      };
    }

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0.1,
      status: 'negative',
      label: `Battery health: ${health}% — degraded`,
      labelHe: `תקינות סוללה: ${health}% — מופחתת`,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry of all car-specific rules
// ---------------------------------------------------------------------------

export const carRules: TrustRuleDefinition[] = [
  verifiedOwnerDealerRule,
  accidentHistoryRule,
  testValidityRule,
  mileageConsistencyRule,
  priceAnalysisRule,
  documentationCompletenessRule,
  maintenanceHistoryRule,
  warrantyRule,
  singleOwnerRule,
  frameDamageRule,
  evBatteryHealthRule,
];
