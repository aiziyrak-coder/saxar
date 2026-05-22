import {
  api,
  ApiError,
  API_BASE_URL,
  buildApiFetchUrl,
  clearStoredAuthTokens,
  coerceBrowserFetchUrl,
  refreshStoredAccessToken,
} from './api';
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
  first_name?: string;
  last_name?: string;
  company_name?: string;
  stir?: string;
  address?: string;
  region?: string;
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
/** Login sahifasida API tekshiruvi — tokenlarni saqlamaydi. */
export async function probeDjangoApiReachable(
  phone: string = '+998 90 000 01 01',
  password: string = 'DevRole_Admin!'
): Promise<boolean> {
  const username = phoneToUsername(phone);
  let url = buildApiFetchUrl(API_BASE_URL, '/accounts/auth/login/');
  url = coerceBrowserFetchUrl(url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function obtainDjangoJwtDetailed(
  phone: string,
  password: string
): Promise<{ pair: JwtPair | null; error?: string }> {
  const username = phoneToUsername(phone);
  try {
    const data = await api.post<{ access: string; refresh: string }>('/accounts/auth/login/', {
      username,
      password,
    });
    if (data.access) {
      localStorage.setItem('auth_token', data.access);
      localStorage.setItem('auth_refresh_token', data.refresh || '');
      return { pair: { access: data.access, refresh: data.refresh || '' } };
    }
    return { pair: null, error: 'JWT javobida access yo‘q' };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Tarmoq xatosi — API javob bermadi';
    console.warn('Django JWT olinmadi', message);
    return { pair: null, error: message };
  }
}

export async function obtainDjangoJwt(phone: string, password: string): Promise<JwtPair | null> {
  const { pair } = await obtainDjangoJwtDetailed(phone, password);
  return pair;
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
