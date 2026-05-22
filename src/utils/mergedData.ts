import { orderApi, paymentApi } from '../services/api';
import { hasDjangoJwt } from '../services/djangoAuth';
import { mapApiOrderRowToOrder, mapApiPaymentRowToPayment } from '../services/b2bFromApi';
import type { Order, Payment } from '../types';

export async function fetchAllOrdersMerged(): Promise<Order[]> {
  if (!hasDjangoJwt()) return [];
  try {
    return (await orderApi.getAll()).map(mapApiOrderRowToOrder);
  } catch {
    return [];
  }
}

export async function fetchClientOrdersMerged(
  _firebaseUid: string,
  djangoClientId?: number
): Promise<Order[]> {
  if (!djangoClientId || !hasDjangoJwt()) return [];
  try {
    const rows = await orderApi.getAll();
    return rows
      .filter((r) => Number(r.client) === djangoClientId)
      .map(mapApiOrderRowToOrder)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function fetchPaymentsMerged(
  _firebaseUid?: string,
  djangoClientId?: number
): Promise<Payment[]> {
  if (!hasDjangoJwt()) return [];
  try {
    const rows = await paymentApi.getAll();
    return rows
      .filter((p) => (djangoClientId != null ? Number(p.client) === djangoClientId : true))
      .map(mapApiPaymentRowToPayment)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function fetchDriverOrdersMerged(
  djangoDriverId: number | undefined,
  _firebaseUid: string
): Promise<Order[]> {
  if (!djangoDriverId || !hasDjangoJwt()) return [];
  try {
    return (await orderApi.getAll())
      .filter((r) => Number(r.driver) === djangoDriverId)
      .map(mapApiOrderRowToOrder);
  } catch {
    return [];
  }
}
