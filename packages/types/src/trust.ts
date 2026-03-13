import type { ListingVertical } from './listing';

export interface TrustScore {
  overall: number; // 0-100
  factors: TrustFactor[];
  computedAt: Date;
}

export interface TrustFactor {
  id: string;
  type: string;
  category: TrustCategory;
  status: 'positive' | 'negative' | 'warning' | 'neutral';
  weight: number;
  score: number;
  label: string;
  labelHe: string;
  description?: string;
}

export type TrustCategory =
  | 'identity'
  | 'documentation'
  | 'pricing'
  | 'completeness'
  | 'history'
  | 'behavior'
  | 'verification';

export interface TrustRule {
  id: string;
  name: string;
  vertical: ListingVertical | 'all';
  category: TrustCategory;
  evaluate: string; // rule expression or function name
  weight: number;
  isActive: boolean;
}

export interface RiskFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messageHe: string;
  detectedAt: Date;
}

export interface CompletenessScore {
  score: number; // 0-100
  filledFields: number;
  totalFields: number;
  missingFields: string[];
  suggestions: string[];
}
