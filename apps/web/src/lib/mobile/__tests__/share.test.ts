import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shareListing } from '../share';

describe('shareListing', () => {
  beforeEach(() => {
    delete (window as any).Capacitor;
    // Reset navigator.share
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('uses Web Share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    const result = await shareListing({
      title: 'Test Car',
      text: 'Check out this car',
      url: 'https://zuzz.co.il/cars/123',
    });

    expect(result).toBe(true);
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Test Car',
      text: 'Check out this car',
      url: 'https://zuzz.co.il/cars/123',
    });
  });

  it('falls back to clipboard when share not available', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    const result = await shareListing({
      title: 'Test',
      text: 'Test',
      url: 'https://zuzz.co.il/cars/123',
    });

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('https://zuzz.co.il/cars/123');
  });
});
