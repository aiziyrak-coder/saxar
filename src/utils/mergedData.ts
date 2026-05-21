import { orderApi, paymentApi } from '../services/api';
import { hasDjangoJwt } from '../services/djangoAuth';
import { mapApiOrderRowToOrder, mapApiPaymentRowToPayment } from '../services/b2bFromApi';
import { getOrdersByClient, getPaymentsByClient } from '../services/firestore';
import type { Order, Payment } from '../types';

function mergeOrdersByKey(primary: Order[], secondary: Order[]): Order[] {
  const seen = new Set(primary.map((o) => o.orderNumber || o.id));
  const merged = [...primary];
  for (const o of secondary) {
    const key = o.orderNumber || o.id;
    if (!seen.has(key)) {
      merged.push(o);
      seen.add(key);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function fetchAllOrdersMerged(): Promise<Order[]> {
  let fromApi: Order[] = [];
  if (hasDjangoJwt()) {
    try {
      fromApi = (await orderApi.getAll()).map(mapApiOrderRowToOrder);
    } catch {
      fromApi = [];
    }
  }
  const { orderService } = await import('../services/firestore');
  const fromFs = await orderService.getAll();
  return mergeOrdersByKey(fromApi, fromFs);
}

export async function fetchClientOrdersMerged(
  firebaseUid: string,
  djangoClientId?: number
): Promise<Order[]> {
  let fromApi: Order[] = [];
  if (djangoClientId && hasDjangoJwt()) {
    try {
      const rows = await orderApi.getAll();
      fromApi = rows
        .filter((r) => Number(r.client) === djangoClientId)
        .map(mapApiOrderRowToOrder);
    } catch {
      fromApi = [];
    }
  }
  const fromFs = await getOrdersByClient(firebaseUid, 100);
  return mergeOrdersByKey(fromApi, fromFs);
}

export async function fetchPaymentsMerged(
  firebaseUid?: string,
  djangoClientId?: number
): Promise<Payment[]> {
  let fromApi: Payment[] = [];
  if (hasDjangoJwt()) {
    try {
      const rows = await paymentApi.getAll();
      fromApi = rows
        .filter((p) =>
          djangoClientId != null
            ? Number(p.client) === djangoClientId
            : true
        )
        .map(mapApiPaymentRowToPayment);
    } catch {
      fromApi = [];
    }
  }
  if (!firebaseUid) return fromApi;
  const fromFs = await getPaymentsByClient(firebaseUid);
  const seen = new Set(fromApi.map((p) => p.id));
  const merged = [...fromApi];
  for (const p of fromFs) {
    if (!seen.has(p.id)) merged.push(p);
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Haydovchi buyurtmalari — API (driver FK) + Firestore (driverId uid). */
export async function fetchDriverOrdersMerged(
  djangoDriverId: number | undefined,
  firebaseUid: string
): Promise<Order[]> {
  let fromApi: Order[] = [];
  if (djangoDriverId && hasDjangoJwt()) {
    try {
      fromApi = (await orderApi.getAll())
        .filter((r) => Number(r.driver) === djangoDriverId)
        .map(mapApiOrderRowToOrder);
    } catch {
      fromApi = [];
    }
  }
  const { orderService } = await import('../services/firestore');
  const allFs = await orderService.getAll();
  const fromFs = allFs.filter((o) => o.driverId === firebaseUid);
  return mergeOrdersByKey(fromApi, fromFs);
}
