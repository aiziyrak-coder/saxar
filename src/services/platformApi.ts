import { api } from './api';
import type { UserRole } from '../types';

export interface PlatformSettingsDto {
  sms_enabled: boolean;
  sms_provider: string;
  sms_sender_name: string;
  sms_eskiz_email: string;
  sms_eskiz_password_configured: boolean;
  notify_order_status: boolean;
  notify_low_stock: boolean;
  notify_payment_received: boolean;
  payme_enabled: boolean;
  payme_merchant_id: string;
  click_enabled: boolean;
  click_merchant_id: string;
  uzum_enabled: boolean;
  uzum_merchant_id: string;
  onec_enabled: boolean;
  onec_base_url: string;
  onec_api_key_configured: boolean;
  didox_enabled: boolean;
  didox_api_url: string;
  eaktiv_enabled: boolean;
  eaktiv_api_url: string;
  maps_provider: string;
  soliq_api_enabled: boolean;
  session_idle_minutes: number;
  audit_log_retention_days: number;
  enforce_strong_password: boolean;
  allow_demo_login: boolean;
  default_b2b_markup_percent: number;
  credit_limit_new_client: number;
  credit_limit_trusted_client: number;
  updated_at: string;
}

export interface PlatformSettingsPublicDto {
  session_idle_minutes: number;
  default_b2b_markup_percent: number;
}

export const platformPublicApi = {
  getPublic: () => api.get<PlatformSettingsPublicDto>('/accounts/platform/settings/public/'),
};

export interface DjangoUserRow {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  stir?: string;
  company_name?: string;
  region?: string;
  address?: string;
  telegram_username?: string;
  telegram_chat_id?: number | null;
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
}

export const platformApi = {
  getSettings: () => api.get<PlatformSettingsDto>('/accounts/platform/settings/'),
  putSettings: (data: Partial<PlatformSettingsDto> & { sms_eskiz_password?: string; onec_api_key?: string }) =>
    api.put<PlatformSettingsDto>('/accounts/platform/settings/', data),
  testSms: (phone: string, text?: string) =>
    api.post<{ ok: boolean; detail: string; provider?: string }>('/accounts/platform/sms/test/', { phone, text }),
};

export const djangoUsersApi = {
  list: (role?: string) =>
    api.get<DjangoUserRow[]>('/accounts/users/', role ? { role } : undefined),
  create: (data: {
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    first_name?: string;
    is_active?: boolean;
    company_name?: string;
    region?: string;
    address?: string;
    stir?: string;
  }) => api.post<DjangoUserRow>('/accounts/users/', data),
  patch: (id: number, data: Partial<DjangoUserRow & { is_active: boolean }>) =>
    api.patch<DjangoUserRow>(`/accounts/users/${id}/`, data),
};
