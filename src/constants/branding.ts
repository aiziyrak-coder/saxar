import type { UserRole } from '../types';
import { ROLE_HOME_PATHS } from './roles';

/** Rasmiy sayt va kompaniya nomi */
export const BRAND = {
  name: 'Saxar',
  siteHost: 'saxar.uz',
  siteUrl: 'https://saxar.uz',
  erpProductName: 'Saxar ERP',
  tagline: "Taza ta'm, ishonchli sifat — tabiiy xomashyodan dastingizgacha",
  /** Qisqa brend xabari: hero, meta, umumiy kirish matni */
  description:
    "Saxar O'zbekistonda go'sht-kolbasani tabiiy xomashyo va zamonaviy texnologiya bilan tayyorlaydi. Zavoddan tortib sizga yetkazguncha mahsulot sovuqda saqlanadi — yo'lda ham taza ta'm va xavfsizlik saqlanadi.",
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

/** @deprecated Yangi kodda `ROLE_HOME_PATHS` yoki `homePathForRole` (`constants/roles.ts`) ishlating */
export const ROLE_ERP_HOME: Record<UserRole, string> = ROLE_HOME_PATHS;

export function erpHomePathForRole(role: UserRole | undefined): string {
  if (!role) return ERP_LOGIN_PATH;
  return ROLE_HOME_PATHS[role] ?? ERP_LOGIN_PATH;
}

/**
 * `VITE_ALLOW_DEMO_LOGIN=false` (build vaqtida) — demo rol tugmalari va standart parol UI dan olib tashlanadi.
 * Boshqa qiymat yoki bo‘sh — demo ruxsat (ishlab chiqarish / lokal Docker).
 */
export function isDemoLoginUiAllowed(): boolean {
  const v = String(import.meta.env.VITE_ALLOW_DEMO_LOGIN ?? '').trim().toLowerCase();
  return v !== 'false' && v !== '0' && v !== 'no';
}
