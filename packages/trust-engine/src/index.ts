// Trust Engine — core exports
export { TrustEngine } from './engine';
export type { TrustEngineConfig } from './engine';

// Rules
export { commonRules } from './rules/common-rules';
export { carRules } from './rules/car-rules';
export type {
  TrustRuleDefinition,
  RuleEvaluationContext,
  EvaluatedRule,
} from './rules/common-rules';

// Individual common rules
export {
  sellerVerificationRule,
  completenessRule,
  listingAgeRule,
  responseRateRule,
} from './rules/common-rules';

// Individual car rules
export {
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
} from './rules/car-rules';

// Completeness
export {
  computeCompleteness,
  getFieldDefinitions,
} from './completeness';
export type { FieldDefinition } from './completeness';

// Risk detection
export {
  detectRisks,
  generateContentHash,
} from './risk-detector';
export type { RiskDetectionContext } from './risk-detector';
