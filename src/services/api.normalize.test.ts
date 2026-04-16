import { describe, it, expect } from 'vitest';
import { buildApiFetchUrl, coerceBrowserFetchUrl, normalizeApiBaseUrl } from './api';

describe('normalizeApiBaseUrl', () => {
  it('maps broken https://api host to /api', () => {
    expect(normalizeApiBaseUrl('https://api')).toBe('/api');
    expect(normalizeApiBaseUrl('https://api/')).toBe('/api');
  });

  it('maps https://api/api to relative /api prefix', () => {
    expect(normalizeApiBaseUrl('https://api/api')).toBe('/api');
    expect(normalizeApiBaseUrl('https://api/api/')).toBe('/api');
  });

  it('prefixes bare api segment to /api', () => {
    expect(normalizeApiBaseUrl('api')).toBe('/api');
  });

  it('keeps valid absolute and relative roots', () => {
    expect(normalizeApiBaseUrl('https://api.saxar.uz/api')).toBe('https://api.saxar.uz/api');
    expect(normalizeApiBaseUrl('/api')).toBe('/api');
    expect(normalizeApiBaseUrl('')).toBe('/api');
  });
});

describe('coerceBrowserFetchUrl', () => {
  it('rewrites https://api host to window.location.origin', () => {
    const prev = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...prev, origin: 'https://saxar.uz' },
    });
    expect(coerceBrowserFetchUrl('https://api/api/categories/')).toBe('https://saxar.uz/api/categories/');
    expect(coerceBrowserFetchUrl('/api/products/')).toBe('/api/products/');
    Object.defineProperty(window, 'location', { configurable: true, value: prev });
  });
});

describe('buildApiFetchUrl', () => {
  it('does not concatenate https://api + /api/products into https://api/api/products', () => {
    const prev = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...prev, origin: 'https://saxar.uz' },
    });
    const u = buildApiFetchUrl('https://api', '/products/', { is_b2b: 'true' });
    expect(u).toBe('https://saxar.uz/api/products/?is_b2b=true');
    Object.defineProperty(window, 'location', { configurable: true, value: prev });
  });

  it('resolves absolute API base with path endpoint', () => {
    expect(buildApiFetchUrl('https://api.saxar.uz/api', '/categories/')).toBe(
      'https://api.saxar.uz/api/categories/'
    );
  });

  it('appends query params for relative /api base', () => {
    const prev = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...prev, origin: 'http://localhost:3000' },
    });
    expect(buildApiFetchUrl('/api', '/health/', { x: '1' })).toBe('http://localhost:3000/api/health/?x=1');
    Object.defineProperty(window, 'location', { configurable: true, value: prev });
  });
});
