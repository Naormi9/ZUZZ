import type {
  TrustCategory,
  TrustFactor,
  ListingBase,
  ListingVertical,
  UserProfile,
} from '@zuzz/types';

// ---------------------------------------------------------------------------
// Rule definition types
// ---------------------------------------------------------------------------

/**
 * A single evaluatable trust rule.  Each rule inspects a listing (and
 * optionally its seller profile) and returns a numeric score between 0 and 1
 * together with metadata that feeds the user-facing trust breakdown.
 */
export interface EvaluatedRule {
  id: string;
  category: TrustCategory;
  weight: number;
  /** Normalised 0-1 contribution (0 = worst, 1 = best). */
  score: number;
  status: TrustFactor['status'];
  label: string;
  labelHe: string;
  description?: string;
}

export interface RuleEvaluationContext {
  listing: ListingBase;
  sellerProfile?: UserProfile;
  /** Additional vertical-specific data attached by the caller. */
  extra?: Record<string, unknown>;
}

export interface TrustRuleDefinition {
  id: string;
  name: string;
  vertical: ListingVertical | 'all';
  category: TrustCategory;
  weight: number;
  evaluate: (ctx: RuleEvaluationContext) => EvaluatedRule | null;
}

// ---------------------------------------------------------------------------
// Common rules (applicable to every vertical)
// ---------------------------------------------------------------------------

/**
 * Seller verification — checks the seller's verification status from their
 * profile.  A fully verified seller earns the full weight; pending gets
 * partial credit; unverified or rejected scores zero.
 */
export const sellerVerificationRule: TrustRuleDefinition = {
  id: 'common:seller_verification',
  name: 'Seller Verification',
  vertical: 'all',
  category: 'identity',
  weight: 20,
  evaluate(ctx) {
    const profile = ctx.sellerProfile;
    if (!profile) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0,
        status: 'warning',
        label: 'Seller not verified',
        labelHe: 'המוכר לא מאומת',
        description: 'No seller profile information available.',
      };
    }

    const verificationStatus = profile.verificationStatus;

    if (verificationStatus === 'verified') {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 1,
        status: 'positive',
        label: 'Verified seller',
        labelHe: 'מוכר מאומת',
      };
    }

    if (verificationStatus === 'pending') {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.3,
        status: 'neutral',
        label: 'Seller verification pending',
        labelHe: 'אימות מוכר בתהליך',
      };
    }

    // rejected / expired / unknown
    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: 0,
      status: 'negative',
      label: 'Seller not verified',
      labelHe: 'המוכר לא מאומת',
    };
  },
};

/**
 * Completeness score — converts the listing's own `completenessScore` field
 * (0-100) into the normalised 0-1 trust contribution.
 */
export const completenessRule: TrustRuleDefinition = {
  id: 'common:completeness',
  name: 'Listing Completeness',
  vertical: 'all',
  category: 'completeness',
  weight: 15,
  evaluate(ctx) {
    const pct = ctx.listing.completenessScore ?? 0;
    const normalised = Math.min(Math.max(pct / 100, 0), 1);

    let status: TrustFactor['status'];
    if (normalised >= 0.8) status = 'positive';
    else if (normalised >= 0.5) status = 'neutral';
    else status = 'warning';

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: normalised,
      status,
      label: `${Math.round(normalised * 100)}% complete`,
      labelHe: `${Math.round(normalised * 100)}% הושלם`,
    };
  },
};

/**
 * Listing age — newer listings score slightly higher because the information
 * is more likely to be current.  After 90 days the contribution starts
 * declining; after 180 days it bottoms out.
 */
export const listingAgeRule: TrustRuleDefinition = {
  id: 'common:listing_age',
  name: 'Listing Age',
  vertical: 'all',
  category: 'behavior',
  weight: 5,
  evaluate(ctx) {
    const publishedAt = ctx.listing.publishedAt;
    if (!publishedAt) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.5,
        status: 'neutral',
        label: 'Not yet published',
        labelHe: 'טרם פורסם',
      };
    }

    const ageDays =
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);

    let score: number;
    if (ageDays <= 30) {
      score = 1;
    } else if (ageDays <= 90) {
      // Linear decay from 1 to 0.6
      score = 1 - ((ageDays - 30) / 60) * 0.4;
    } else if (ageDays <= 180) {
      // Linear decay from 0.6 to 0.2
      score = 0.6 - ((ageDays - 90) / 90) * 0.4;
    } else {
      score = 0.2;
    }

    const status: TrustFactor['status'] =
      ageDays <= 30 ? 'positive' : ageDays <= 90 ? 'neutral' : 'warning';

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score,
      status,
      label:
        ageDays < 1
          ? 'Listed today'
          : `Listed ${Math.floor(ageDays)} days ago`,
      labelHe:
        ageDays < 1
          ? 'פורסם היום'
          : `פורסם לפני ${Math.floor(ageDays)} ימים`,
    };
  },
};

/**
 * Response rate — sellers who respond quickly and consistently get a trust
 * boost.  Based on `sellerProfile.responseRate` (0-100%).
 */
export const responseRateRule: TrustRuleDefinition = {
  id: 'common:response_rate',
  name: 'Response Rate',
  vertical: 'all',
  category: 'behavior',
  weight: 10,
  evaluate(ctx) {
    const profile = ctx.sellerProfile;
    if (!profile || profile.responseRate == null) {
      return {
        id: this.id,
        category: this.category,
        weight: this.weight,
        score: 0.5,
        status: 'neutral',
        label: 'Response rate unknown',
        labelHe: 'שיעור תגובה לא ידוע',
      };
    }

    const rate = profile.responseRate; // 0-100
    const normalised = Math.min(Math.max(rate / 100, 0), 1);

    let status: TrustFactor['status'];
    if (normalised >= 0.8) status = 'positive';
    else if (normalised >= 0.5) status = 'neutral';
    else status = 'warning';

    return {
      id: this.id,
      category: this.category,
      weight: this.weight,
      score: normalised,
      status,
      label: `${Math.round(rate)}% response rate`,
      labelHe: `${Math.round(rate)}% שיעור תגובה`,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry of all common rules
// ---------------------------------------------------------------------------

export const commonRules: TrustRuleDefinition[] = [
  sellerVerificationRule,
  completenessRule,
  listingAgeRule,
  responseRateRule,
];
