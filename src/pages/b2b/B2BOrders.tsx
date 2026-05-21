import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, Clock, CheckCircle2, Truck, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchClientOrdersMerged } from '../../utils/mergedData';
import type { Order, User } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Qabul qilindi',
  confirmed: 'Tasdiqlandi',
  picking: 'Yig\'ilmoqda',
  packed: 'Qadoqlangan',
  in_transit: 'Yo\'lga chiqdi',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
  returned: 'Qaytarildi',
};

async function loadOrdersForClient(userData: User | null): Promise<Order[]> {
  const uid = userData?.uid;
  if (!uid) return [];
  return fetchClientOrdersMerged(uid, userData?.djangoUserId);
}

export default function B2BOrders() {
  const { user, userData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const visibleOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await loadOrdersForClient(userData);
        if (!cancelled) setOrders(list);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userData?.uid, userData?.djangoUserId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Mening buyurtmalarim</h1>
        <Button
          variant="outline"
          type="button"
          onClick={() => { const s = window.prompt('Holat bo‘yicha qidiruv (masalan: pending):', ''); if (s) setStatusFilter(s); }}
        >
          Filtr
        </Button>
      </div>

      {visibleOrders.length === 0 ? (
        <Card className="py-10 sm:py-16 text-center">
          <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Buyurtmalar yo&apos;q</h3>
          <p className="text-slate-500 mb-4">Katalogdan buyurtma bering</p>
          <Link
            to="/b2b/catalog"
            className="inline-flex items-center justify-center rounded-full font-medium px-5 py-2.5 text-sm bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-md hover:from-emerald-300 hover:to-emerald-400"
          >
            Katalogga o‘tish
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleOrders.map((order) => (
            <Card key={order.id} className="flex flex-col sm:flex-row items-center justify-between p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg">{order.orderNumber}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span>{formatDate(order.orderDate)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{order.items?.length || 0} xil mahsulot</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 sm:mt-0">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Jami summa</div>
                  <div className="font-bold text-slate-900">{formatPrice(order.totalAmount)} UZS</div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'in_transit' || order.status === 'picking' || order.status === 'packed' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'cancelled' || order.status === 'returned' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {order.status === 'delivered' && <CheckCircle2 className="h-4 w-4" />}
                  {(order.status === 'in_transit' || order.status === 'picking' || order.status === 'packed') && <Truck className="h-4 w-4" />}
                  {order.status === 'pending' && <Clock className="h-4 w-4" />}
                  {STATUS_LABELS[order.status] || order.status}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
