import { api, clearStoredAuthTokens, refreshStoredAccessToken } from './api';
import type { UserRole } from '../types';

/** Django REST API talab qiladigan rollar */
export const ROLES_REQUIRING_DJANGO_JWT: UserRole[] = [
  'admin',
  'accountant',
  'warehouse',
  'agent',
  'driver',
  'production',
];

export interface DjangoMeDto {
  id: number;
  role: UserRole;
  is_active: boolean;
  email?: string;
  phone?: string;
}

function phoneToUsername(phone: string): string {
  const digits = phone.replace(/\D/g, '').trim();
  if (!digits) throw new Error('Telefon raqam bo‘sh');
  return `${digits}@saxar.local`;
}

export interface JwtPair {
  access: string;
  refresh: string;
}

/** Firebase kirishdan keyin Django JWT (Telegram, platform sozlamalari uchun). */
export async function obtainDjangoJwt(phone: string, password: string): Promise<JwtPair | null> {
  const username = phoneToUsername(phone);
  try {
    const data = await api.post<{ access: string; refresh: string }>('/accounts/auth/login/', {
      username,
      password,
    });
    if (data.access) {
      localStorage.setItem('auth_token', data.access);
      localStorage.setItem('auth_refresh_token', data.refresh || '');
      return { access: data.access, refresh: data.refresh };
    }
    return null;
  } catch (err) {
    console.warn('Django JWT olinmadi', err);
    return null;
  }
}

export async function fetchDjangoMe(): Promise<DjangoMeDto | null> {
  if (!hasDjangoJwt()) return null;
  try {
    return await api.get<DjangoMeDto>('/accounts/auth/me/');
  } catch {
    return null;
  }
}

export function roleRequiresDjangoJwt(role: UserRole): boolean {
  return ROLES_REQUIRING_DJANGO_JWT.includes(role);
}

export function hasDjangoJwt(): boolean {
  return Boolean(localStorage.getItem('auth_token'));
}

/** Refresh token bo‘lsa, chiqmasdan access JWT tiklash */
export async function tryRefreshDjangoJwt(): Promise<boolean> {
  if (hasDjangoJwt()) return true;
  return refreshStoredAccessToken();
}

export function notifyDjangoJwtRestored(): void {
  window.dispatchEvent(new CustomEvent('auth:jwt-restored'));
}

export async function ensureDjangoJwtForAdmin(phone: string, password: string): Promise<boolean> {
  if (hasDjangoJwt()) return true;
  const pair = await obtainDjangoJwt(phone, password);
  return Boolean(pair?.access);
}

export function clearDjangoJwt(): void {
  clearStoredAuthTokens();
}
