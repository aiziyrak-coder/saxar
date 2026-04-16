import type { UserRole } from '../types';

/** Rasmiy sayt va kompaniya nomi */
export const BRAND = {
  name: 'Saxar',
  siteHost: 'saxar.uz',
  siteUrl: 'https://saxar.uz',
  erpProductName: 'Saxar ERP',
  tagline: "Sifatli go'sht va kolbasa mahsulotlari",
  description:
    "Saxar — O'zbekistonda tabiiy xom asyo, zamonaviy texnologiya va sovuq zanjir bilan go'sht-kolbasa mahsulotlarini ishlab chiqarish va yetkazib berish.",
} as const;

export const DEMO_USER_STORAGE_KEY = 'saxar_demo_user';
const LEGACY_DEMO_KEYS = ['sahar_demo_user'] as const;

export function readDemoUserRaw(): string | null {
  const primary = localStorage.getItem(DEMO_USER_STORAGE_KEY);
  if (primary) return primary;
  for (const key of LEGACY_DEMO_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return null;
}

export function persistDemoUser(json: string): void {
  localStorage.setItem(DEMO_USER_STORAGE_KEY, json);
  LEGACY_DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function clearDemoUserStorage(): void {
  localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  LEGACY_DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
}

export const ERP_LOGIN_PATH = '/login';

export const ROLE_ERP_HOME: Record<UserRole, string> = {
  admin: '/admin',
  accountant: '/accountant',
  warehouse: '/warehouse',
  agent: '/agent',
  driver: '/driver',
  b2b: '/b2b',
  production: '/production',
};

export function erpHomePathForRole(role: UserRole | undefined): string {
  if (!role) return ERP_LOGIN_PATH;
  return ROLE_ERP_HOME[role] ?? ERP_LOGIN_PATH;
}
