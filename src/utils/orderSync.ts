import type { ApiOrderRow } from '../services/api';

/** Firestore sinxron olib tashlandi — no-op */
export async function syncApiOrderToFirestore(_row: ApiOrderRow): Promise<void> {
  return;
}
