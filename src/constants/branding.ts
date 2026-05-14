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

/** Rasmiy bog'lanish va vitrinada ko'rsatiladigan kategoriyalar (kompaniya ma'lumotnomasi) */
export const CONTACT = {
  phones: [
    { tel: '+998959840099', display: '+998 95 984 00 99' },
    { tel: '+998999994187', display: '+998 99 999 41 87' },
  ],
  addressLine: "Farg'ona viloyati, Bog'dod tumani, Farovon ko'cha",
  /** Katalog bo'limlari — saytda ro'yxat sifatida */
  showcaseCategories: [
    "Go'sht mahsulotlari",
    'Pishloqlar',
    'Tuz, ketchup, mayonez',
    'Konserva mahsulotlari',
    'Chuchvara',
  ],
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
 * `VITE_ALLOW_DEMO_LOGIN=false` (build vaqtida) — standart demo parol matni (bo‘sh parol fallback) yashiriladi.
 * Boshqa qiymat yoki bo‘sh — demo ruxsat (ishlab chiqarish / lokal Docker).
 */
export function isDemoLoginUiAllowed(): boolean {
  const v = String(import.meta.env.VITE_ALLOW_DEMO_LOGIN ?? '').trim().toLowerCase();
  return v !== 'false' && v !== '0' && v !== 'no';
}

/**
 * Login sahifasidagi «demo rol» tugmalari (Admin, Buxgalter, …).
 * `VITE_SHOW_DEMO_ROLE_LOGIN` berilsa, u ustun; bo‘sh bo‘lsa — `isDemoLoginUiAllowed()` bilan bir xil.
 * Prod’da `VITE_ALLOW_DEMO_LOGIN=false` bo‘lsa ham tugmalar kerak bo‘lsa: `VITE_SHOW_DEMO_ROLE_LOGIN=true`.
 */
export function isDemoRoleQuickLoginUiAllowed(): boolean {
  const raw = String(import.meta.env.VITE_SHOW_DEMO_ROLE_LOGIN ?? '').trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return isDemoLoginUiAllowed();
}
