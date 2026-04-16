import { describe, it, expect } from 'vitest';
import { erpHomePathForRole, ERP_LOGIN_PATH } from './branding';

describe('branding', () => {
  it('maps roles to ERP home paths', () => {
    expect(erpHomePathForRole('b2b')).toBe('/b2b');
    expect(erpHomePathForRole('admin')).toBe('/admin');
    expect(erpHomePathForRole('warehouse')).toBe('/warehouse');
  });

  it('falls back to login when role is missing', () => {
    expect(erpHomePathForRole(undefined)).toBe(ERP_LOGIN_PATH);
  });
});
