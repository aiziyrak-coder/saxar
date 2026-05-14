import type { UserRole } from '../types';

/**
 * Barcha tizim rollari — `UserRole` bilan bir xil tartib va to‘liq ro‘yxat.
 * Yangi rol qo‘shganda shu fayl + `types/index.ts` + backend `UserRoles` yangilanadi.
 */
export const ALL_USER_ROLES: readonly UserRole[] = [
  'admin',
  'accountant',
  'warehouse',
  'agent',
  'driver',
  'b2b',
  'production',
] as const;

/** Har bir rol uchun bosh kabinet yo‘li (App.tsx `ProtectedRoute` bilan mos) */
export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  admin: '/admin',
  accountant: '/accountant',
  warehouse: '/warehouse',
  agent: '/agent',
  driver: '/driver',
  b2b: '/b2b',
  production: '/production',
};

const ROLE_SET = new Set<string>(ALL_USER_ROLES);

export function isUserRole(value: string): value is UserRole {
  return ROLE_SET.has(value);
}

/** Firestore/API dan kelgan noto‘g‘ri qiymatda xavfsiz default: `b2b` */
export function parseUserRole(value: unknown): UserRole {
  if (typeof value === 'string' && isUserRole(value)) return value;
  return 'b2b';
}

/** Kirishdan keyin yo‘naltirish — har doim haqiqiy kabinet yo‘li */
export function homePathForRole(role: UserRole | undefined): string {
  if (!role) return ROLE_HOME_PATHS.b2b;
  return ROLE_HOME_PATHS[role];
}

/** Masalan: `roleSubPath('admin', 'orders')` → `/admin/orders` */
export function roleSubPath(role: UserRole, segment: string): string {
  const base = ROLE_HOME_PATHS[role].replace(/\/+$/, '') || '/';
  const s = segment.replace(/^\/+/, '').replace(/\/+$/, '');
  return s ? `${base}/${s}` : base;
}
