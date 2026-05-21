import { orderApi } from '../services/api';
import { hasDjangoJwt } from '../services/djangoAuth';
import { mapApiOrderRowToOrder } from '../services/b2bFromApi';
import { getOrdersByStatuses } from '../services/firestore';
import type { Order, OrderStatus } from '../types';

const SHIP_STATUSES: OrderStatus[] = ['confirmed', 'picking', 'packed'];

/** Ombor chiqim: Django API + Firestore buyurtmalarini birlashtiradi. */
export async function loadWarehouseShipmentOrders(): Promise<Order[]> {
  const fromFs = await getOrdersByStatuses(SHIP_STATUSES);
  if (!hasDjangoJwt()) return fromFs;

  try {
    const rows = await orderApi.getAll();
    const fromApi = rows
      .map(mapApiOrderRowToOrder)
      .filter((o) => SHIP_STATUSES.includes(o.status));
    const seen = new Set(fromApi.map((o) => o.orderNumber || o.id));
    const merged = [...fromApi];
    for (const o of fromFs) {
      const key = o.orderNumber || o.id;
      if (!seen.has(key)) {
        merged.push(o);
        seen.add(key);
      }
    }
    return merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return fromFs;
  }
}
