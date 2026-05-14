import { describe, it, expect } from 'vitest';
import { ALL_USER_ROLES, parseUserRole, ROLE_HOME_PATHS, roleSubPath, isUserRole } from './roles';
import { DEV_ROLE_ORDER } from './devRoleLogins';

describe('roles', () => {
  it('parseUserRole accepts valid roles', () => {
    expect(parseUserRole('admin')).toBe('admin');
    expect(parseUserRole('production')).toBe('production');
  });

  it('parseUserRole falls back for invalid', () => {
    expect(parseUserRole('superuser')).toBe('b2b');
    expect(parseUserRole(null)).toBe('b2b');
  });

  it('ROLE_HOME_PATHS covers every UserRole', () => {
    for (const r of ALL_USER_ROLES) {
      expect(ROLE_HOME_PATHS[r]).toMatch(/^\//);
    }
  });

  it('roleSubPath builds admin URLs', () => {
    expect(roleSubPath('admin', 'orders')).toBe('/admin/orders');
    expect(roleSubPath('b2b', 'catalog')).toBe('/b2b/catalog');
  });

  it('isUserRole narrows type', () => {
    const x = 'warehouse';
    if (isUserRole(x)) expect(ROLE_HOME_PATHS[x]).toBe('/warehouse');
  });

  it('DEV_ROLE_ORDER lists every role once', () => {
    expect(DEV_ROLE_ORDER.length).toBe(ALL_USER_ROLES.length);
    const set = new Set(DEV_ROLE_ORDER);
    expect(set.size).toBe(ALL_USER_ROLES.length);
    ALL_USER_ROLES.forEach((r) => expect(set.has(r)).toBe(true));
  });
});
