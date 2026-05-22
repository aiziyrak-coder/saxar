import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Truck, MapPin, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { addNotification } from '../../platform/notifications';
import { openLiveMap } from '../../utils/featureActions';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { djangoUsersApi } from '../../services/platformApi';
import { djangoRowToUser } from '../../utils/djangoUsers';
import { fetchAllOrdersMerged } from '../../utils/mergedData';
import DjangoApiReconnect from '../../components/DjangoApiReconnect';
import { roleSubPath } from '../../constants/roles';
import type { Order, OrderStatus, User } from '../../types';

const LOGISTICS_STATUSES: OrderStatus[] = ['picking', 'packed', 'in_transit', 'delivered', 'returned'];

function statusUz(status: OrderStatus): string {
  switch (status) {
    case 'delivered':
      return 'Yakunlandi';
    case 'in_transit':
      return "Yo\u2019lda";
    case 'packed':
      return 'Qadoqlangan';
    case 'picking':
      return "Yig\u2019ilmoqda";
    case 'returned':
      return 'Qaytarilgan';
    default:
      return status;
  }
}

export default function AdminLogistics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!hasDjangoJwt()) {
        setOrders([]);
        setDrivers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [orderRows, driverRows] = await Promise.all([
          fetchAllOrdersMerged(),
          djangoUsersApi.list('driver'),
        ]);
        setOrders(orderRows.filter((o) => LOGISTICS_STATUSES.includes(o.status)));
        setDrivers(driverRows.map(djangoRowToUser));
      } catch {
        setOrders([]);
        setDrivers([]);
        addNotification('Xatolik', 'Logistika ma’lumotlari yuklanmadi.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const rows = useMemo(() => {
    const byDriver = new Map<string, Order[]>();
    for (const o of orders) {
      const key = o.driverId || o.driverName || '_unassigned';
      const list = byDriver.get(key) ?? [];
      list.push(o);
      byDriver.set(key, list);
    }
    return Array.from(byDriver.entries()).map(([driverKey, driverOrders]) => {
      const driverUser = drivers.find(
        (d) => d.id === driverKey || d.uid === driverKey || String(d.djangoUserId) === driverKey.replace('django_', '')
      );
      const completed = driverOrders.filter((o) => o.status === 'delivered').length;
      const route = driverOrders
        .map((o) => o.clientAddress || o.clientName)
        .filter(Boolean)
        .slice(0, 3)
        .join(' \u2192 ');
      const activeStatus = driverOrders.some((o) => o.status === 'in_transit')
        ? 'in_transit'
        : driverOrders.some((o) => o.status === 'delivered')
          ? 'delivered'
          : 'picking';
      return {
        id: driverKey,
        driver: driverUser?.name || driverOrders[0]?.driverName || driverOrders[0]?.agentName || 'Tayinlanmagan',
        vehicle: driverUser?.vehicleNumber || '\u2014',
        route: route || '\u2014',
        status: statusUz(activeStatus),
        points: driverOrders.length,
        completed,
        amount: driverOrders.reduce((s, o) => s + o.totalAmount, 0),
        orders: driverOrders,
      };
    });
  }, [orders, drivers]);

  const returns = useMemo(() => orders.filter((o) => o.status === 'returned'), [orders]);

  if (!hasDjangoJwt()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Logistika va Yetkazib berish</h1>
        <DjangoApiReconnect />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Logistika va Yetkazib berish</h1>
        <Link to={roleSubPath('admin', 'orders')}>
          <Button variant="primary" className="gap-2" type="button">
            <Truck className="h-4 w-4" /> Buyurtmalarda boshqarish
          </Button>
        </Link>
      </div>

      <p className="text-sm text-slate-500">
        Marshrutlar buyurtmalar holati va haydovchi bo‘yicha guruhlanadi (Django API). Yangi marshrut yaratish o‘rniga
        buyurtmada haydovchi tayinlang.
      </p>

      {loading && (
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!loading && rows.length === 0 && (
            <Card className="p-6 text-slate-500">
              Yetkazishdagi buyurtmalar yo‘q. Buyurtmalar bo‘limida holatni «Yo‘lda» yoki «Qadoqlangan» qiling.
            </Card>
          )}
          {rows.map((delivery) => (
            <Card key={delivery.id} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-slate-900">{delivery.driver}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      delivery.status === 'Yakunlandi'
                        ? 'bg-emerald-100 text-emerald-700'
                        : delivery.status === "Yo\u2019lda"
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {delivery.status === 'Yakunlandi' && <CheckCircle2 className="h-3 w-3" />}
                    {delivery.status === "Yo\u2019lda" && <Truck className="h-3 w-3" />}
                    {delivery.status !== 'Yakunlandi' && delivery.status !== "Yo\u2019lda" && (
                      <Clock className="h-3 w-3" />
                    )}
                    {delivery.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Haydovchi (tizim):</div>
                  <div className="font-medium text-slate-900">{delivery.driver}</div>
                  <div className="text-slate-500">Transport:</div>
                  <div className="font-medium text-slate-900">{delivery.vehicle}</div>
                  <div className="text-slate-500">Marshrut:</div>
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" /> {delivery.route}
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-48 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Buyurtmalar:</div>
                <div className="font-bold text-slate-900 mb-3">
                  {delivery.completed} / {delivery.points} ta
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${delivery.points ? Math.min(100, (delivery.completed / delivery.points) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="text-sm text-slate-500 mb-1">Summa:</div>
                <div className="font-bold text-emerald-600">{delivery.amount.toLocaleString()} UZS</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Vozvratlar (Qaytarish)
            </h3>
            {returns.length === 0 ? (
              <p className="text-sm text-slate-500">Qaytarilgan buyurtmalar yo‘q.</p>
            ) : (
              <ul className="text-sm space-y-2 max-h-40 overflow-y-auto">
                {returns.map((o) => (
                  <li key={o.id} className="flex justify-between gap-2">
                    <span>{o.orderNumber || o.id}</span>
                    <span className="text-slate-500">{o.clientName}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to={roleSubPath('admin', 'orders')} className="block mt-4">
              <Button variant="outline" className="w-full" type="button">
                Barcha buyurtmalar
              </Button>
            </Link>
          </Card>

          <Card className="bg-white/70 text-slate-900 border-emerald-200/60">
            <h3 className="font-bold mb-2">Haydovchilar ({drivers.length})</h3>
            {drivers.length === 0 ? (
              <p className="text-sm text-slate-500 mb-4">Haydovchi ro‘yxati bo‘sh — Sozlamalar orqali qo‘shing.</p>
            ) : (
              <ul className="text-sm text-slate-600 mb-4 max-h-32 overflow-y-auto space-y-1">
                {drivers.map((d) => (
                  <li key={d.id}>{d.name} {d.phone ? `· ${d.phone}` : ''}</li>
                ))}
              </ul>
            )}
            <Button variant="primary" className="w-full" type="button" onClick={() => openLiveMap()}>
              Kuzatish (xarita)
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
