import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

type FirebasePublicConfig = {
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
};

/**
 * Haqiqiy Firebase loyiha kaliti qo‘yilganmi (placeholder `YOUR_WEB_API_KEY` emas).
 * False bo‘lsa Auth Login/Register demo rejimga o‘tadi, network 400 bermaydi.
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
