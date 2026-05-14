import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

type FirebasePublicConfig = {
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

/**
 * Haqiqiy Firebase loyiha kaliti qo‘yilganmi (placeholder `YOUR_WEB_API_KEY` emas).
 * False bo‘lsa Auth Login/Register demo rejimga o‘tadi, `getAuth` chaqirilmaydi — iframe 400 bermaydi.
 */
export function isFirebaseConfigured(): boolean {
  const cfg = firebaseConfig as FirebasePublicConfig;
  const apiKey = String(cfg.apiKey || '').trim();
  const projectId = String(cfg.projectId || '').trim();
  if (!apiKey || apiKey.includes('YOUR_WEB') || apiKey.length < 10) return false;
  if (!projectId || projectId.includes('YOUR_')) return false;
  const domain = String(cfg.authDomain || '').trim();
  if (!domain || domain.includes('YOUR_')) return false;
  return true;
}

function tryEnsureFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (app) return app;
  try {
    const existing = getApps()[0];
    app = existing || initializeApp(firebaseConfig);
    return app;
  } catch (e) {
    console.warn('[firebase] initializeApp failed', e);
    return null;
  }
}

/**
 * Firestore ni xavfsiz olish: demo / placeholder sozlamada yoki init xatoda throw qilmaydi (null qaytaradi).
 * UI va servislar shu orqali offline rejimda yiqilmasin.
 */
export function tryGetFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (dbInstance) return dbInstance;
  const firebaseApp = tryEnsureFirebaseApp();
  if (!firebaseApp) return null;
  try {
    const cfg = firebaseConfig as FirebasePublicConfig;
    const dbId = String(cfg.firestoreDatabaseId || '').trim();
    dbInstance = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    return dbInstance;
  } catch (e) {
    console.warn('[firebase] getFirestore failed', e);
    return null;
  }
}

/** Lazily initializes Firebase Auth only when the project is configured (avoids Identity Toolkit iframe on demo). */
export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured (missing or placeholder API key). Use demo login or set firebase-applet-config.json.'
    );
  }
  if (authInstance) return authInstance;
  const firebaseApp = tryEnsureFirebaseApp();
  if (!firebaseApp) {
    throw new Error(
      'Firebase is not configured (missing or placeholder API key). Use demo login or set firebase-applet-config.json.'
    );
  }
  authInstance = getAuth(firebaseApp);
  return authInstance;
}

/**
 * Firestore (majburiy): faqat Firebase aniq kerak bo‘lgan joylarda (masalan, Login dan keyin).
 * Demo uchun ma’lumot olishda `tryGetFirebaseDb` dan foydalaning.
 */
export function getFirebaseDb(): Firestore {
  const db = tryGetFirebaseDb();
  if (!db) {
    throw new Error(
      'Firebase is not configured (missing or placeholder API key). Use demo login or set firebase-applet-config.json.'
    );
  }
  return db;
}
