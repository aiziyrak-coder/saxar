import { openAdminSettingsTab } from './openSettingsTab';
import { getRouteMapUrl, createPayment } from '../services/integrations';
import { addNotification } from '../platform/notifications';

export function configureIntegrations(): void {
  openAdminSettingsTab('api');
}

export function configureSms(): void {
  openAdminSettingsTab('sms');
}

export function openLiveMap(waypoints?: { lat: number; lng: number }[]): void {
  const pts =
    waypoints && waypoints.length > 0
      ? waypoints
      : [
          { lat: 41.2995, lng: 69.2401 },
          { lat: 41.3111, lng: 69.2797 },
        ];
  window.open(getRouteMapUrl(pts, 'yandex'), '_blank', 'noopener,noreferrer');
}

export function promptBarcodeScan(onCode: (code: string) => void): void {
  const raw = window.prompt('Shtrix-kod yoki SKU kiriting:', '');
  if (raw?.trim()) {
    onCode(raw.trim());
    addNotification('Skaner', `Kod qabul qilindi: ${raw.trim()}`);
  }
}

export async function startOnlinePayment(amount: number, clientId: string): Promise<void> {
  const res = await createPayment({
    amount,
    clientId,
    returnUrl: `${window.location.origin}/b2b/finance`,
  });
  if (res?.paymentUrl) {
    window.open(res.paymentUrl, '_blank', 'noopener,noreferrer');
    addNotification('To‘lov', 'To‘lov sahifasi ochildi.');
  } else {
    configureIntegrations();
    addNotification('To‘lov', 'Avval Sozlamalar → Integratsiyalar da Payme/Click ni ulang.');
  }
}

export function goPayroll(): void {
  window.location.href = '/accountant/payroll';
}
