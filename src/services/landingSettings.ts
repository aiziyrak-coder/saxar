import { logger } from './logger';
import {
  getDefaultLandingPublicCopy,
  mergeLandingPublicCopy,
  type LandingPublicCopy,
} from '../types/landingPublic';

const STORAGE_KEY = 'saxar_landing_public_v1';

export async function fetchLandingPublicCopy(): Promise<LandingPublicCopy> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return mergeLandingPublicCopy(JSON.parse(raw) as Partial<LandingPublicCopy>);
    }
  } catch (e) {
    logger.warn('Landing localStorage o‘qilmadi', {
      detail: e instanceof Error ? e.message : String(e),
    });
  }
  return getDefaultLandingPublicCopy();
}

export type SaveLandingResult = { ok: boolean; message: string };

export async function saveLandingPublicCopy(data: LandingPublicCopy): Promise<SaveLandingResult> {
  const merged = mergeLandingPublicCopy(data);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...merged, version: 1 }));
    return { ok: true, message: 'Landing saqlandi (brauzer xotirasi). Keyinroq Django API ga ko‘chiriladi.' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export function notifyLandingPublicUpdated(): void {
  window.dispatchEvent(new CustomEvent('saxar:landing-updated'));
}
