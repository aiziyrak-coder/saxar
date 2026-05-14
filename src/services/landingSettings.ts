import { doc, getDoc, setDoc } from 'firebase/firestore';
import { tryGetFirebaseDb } from '../firebase';
import { logger } from './logger';
import {
  getDefaultLandingPublicCopy,
  mergeLandingPublicCopy,
  type LandingPublicCopy,
} from '../types/landingPublic';

const COLLECTION = 'public_site';
const DOC_ID = 'landing_v1';
const DEV_STORAGE_KEY = 'saxar_landing_public_v1';

function stripForFirestore(data: LandingPublicCopy): Record<string, unknown> {
  return { ...data, version: 1 };
}

/**
 * Bosh sahifa (landing) matn va rasmlarini olish.
 * 1) Firestore `public_site/landing_v1`
 * 2) DEV: `localStorage` (Firebase yo‘q yoki sinov)
 * 3) Kod ichidagi defaultlar
 */
export async function fetchLandingPublicCopy(): Promise<LandingPublicCopy> {
  const db = tryGetFirebaseDb();
  if (db) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
      if (snap.exists()) {
        return mergeLandingPublicCopy(snap.data() as Partial<LandingPublicCopy>);
      }
    } catch (e) {
      logger.warn('Landing sozlamalarini Firestore dan o‘qib bo‘lmadi — default ishlatiladi', {
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (import.meta.env.DEV) {
    try {
      const raw = localStorage.getItem(DEV_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LandingPublicCopy>;
        return mergeLandingPublicCopy(parsed);
      }
    } catch {
      /* ignore */
    }
  }

  return getDefaultLandingPublicCopy();
}

export type SaveLandingResult = { ok: boolean; message: string };

/**
 * Admin saqlaganda — Firestore `setDoc(..., { merge: true })` yoki DEV da localStorage.
 */
export async function saveLandingPublicCopy(data: LandingPublicCopy): Promise<SaveLandingResult> {
  const merged = mergeLandingPublicCopy(data);
  const payload = stripForFirestore(merged);

  const db = tryGetFirebaseDb();
  if (db) {
    try {
      await setDoc(doc(db, COLLECTION, DOC_ID), payload, { merge: true });
      return { ok: true, message: 'Landing yangilandi (Firestore).' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Landing saqlanmadi', e instanceof Error ? e : undefined);
      return { ok: false, message: `Firestore xato: ${msg}` };
    }
  }

  if (import.meta.env.DEV) {
    try {
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(payload));
      return {
        ok: true,
        message:
          'Demo: brauzer xotirasiga saqlandi (faqat DEV). Ishlab chiqarishda Firestore yoqing.',
      };
    } catch {
      return { ok: false, message: 'localStorage ga yozib bo‘lmadi.' };
    }
  }

  return {
    ok: false,
    message:
      'Firebase (Firestore) sozlanmagan — landingni serverda saqlab bo‘lmaydi. `firebase-applet-config.json` ni tekshiring.',
  };
}

export function notifyLandingPublicUpdated(): void {
  window.dispatchEvent(new CustomEvent('saxar:landing-updated'));
}
