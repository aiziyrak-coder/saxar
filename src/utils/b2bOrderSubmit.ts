import { orderApi, type ApiOrderRow } from '../services/api';
import { hasDjangoJwt } from '../services/djangoAuth';
import { logger } from '../services/logger';
import { syncApiOrderToFirestore } from './orderSync';
import type { User } from '../types';

export interface CartLineItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
}

/** B2B buyurtma — faqat Django API (narxlar serverda hisoblanadi). */
export async function submitB2BOrder(params: {
  user: { uid: string };
  userData: User;
  items: CartLineItem[];
  totalAmount: number;
  orderNotes: string;
  clientAddress: string;
}): Promise<{ ok: boolean; orderId: string; viaApi: boolean; error?: string }> {
  const { userData, items, totalAmount } = params;
  const djangoClientId = userData.djangoUserId;

  if (userData.status === 'pending' || userData.status === 'inactive') {
    return { ok: false, orderId: '', viaApi: false, error: 'Hisob tasdiqlanmagan yoki nofaol.' };
  }

  if (!djangoClientId) {
    return {
      ok: false,
      orderId: '',
      viaApi: false,
      error: 'Django mijoz ID topilmadi. Qayta ro‘yxatdan o‘ting yoki admin bilan bog‘laning.',
    };
  }

  if (!hasDjangoJwt()) {
    return {
      ok: false,
      orderId: '',
      viaApi: false,
      error: 'API sessiyasi yo‘q. Chiqib qayta kiring.',
    };
  }

  const apiItems = items.map((item) => ({
    product: Number(item.productId) || item.productId,
    quantity: item.quantity,
    price: item.unitPrice,
    total: item.totalPrice,
  }));

  try {
      const created = await orderApi.create({
        source: 'b2b',
        status: 'pending',
        client: djangoClientId,
        total_amount: totalAmount,
        items: apiItems,
      } as Record<string, unknown>);
      const row = created as ApiOrderRow;
      const id = String(row?.id ?? '');
      try {
        await syncApiOrderToFirestore(row);
      } catch (syncErr) {
        logger.warn('Buyurtma Firestore sinxron xato', {
          detail: syncErr instanceof Error ? syncErr.message : String(syncErr),
        });
      }
      return { ok: true, orderId: id || 'api', viaApi: true };
  } catch (e) {
    logger.warn('B2B buyurtma API xato', {
      detail: e instanceof Error ? e.message : String(e),
    });
    return {
      ok: false,
      orderId: '',
      viaApi: false,
      error: e instanceof Error ? e.message : 'Buyurtma serverga yuborilmadi',
    };
  }
}
