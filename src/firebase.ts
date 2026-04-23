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

function ensureFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured (missing or placeholder API key). Use demo login or set firebase-applet-config.json.'
    );
  }
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}

/** Lazily initializes Firebase Auth only when the project is configured (avoids Identity Toolkit iframe on demo). */
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(ensureFirebaseApp());
  return authInstance;
}

/** Lazily initializes Firestore only when the project is configured. */
export function getFirebaseDb(): Firestore {
  if (dbInstance) return dbInstance;
  const cfg = firebaseConfig as FirebasePublicConfig;
  const dbId = String(cfg.firestoreDatabaseId || '').trim();
  const firebaseApp = ensureFirebaseApp();
  dbInstance = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
  return dbInstance;
}
