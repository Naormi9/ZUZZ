import { describe, it, expect } from 'vitest';
import { TrustEngine } from './engine';
import type { ListingBase } from '@zuzz/types';

const baseListing: ListingBase = {
  id: 'test-1',
  userId: 'user-1',
  vertical: 'cars',
  status: 'active',
  moderationStatus: 'approved',
  title: 'Test Car Listing',
  price: { amount: 100000, currency: 'ILS' },
  isNegotiable: false,
  location: { city: 'תל אביב-יפו', region: 'tel_aviv' },
  media: [],
  viewCount: 0,
  favoriteCount: 0,
  completenessScore: 80,
  isFeatured: false,
  isPromoted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TrustEngine', () => {
  const engine = new TrustEngine();

  describe('computeScore', () => {
    it('returns a score between 0 and 100', () => {
      const result = engine.computeScore(baseListing);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('returns factors array', () => {
      const result = engine.computeScore(baseListing);
      expect(Array.isArray(result.factors)).toBe(true);
    });

    it('includes computedAt timestamp', () => {
      const result = engine.computeScore(baseListing);
      expect(result.computedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRules', () => {
    it('returns all rules when no vertical specified', () => {
      const rules = engine.getRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('filters rules by vertical', () => {
      const carRules = engine.getRules('cars');
      const homeRules = engine.getRules('homes');
      // Car-specific rules should only appear in car rules
      expect(carRules.length).toBeGreaterThanOrEqual(homeRules.length);
    });
  });
});
