/** Admin sozlamalar bo‘limiga o‘tish (integratsiya va boshqalar). */
export function openAdminSettingsTab(tab: 'api' | 'sms' | 'users' | 'security' | 'telegram' | 'prices'): void {
  window.location.href = `/admin/settings?tab=${tab}`;
}
