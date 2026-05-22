/**
 * Firebase olib tashlangan — barcha autentifikatsiya va ma’lumot Django REST API orqali.
 * Eski importlar bu fayldan no-op stub oladi (build sinxronligi uchun).
 */

export function isFirebaseConfigured(): boolean {
  return false;
}

export function tryGetFirebaseDb(): null {
  return null;
}

export function getFirebaseAuth(): never {
  throw new Error('Firebase o‘chirilgan. Django API orqali kiring (/login).');
}

export function getFirebaseDb(): never {
  throw new Error('Firebase o‘chirilgan.');
}

/** Eski `where()` importlari uchun stub (Firestore ishlatilmaydi). */
export type FirestoreQueryConstraint = { __firestoreConstraint?: true };

export function firestoreWhere(..._args: unknown[]): FirestoreQueryConstraint {
  return { __firestoreConstraint: true };
}
