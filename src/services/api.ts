/**
 * REST API service for Saxar ERP
 * Replaces Firebase Firestore with Django REST API
 */

import { logger } from './logger';
import { withRetry } from '../platform/withRetry';

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Build vaqtidagi VITE_API_URL: `/api` (tavsiya) yoki to'liq `https://api.saxar.uz/api`.
 * Noto'g'ri qiymatlar (`https://api`, `https://api/api`) brauzerda DNS xatosi beradi — pathname bo'yicha /api ga qaytaramiz.
 */
export function normalizeApiBaseUrl(raw: unknown): string {
  const fallback = '/api';
  const t = typeof raw === 'string' && raw.trim() ? raw.trim() : '';
  if (!t) return fallback;

  const s = t.replace(/\/+$/, '') || fallback;

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      // "https://api/..." yoki "https://api/api" — host nomi "api" (TLD yo'q)
      if (u.hostname === 'api') {
        const path = (u.pathname || '/').replace(/\/+$/, '') || '/';
        if (path !== '/' && path.startsWith('/api')) {
          return `${path}${u.search}`;
        }
        return fallback;
      }
    } catch {
      return fallback;
    }
    return s;
  }

  if (!s.startsWith('/')) {
    return `/${s}`;
  }

  return s;
}

/**
 * Eski bundle / noto'g'ri env: fetch("https://api/api/...") → joriy domen ostidagi xuddi shu path.
 * Haqiqiy `https://api.saxar.uz/...` ga tegmaydi (hostname nuqta bilan).
 */
export function coerceBrowserFetchUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    if (u.hostname === 'api') {
      return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    return url;
  }
  return url;
}

/**
 * base + endpoint — string qo'shish `https://api` + `/api/foo` xatosini beradi; URL bilan yig'amiz.
 */
export function buildApiFetchUrl(
  baseRaw: string,
  endpoint: string,
  params?: Record<string, string>
): string {
  const base = normalizeApiBaseUrl(baseRaw);
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let u: URL;
  if (base.startsWith('http')) {
    const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
    const relativePart = ep.replace(/^\/+/, '') || '.';
    u = new URL(relativePart, baseWithSlash);
  } else {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost:3000';
    u = new URL(`${base.replace(/\/+$/, '')}${ep}`, origin);
  }

  if (params) {
    for (const [k, val] of Object.entries(params)) {
      u.searchParams.set(k, val);
    }
  }

  return u.toString();
}

/** Vite devda odatda `/api` — `vite.config.ts` proxy orqali Django ga yo'naltiriladi */
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export function clearStoredAuthTokens(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_refresh_token');
}

/** JWT tugadi — Firebase sessiyasi saqlanadi, sahifada qayta ulanish mumkin */
export function clearApiSession(): void {
  clearStoredAuthTokens();
  window.dispatchEvent(new CustomEvent('auth:jwt-expired'));
}

/** To‘liq chiqish (Firebase + JWT) */
export function clearApiSessionAndSignOut(): void {
  clearStoredAuthTokens();
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
}

interface ApiConfig extends RequestInit {
  params?: Record<string, string>;
  /** Ichki: 401 dan keyin refresh urinishi */
  _retry401?: boolean;
}

/** Saqlangan refresh token orqali access JWT yangilash (chiqmasdan). */
export async function refreshStoredAccessToken(
  baseUrl: string = API_BASE_URL
): Promise<boolean> {
  return refreshAccessToken(normalizeApiBaseUrl(baseUrl));
}

async function refreshAccessToken(baseUrl: string): Promise<boolean> {
  const refresh = localStorage.getItem('auth_refresh_token');
  if (!refresh) return false;
  try {
    let url = buildApiFetchUrl(baseUrl, '/accounts/auth/refresh/');
    url = coerceBrowserFetchUrl(url);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;
    localStorage.setItem('auth_token', data.access);
    if (data.refresh) localStorage.setItem('auth_refresh_token', data.refresh);
    return true;
  } catch {
    return false;
  }
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
  }

  private async request<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const { params, _retry401, ...fetchConfig } = config;

    let url = buildApiFetchUrl(this.baseUrl, endpoint, params);
    url = coerceBrowserFetchUrl(url);

    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge with existing headers
    if (fetchConfig.headers) {
      const existingHeaders = fetchConfig.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: controller.signal,
      });

      const duration = Math.round(performance.now() - startTime);
      logger.trackApiCall(endpoint, fetchConfig.method || 'GET', duration, response.status);

      if (response.status === 401) {
        if (token && !_retry401 && (await refreshAccessToken(this.baseUrl))) {
          return this.request<T>(endpoint, { ...config, _retry401: true });
        }
        if (token) {
          clearApiSession();
        }
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new ApiError(
          formatApiErrorMessage(errorData, response.status),
          response.status,
          errorData
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.warn('API request timeout', { endpoint, url });
        throw new ApiError("So'rov vaqti tugadi. Internetni tekshirib qayta urinib ko'ring.", 408);
      }
      logger.error('API request failed', error as Error, { endpoint, url });
      throw new ApiError('Network error or server unreachable', 0);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // HTTP methods — GET requests use withRetry for network resilience
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return withRetry(() => this.request<T>(endpoint, { method: 'GET', params }), 3, 500);
  }

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

function formatApiErrorMessage(errorData: Record<string, unknown>, status: number): string {
  const detail = errorData.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) return detail.map(String).join('; ');
  const parts: string[] = [];
  for (const [key, val] of Object.entries(errorData)) {
    if (key === 'detail' || key === 'message') continue;
    if (Array.isArray(val)) parts.push(`${key}: ${val.map(String).join(', ')}`);
    else if (typeof val === 'string' && val.trim()) parts.push(`${key}: ${val}`);
  }
  if (parts.length) return parts.join('; ');
  const msg = errorData.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  return `HTTP ${status}`;
}

// Custom API error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API service instance
export const api = new ApiService();

// ==================== ENTITY SERVICES ====================

export const categoryApi = {
  getAll: () => api.get<ApiCategory[]>('/categories/'),
  getById: (id: string) => api.get<ApiCategory>(`/categories/${id}/`),
  create: (data: Record<string, unknown>) => api.post<ApiCategory>('/categories/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<ApiCategory>(`/categories/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/categories/${id}/`),
};

export const brandApi = {
  getAll: () => api.get<ApiBrand[]>('/brands/'),
  getById: (id: string) => api.get<ApiBrand>(`/brands/${id}/`),
  create: (data: Record<string, unknown>) => api.post<ApiBrand>('/brands/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<ApiBrand>(`/brands/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/brands/${id}/`),
};

export const productApi = {
  getAll: (params?: { category?: string; brand?: string; search?: string; is_b2b?: string }) =>
    api.get<ApiProduct[]>('/products/', params),
  getById: (id: string) => api.get<ApiProduct>(`/products/${id}/`),
  getB2BCatalog: () => api.get<ApiProduct[]>('/products/b2b_catalog/'),
  create: (data: Record<string, unknown>) => api.post<ApiProduct>('/products/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<ApiProduct>(`/products/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/products/${id}/`),
};

/** Django REST `sales.Order` list element (snake_case) */
export interface ApiOrderRow {
  id: number | string;
  source?: string;
  client?: number | string;
  client_name?: string;
  agent?: number | string | null;
  driver?: number | string | null;
  agent_name?: string;
  driver_name?: string;
  status?: string;
  total_amount?: number | string;
  paid_amount?: number | string;
  order_date?: string;
  created_at?: string;
  items?: ApiOrderItemRow[];
}

export interface ApiOrderItemRow {
  id?: number | string;
  product?: number | string;
  product_name?: string;
  quantity?: number | string;
  price?: number | string;
  total?: number | string;
}

export interface ApiPaymentRow {
  id: number | string;
  client?: number | string;
  amount?: number | string;
  type?: string;
  description?: string;
  created_at?: string;
  order?: number | string | null;
}

export const orderApi = {
  getAll: () => api.get<ApiOrderRow[]>('/orders/'),
  getById: (id: string) => api.get<ApiOrderRow>(`/orders/${id}/`),
  create: (data: Partial<Order>) => api.post<Order>('/orders/', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiOrderRow>(`/orders/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/orders/${id}/`),
};

export const paymentApi = {
  getAll: () => api.get<ApiPaymentRow[]>('/payments/'),
  create: (data: Record<string, unknown>) => api.post<ApiPaymentRow>('/payments/', data),
};

export interface ApiExpenseRow {
  id: number | string;
  category?: string;
  amount?: number | string;
  description?: string;
  date?: string;
  created_at?: string;
}

export const expenseApi = {
  getAll: () => api.get<ApiExpenseRow[]>('/expenses/'),
  create: (data: Record<string, unknown>) => api.post<ApiExpenseRow>('/expenses/', data),
};

export interface TelegramSettingsDto {
  admin_group_id: number;
  notify_new_orders: boolean;
  notify_payments: boolean;
  notify_expenses: boolean;
  notify_order_status: boolean;
  bot_username: string;
  bot_token_configured: boolean;
  webhook_secret_configured: boolean;
  updated_at: string;
}

export const telegramApi = {
  getSettings: () => api.get<TelegramSettingsDto>('/telegram/settings/'),
  putSettings: (data: Partial<TelegramSettingsDto>) => api.put<TelegramSettingsDto>('/telegram/settings/', data),
  getInviteLink: () => api.get<{ invite_url: string; start_param: string }>('/telegram/invite-link/'),
  adminBindUserTelegram: (userId: number, telegram_username: string) =>
    api.patch<{ id: number; telegram_username: string; telegram_chat_id: number | null }>(
      `/telegram/user/${userId}/telegram/`,
      { telegram_username }
    ),
};

// ==================== TYPES ====================

export interface ApiCategory {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
  parent?: string | number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ApiBrand {
  id: string | number;
  name: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiProduct {
  id: string | number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  image?: string;
  category: string | number;
  category_name?: string;
  brand?: string | number | null;
  brand_name?: string;
  unit: string;
  weight?: number | string | null;
  base_price: number | string;
  b2b_price: number | string;
  cost_price: number | string;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
  is_b2b_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  client_id: string;
  agent_id?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}
