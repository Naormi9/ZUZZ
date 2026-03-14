import type {
  TrustScore,
  TrustFactor,
  CompletenessScore,
  RiskFlag,
  ListingBase,
  ListingVertical,
  UserProfile,
} from '@zuzz/types';

import type {
  TrustRuleDefinition,
  RuleEvaluationContext,
  EvaluatedRule,
} from './rules/common-rules';
import { commonRules } from './rules/common-rules';
import { carRules } from './rules/car-rules';
import { computeCompleteness, getFieldDefinitions, type FieldDefinition } from './completeness';
import { detectRisks as detectRisksInternal, type RiskDetectionContext } from './risk-detector';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface TrustEngineConfig {
  /**
   * Additional custom rules to register alongside the built-in ones.
   * Useful for domain-specific extensions without forking the engine.
   */
  customRules?: TrustRuleDefinition[];
  /**
   * Override default field definitions for completeness scoring per vertical.
   */
  fieldOverrides?: Partial<Record<ListingVertical, FieldDefinition[]>>;
}

// ---------------------------------------------------------------------------
// TrustEngine
// ---------------------------------------------------------------------------

/**
 * Central trust scoring engine for ZUZZ.
 *
 * The engine uses a rule-based scoring system where each rule:
 * 1. Has a `weight` expressing its relative importance.
 * 2. Evaluates to a normalised score (0-1) plus metadata.
 *
 * The overall trust score is the weighted sum of all applicable rule scores,
 * normalised to a 0-100 scale.
 *
 * Usage:
 * ```ts
 * const engine = new TrustEngine();
 * const score = engine.computeScore(carListing, { sellerProfile });
 * ```
 */
export class TrustEngine {
  private readonly rules: TrustRuleDefinition[];
  private readonly fieldOverrides: Partial<Record<ListingVertical, FieldDefinition[]>>;

  constructor(config?: TrustEngineConfig) {
    this.rules = [...commonRules, ...carRules, ...(config?.customRules ?? [])];
    this.fieldOverrides = config?.fieldOverrides ?? {};
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Computes the overall trust score for a listing.
   *
   * @param listing - The listing to evaluate.
   * @param factors - Additional context for rule evaluation.
   * @returns A `TrustScore` with the overall 0-100 score and individual factor
   *          breakdowns.
   */
  computeScore(
    listing: ListingBase,
    factors?: {
      sellerProfile?: UserProfile;
      estimatedMarketPrice?: number;
      extra?: Record<string, unknown>;
    },
  ): TrustScore {
    const ctx: RuleEvaluationContext = {
      listing,
      sellerProfile: factors?.sellerProfile,
      extra: {
        ...factors?.extra,
        ...(factors?.estimatedMarketPrice != null
          ? { estimatedMarketPrice: factors.estimatedMarketPrice }
          : {}),
      },
    };

    const applicableRules = this.getApplicableRules(listing.vertical);
    const evaluatedRules = this.evaluateRules(applicableRules, ctx);

    const overall = this.computeWeightedScore(evaluatedRules);

    const trustFactors: TrustFactor[] = evaluatedRules.map((rule) => ({
      id: rule.id,
      type: rule.id,
      category: rule.category,
      status: rule.status,
      weight: rule.weight,
      score: rule.score,
      label: rule.label,
      labelHe: rule.labelHe,
      description: rule.description,
    }));

    return {
      overall,
      factors: trustFactors,
      computedAt: new Date(),
    };
  }

  /**
   * Computes listing completeness based on the vertical's required and optional
   * fields.
   *
   * @param listing - The listing to check.
   * @param overrideFields - Optional custom field list (overrides vertical defaults).
   */
  computeCompleteness(listing: ListingBase, overrideFields?: FieldDefinition[]): CompletenessScore {
    const fields = overrideFields ?? this.fieldOverrides[listing.vertical] ?? undefined;
    return computeCompleteness(listing, fields);
  }

  /**
   * Runs risk detection heuristics against a listing.
   *
   * @param listing - The listing to check.
   * @param options - Additional context for risk detection.
   */
  detectRisks(
    listing: ListingBase,
    options?: {
      estimatedMarketPrice?: number;
      existingContentHashes?: string[];
      contentHash?: string;
    },
  ): RiskFlag[] {
    const ctx: RiskDetectionContext = {
      listing,
      estimatedMarketPrice: options?.estimatedMarketPrice,
      existingContentHashes: options?.existingContentHashes,
      contentHash: options?.contentHash,
    };
    return detectRisksInternal(ctx);
  }

  /**
   * Evaluates a single rule against a listing and returns the result.
   * Useful for debugging or displaying individual trust factor details.
   */
  evaluateRule(
    ruleId: string,
    listing: ListingBase,
    factors?: {
      sellerProfile?: UserProfile;
      extra?: Record<string, unknown>;
    },
  ): EvaluatedRule | null {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    const ctx: RuleEvaluationContext = {
      listing,
      sellerProfile: factors?.sellerProfile,
      extra: factors?.extra,
    };

    return rule.evaluate(ctx);
  }

  /**
   * Returns the list of all registered rules, optionally filtered by vertical.
   */
  getRules(vertical?: ListingVertical): TrustRuleDefinition[] {
    if (!vertical) return [...this.rules];
    return this.getApplicableRules(vertical);
  }

  /**
   * Registers additional rules at runtime.
   */
  registerRules(rules: TrustRuleDefinition[]): void {
    this.rules.push(...rules);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  /**
   * Returns only the rules that apply to the given vertical (vertical-specific
   * rules + rules marked as 'all').
   */
  private getApplicableRules(vertical: ListingVertical): TrustRuleDefinition[] {
    return this.rules.filter((rule) => rule.vertical === 'all' || rule.vertical === vertical);
  }

  /**
   * Evaluates a set of rules and collects their results. Rules that return
   * `null` (e.g. an EV rule for a non-EV car) are silently skipped.
   */
  private evaluateRules(rules: TrustRuleDefinition[], ctx: RuleEvaluationContext): EvaluatedRule[] {
    const results: EvaluatedRule[] = [];
    for (const rule of rules) {
      const result = rule.evaluate(ctx);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  /**
   * Computes a weighted average of evaluated rule scores, normalised to 0-100.
   *
   * The formula:
   *   overall = (sum of (rule.score * rule.weight)) / (sum of weights) * 100
   *
   * If no rules were evaluated (e.g. all returned null), returns 50 as a
   * neutral default.
   */
  private computeWeightedScore(evaluatedRules: EvaluatedRule[]): number {
    if (evaluatedRules.length === 0) return 50;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const rule of evaluatedRules) {
      weightedSum += rule.score * rule.weight;
      totalWeight += rule.weight;
    }

    if (totalWeight === 0) return 50;

    const raw = (weightedSum / totalWeight) * 100;
    return Math.round(Math.min(Math.max(raw, 0), 100));
  }
}
