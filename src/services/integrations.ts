import { logger } from './logger';

/**
 * TZ: Integratsiyalar
 * SMS: Eskiz.uz / Playmobile
 * To'lov: Payme, Click, Uzum Pay
 * Xaritalar: Yandex / Google Maps
 * Soliq: Soliq.uz API (STIR orqali korxona ma'lumotlari)
 */

const config = {
  smsProvider: import.meta.env.VITE_SMS_PROVIDER || 'eskiz',
  paymeMerchantId: import.meta.env.VITE_PAYME_MERCHANT_ID || '',
  clickMerchantId: import.meta.env.VITE_CLICK_MERCHANT_ID || '',
  mapsProvider: import.meta.env.VITE_MAPS_PROVIDER || 'yandex',
  soliqApiUrl: import.meta.env.VITE_SOLIQ_API_URL || 'https://api.soliq.uz',
};

/** SMS yuborish (Eskiz.uz / Playmobile) - placeholder */
export async function sendSms(phone: string, text: string): Promise<boolean> {
  const normalized = phone.replace(/\D/g, '').replace(/^8/, '998');
  if (normalized.length < 9) return false;
  try {
    // Eskiz.uz / Playmobile — prod uchun VITE_* sozlamalari va haqiqiy API chaqiruvi
    logger.debug('SMS stub yuborildi', {
      provider: config.smsProvider,
      phone: normalized,
      preview: text.slice(0, 40),
    });
    return true;
  } catch {
    return false;
  }
}

/** Ro'yxatdan o'tish uchun SMS tasdiq kodi yuborish */
export async function sendVerificationCode(phone: string): Promise<{ success: boolean; code?: string }> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const ok = await sendSms(phone, `Saxar ERP tasdiqlash kodi: ${code}`);
  if (import.meta.env.DEV) return { success: true, code };
  return { success: ok };
}

/** To'lov (Payme/Click/Uzum) - placeholder. B2B mijoz qarzini to'lashi uchun */
export async function createPayment(params: {
  amount: number;
  orderId?: string;
  clientId: string;
  returnUrl: string;
  callbackUrl?: string;
}): Promise<{ paymentUrl: string; transactionId: string } | null> {
  try {
    // TODO: Payme/Click/Uzum API
    const paymentUrl = `https://checkout.paycom.uz/${config.paymeMerchantId}?amount=${params.amount}&order_id=${params.orderId || ''}`;
    return { paymentUrl, transactionId: `tx_${Date.now()}` };
  } catch {
    return null;
  }
}

/** Xarita: marshrut URL (Google Maps yoki Yandex) */
export function getRouteMapUrl(waypoints: { lat: number; lng: number }[], provider: 'google' | 'yandex' = 'yandex'): string {
  if (provider === 'google') {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const waypointsParam = waypoints.slice(1, -1).map(w => `${w.lat},${w.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypointsParam}`;
  }
  const points = waypoints.map(w => `${w.lng},${w.lat}`).join('~');
  return `https://yandex.uz/maps/?rtext=${encodeURIComponent(points)}&rtt=auto`;
}

/** Soliq.uz: STIR orqali korxona ma'lumotlarini olish - placeholder */
export async function fetchCompanyByStir(stir: string): Promise<{ name: string; address?: string } | null> {
  if (!stir || stir.length < 9) return null;
  try {
    // TODO: real Soliq.uz API
    // const res = await fetch(`${config.soliqApiUrl}/tin/${stir}`);
    void config.soliqApiUrl;
    return null;
  } catch {
    return null;
  }
}
