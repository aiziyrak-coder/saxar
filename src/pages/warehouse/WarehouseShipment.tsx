import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ArrowUpFromLine, Truck, Package, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import {
  getOrdersByStatuses,
  deductFIFO,
  orderService,
} from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import type { Order, OrderItem, Product } from '../../types';

export default function WarehouseShipment() {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: products } = useFirestore<Product>('products');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getOrdersByStatuses(['confirmed', 'picking', 'packed']);
        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) setError('Buyurtmalar yuklanmadi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleShip = async () => {
    if (!selectedOrder || !user || !userData) return;
    setError(null);
    setSubmitting(true);
    try {
      const items = (selectedOrder.items || []) as OrderItem[];
      for (const line of items) {
        const product = products.find(p => p.id === line.productId);
        const name = product?.name || line.productName || '';
        const sku = product?.sku || line.sku || '';
        const unit = product?.unit || line.unit || 'dona';
        const result = await deductFIFO(
          line.productId,
          name,
          sku,
          unit,
          line.quantity,
          selectedOrder.id,
          selectedOrder.orderNumber,
          user.uid,
          userData.name || 'Omborchi'
        );
        if (!result.success) {
          setError(`${name}: omborda yetarli emas. Kamomad: ${result.shortage} ${unit}`);
          return;
        }
      }
      await orderService.update(selectedOrder.id, {
        status: 'packed',
        updatedAt: new Date().toISOString(),
      });
      if (userData) {
        await logAudit(AuditActions.ORDER_STATUS_CHANGE, EntityTypes.ORDER, selectedOrder.id, user.uid, userData.name || '', userData.role, { status: selectedOrder.status }, { status: 'packed' });
      }
      setSelectedOrder(null);
      const list = await getOrdersByStatuses(['confirmed', 'picking', 'packed']);
      setOrders(list);
    } catch (e) {
      console.error(e);
      setError('Chiqim bajarishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const productName = (item: OrderItem) =>
    products.find(p => p.id === item.productId)?.name || item.productName || item.productId;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Chiqim (Logistikaga yuklab berish)</h1>
      <p className="text-slate-600">
        FIFO bo‘yicha eng avval kirgan partiyalar chiqariladi. Buyurtmani tanlang va «Yuklab berish» ni bosing.
      </p>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Package className="h-12 w-12 mb-4 text-slate-300" />
            <p>Yuklab berish kerak bo‘lgan buyurtmalar yo‘q.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Buyurtma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mijoz</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Holat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Summa</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{o.clientName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{o.status}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">
                      {new Intl.NumberFormat('uz-UZ').format(o.totalAmount || 0)} so‘m
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedOrder(o)}
                      >
                        <Truck className="h-4 w-4" /> Yuklab berish
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => !submitting && setSelectedOrder(null)}
        title={`Yuklab berish: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Quyidagi mahsulotlar FIFO bo‘yicha ombordan chiqariladi.
            </p>
            <ul className="border rounded-lg divide-y divide-slate-200">
              {(selectedOrder.items || []).map((item: OrderItem, idx: number) => (
                <li key={idx} className="px-4 py-2 flex justify-between text-sm">
                  <span>{productName(item)}</span>
                  <span className="font-medium">{item.quantity} {item.unit}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)} disabled={submitting}>
                Bekor qilish
              </Button>
              <Button variant="primary" onClick={handleShip} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
                Yuklab berish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
