import { orderApi } from '../services/api';
import { hasDjangoJwt } from '../services/djangoAuth';
import { mapApiOrderRowToOrder } from '../services/b2bFromApi';
import type { Order, OrderStatus } from '../types';

const SHIP_STATUSES: OrderStatus[] = ['confirmed', 'picking', 'packed'];

export async function loadWarehouseShipmentOrders(): Promise<Order[]> {
  if (!hasDjangoJwt()) return [];
  try {
    const rows = await orderApi.getAll();
    return rows
      .map(mapApiOrderRowToOrder)
      .filter((o) => SHIP_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}
