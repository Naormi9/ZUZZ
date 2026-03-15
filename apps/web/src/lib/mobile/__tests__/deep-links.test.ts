import { describe, it, expect } from 'vitest';
import { parseDeepLink, deepLinkToPath } from '../deep-links';

describe('deep link parsing', () => {
  it('parses car detail links', () => {
    const route = parseDeepLink('zuzz://cars/abc-123');
    expect(route).toEqual({ type: 'car_detail', id: 'abc-123' });
  });

  it('parses HTTPS car detail links', () => {
    const route = parseDeepLink('https://zuzz.co.il/cars/abc-123');
    expect(route).toEqual({ type: 'car_detail', id: 'abc-123' });
  });

  it('parses car search links with params', () => {
    const route = parseDeepLink('zuzz://cars/search?make=Toyota&year=2023');
    expect(route.type).toBe('car_search');
    if (route.type === 'car_search') {
      expect(route.params.make).toBe('Toyota');
      expect(route.params.year).toBe('2023');
    }
  });

  it('parses home detail links', () => {
    const route = parseDeepLink('zuzz://homes/home-456');
    expect(route).toEqual({ type: 'home_detail', id: 'home-456' });
  });

  it('parses messages link', () => {
    const route = parseDeepLink('zuzz://dashboard/messages');
    expect(route).toEqual({ type: 'messages', conversationId: undefined });
  });

  it('parses specific conversation link', () => {
    const route = parseDeepLink('zuzz://dashboard/messages/conv-789');
    expect(route).toEqual({ type: 'messages', conversationId: 'conv-789' });
  });

  it('parses dealer profile link', () => {
    const route = parseDeepLink('zuzz://dealers/dealer-123');
    expect(route).toEqual({ type: 'dealer', id: 'dealer-123' });
  });

  it('parses auth login link', () => {
    const route = parseDeepLink('zuzz://auth/login');
    expect(route).toEqual({ type: 'auth_login' });
  });

  it('parses unknown paths as generic', () => {
    const route = parseDeepLink('zuzz://some/unknown/path');
    expect(route.type).toBe('generic');
  });

  it('does not parse /cars/search as car detail', () => {
    const route = parseDeepLink('zuzz://cars/search');
    expect(route.type).toBe('car_search');
  });

  it('does not parse /cars/create as car detail', () => {
    const route = parseDeepLink('zuzz://cars/create');
    expect(route.type).toBe('generic');
  });
});

describe('deepLinkToPath', () => {
  it('converts car detail route to path', () => {
    expect(deepLinkToPath({ type: 'car_detail', id: 'abc' })).toBe('/cars/abc');
  });

  it('converts car search route with params to path', () => {
    expect(deepLinkToPath({ type: 'car_search', params: { make: 'BMW' } })).toBe(
      '/cars/search?make=BMW',
    );
  });

  it('converts messages route to path', () => {
    expect(deepLinkToPath({ type: 'messages' })).toBe('/dashboard/messages');
  });

  it('converts messages with conversation to path', () => {
    expect(deepLinkToPath({ type: 'messages', conversationId: 'c1' })).toBe(
      '/dashboard/messages/c1',
    );
  });
});
