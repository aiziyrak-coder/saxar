/**
 * REST API service for Saxar ERP
 * Replaces Firebase Firestore with Django REST API
 */

import { logger } from './logger';

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

/** JWT tugashi / chiqish: tokenlarni olib, frontendni sinxronlashtirish */
export function clearApiSession(): void {
  clearStoredAuthTokens();
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
}

interface ApiConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
  }

  private async request<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const { params, ...fetchConfig } = config;

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
        clearApiSession();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          (errorData.detail as string) ||
            (errorData.message as string) ||
            `HTTP ${response.status}`,
          response.status,
          errorData as Record<string, unknown>
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

  // HTTP methods
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
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
  getAll: () => api.get<Category[]>('/categories/'),
  getById: (id: string) => api.get<Category>(`/categories/${id}/`),
  create: (data: Partial<Category>) => api.post<Category>('/categories/', data),
  update: (id: string, data: Partial<Category>) => api.patch<Category>(`/categories/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/categories/${id}/`),
};

export const brandApi = {
  getAll: () => api.get<Brand[]>('/brands/'),
  getById: (id: string) => api.get<Brand>(`/brands/${id}/`),
  create: (data: Partial<Brand>) => api.post<Brand>('/brands/', data),
  update: (id: string, data: Partial<Brand>) => api.patch<Brand>(`/brands/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/brands/${id}/`),
};

export const productApi = {
  getAll: (params?: { category?: string; brand?: string; search?: string; is_b2b?: string }) =>
    api.get<Product[]>('/products/', params),
  getById: (id: string) => api.get<Product>(`/products/${id}/`),
  getB2BCatalog: () => api.get<Product[]>('/products/b2b_catalog/'),
  create: (data: Partial<Product>) => api.post<Product>('/products/', data),
  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/products/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/products/${id}/`),
};

export const orderApi = {
  getAll: () => api.get<Order[]>('/orders/'),
  getById: (id: string) => api.get<Order>(`/orders/${id}/`),
  create: (data: Partial<Order>) => api.post<Order>('/orders/', data),
  update: (id: string, data: Partial<Order>) => api.patch<Order>(`/orders/${id}/`, data),
  delete: (id: string) => api.delete<void>(`/orders/${id}/`),
};

// ==================== TYPES ====================

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parent?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  category: string;
  category_name?: string;
  brand?: string;
  brand_name?: string;
  unit: string;
  weight?: number;
  base_price: number;
  b2b_price: number;
  cost_price: number;
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
