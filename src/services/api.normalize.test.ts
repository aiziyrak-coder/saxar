import { describe, it, expect } from 'vitest';
import { normalizeApiBaseUrl } from './api';

describe('normalizeApiBaseUrl', () => {
  it('maps broken https://api host to /api', () => {
    expect(normalizeApiBaseUrl('https://api')).toBe('/api');
    expect(normalizeApiBaseUrl('https://api/')).toBe('/api');
    expect(normalizeApiBaseUrl('https://api/api')).toBe('/api');
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
