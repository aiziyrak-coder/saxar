import { doc, getDoc } from 'firebase/firestore';
import { tryGetFirebaseDb } from '../firebase';

/** Firestore `users/{uid}` dan Django mijoz PK. */
export async function resolveDjangoClientId(firestoreUid: string): Promise<number | null> {
  const db = tryGetFirebaseDb();
  if (!db || !firestoreUid) return null;
  const snap = await getDoc(doc(db, 'users', firestoreUid));
  if (!snap.exists()) return null;
  const raw = snap.data()?.djangoUserId;
  const id = typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : null;
}
