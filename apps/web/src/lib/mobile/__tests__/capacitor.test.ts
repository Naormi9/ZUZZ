import { describe, it, expect, beforeEach } from 'vitest';
import { isCapacitorNative, getPlatform, isIOS, isAndroid } from '../capacitor';

describe('capacitor platform detection', () => {
  beforeEach(() => {
    // Clean up any Capacitor mock
    delete (window as any).Capacitor;
  });

  it('returns false for isCapacitorNative on web', () => {
    expect(isCapacitorNative()).toBe(false);
  });

  it('returns "web" for getPlatform on web', () => {
    expect(getPlatform()).toBe('web');
  });

  it('returns false for isIOS on web', () => {
    expect(isIOS()).toBe(false);
  });

  it('returns false for isAndroid on web', () => {
    expect(isAndroid()).toBe(false);
  });

  it('detects native platform when Capacitor is present', () => {
    (window as any).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'ios',
    };
    expect(isCapacitorNative()).toBe(true);
    expect(getPlatform()).toBe('ios');
    expect(isIOS()).toBe(true);
    expect(isAndroid()).toBe(false);
  });

  it('detects Android platform', () => {
    (window as any).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
    };
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
  });
});
