import { api, ApiError } from './api';
import { hasDjangoJwt } from './djangoAuth';
import { logger } from './logger';
import {
  getDefaultLandingPublicCopy,
  mergeLandingPublicCopy,
  type LandingPublicCopy,
} from '../types/landingPublic';

const STORAGE_KEY = 'saxar_landing_public_v1';

function readLocalCache(): LandingPublicCopy | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return mergeLandingPublicCopy(JSON.parse(raw) as Partial<LandingPublicCopy>);
  } catch {
    return null;
  }
}

function writeLocalCache(data: LandingPublicCopy): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 1 }));
  } catch (e) {
    logger.warn('Landing localStorage yozilmadi', {
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function fetchLandingPublicCopy(): Promise<LandingPublicCopy> {
  try {
    const remote = await api.get<Partial<LandingPublicCopy>>('/accounts/platform/landing/public/');
    const merged = mergeLandingPublicCopy(remote);
    writeLocalCache(merged);
    return merged;
  } catch (e) {
    logger.warn('Landing API o‘qilmadi, kesh/standart ishlatiladi', {
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  return readLocalCache() ?? getDefaultLandingPublicCopy();
}

export type SaveLandingResult = { ok: boolean; message: string };

export async function saveLandingPublicCopy(data: LandingPublicCopy): Promise<SaveLandingResult> {
  const merged = mergeLandingPublicCopy(data);
  if (!hasDjangoJwt()) {
    return { ok: false, message: 'Saqlash uchun admin sifatida Django API ga kiring.' };
  }
  try {
    await api.put<{ ok: boolean }>('/accounts/platform/landing/', merged);
    writeLocalCache(merged);
    return { ok: true, message: 'Bosh sahifa serverda saqlandi. Barcha foydalanuvchilar yangi matnni ko‘radi.' };
  } catch (e) {
    const msg =
      e instanceof ApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Saqlash amalga oshmadi';
    return { ok: false, message: msg };
  }
}

export function notifyLandingPublicUpdated(): void {
  window.dispatchEvent(new CustomEvent('saxar:landing-updated'));
}
