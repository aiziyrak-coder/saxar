import type { ApiOrderRow } from '../services/api';
import { mapApiOrderRowToOrder } from '../services/b2bFromApi';
import { orderService } from '../services/firestore';
import { isFirebaseConfigured } from '../firebase';
import type { Order } from '../types';

/** API buyurtmasini ombor/WMS uchun Firestore ga nusxa (ID = Django PK). */
export async function syncApiOrderToFirestore(row: ApiOrderRow): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const order = mapApiOrderRowToOrder(row);
  const { id, ...rest } = order;
  await orderService.create(
    {
      ...rest,
      updatedAt: new Date().toISOString(),
    } as Omit<Order, 'id'>,
    id
  );
}
