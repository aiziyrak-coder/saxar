import type { ApiProduct } from '../services/api';

/** Firestore sinxron olib tashlandi — no-op */
export async function syncProductToFirestore(_product: ApiProduct): Promise<void> {
  return;
}

export async function removeProductFromFirestore(_productId: string): Promise<void> {
  return;
}
