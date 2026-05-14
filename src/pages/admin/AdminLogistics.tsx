import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Truck, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { notifyPlannedFeature } from '../../platform/notifications';
import { useFirestore } from '../../hooks/useFirestore';
import type { Delivery } from '../../types';

function deliveryStatusUz(status: Delivery['status']): string {
  switch (status) {
    case 'completed':
      return 'Yakunlandi';
    case 'in_progress':
      return "Yo'lda";
    default:
      return 'Rejada';
  }
}

export default function AdminLogistics() {
  const { data: deliveries, loading } = useFirestore<Delivery>('deliveries');

  const rows = useMemo(
    () =>
      deliveries.map((d) => {
        const points = d.orders.length;
        const completed = d.orders.filter((o) => o.status === 'delivered').length;
        const amount = d.orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const route =
          d.orders.length > 0
            ? d.orders
                .map((o) => o.clientAddress || o.clientName)
                .filter(Boolean)
                .slice(0, 3)
                .join(' → ') || d.routeId
            : d.routeId;
        return {
          id: d.id,
          driver: d.driverName,
          vehicle: d.vehicleNumber,
          route,
          status: deliveryStatusUz(d.status),
          points: points || 1,
          completed,
          amount,
        };
      }),
    [deliveries]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Logistika va Yetkazib berish</h1>
        <Button
          variant="primary"
          className="gap-2"
          type="button"
          onClick={() => notifyPlannedFeature('Yangi marshrut')}
        >
          <Truck className="h-4 w-4" /> Yangi marshrut
        </Button>
      </div>

      {loading && <p className="text-slate-500 text-sm">Yuklanmoqda...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!loading && rows.length === 0 && (
            <Card className="p-6 text-slate-500">Hozircha yetkazib berish yozuvlari yo‘q (`deliveries`).</Card>
          )}
          {rows.map((delivery) => (
            <Card key={delivery.id} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-slate-900">{delivery.id}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      delivery.status === 'Yakunlandi'
                        ? 'bg-emerald-100 text-emerald-700'
                        : delivery.status === "Yo'lda"
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {delivery.status === 'Yakunlandi' && <CheckCircle2 className="h-3 w-3" />}
                    {delivery.status === "Yo'lda" && <Truck className="h-3 w-3" />}
                    {delivery.status === 'Rejada' && <Clock className="h-3 w-3" />}
                    {delivery.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Haydovchi:</div>
                  <div className="font-medium text-slate-900">{delivery.driver}</div>

                  <div className="text-slate-500">Transport:</div>
                  <div className="font-medium text-slate-900">{delivery.vehicle}</div>

                  <div className="text-slate-500">Marshrut:</div>
                  <div className="font-medium text-slate-900 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" /> {delivery.route || '—'}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-48 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Nuqtalar:</div>
                <div className="font-bold text-slate-900 mb-3">
                  {delivery.completed} / {delivery.points} ta do&apos;kon
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (delivery.completed / delivery.points) * 100)}%` }}
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
            <p className="text-sm text-slate-500 mb-4">Namuna qaytarishlar olib tashlangan. Ro‘yxat keyinchalik ma’lumotlar bazasiga ulanadi.</p>
            <Button
              variant="outline"
              className="w-full mt-4"
              type="button"
              onClick={() => notifyPlannedFeature('Vozvratlar ro‘yxati')}
            >
              Barchasini ko&apos;rish
            </Button>
          </Card>

          <Card className="bg-white/70 text-slate-900 border-emerald-200/60">
            <h3 className="font-bold mb-4">Jonli Xarita</h3>
            <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
              <MapPin className="h-8 w-8 text-slate-600" />
              <span className="ml-2 text-slate-600 font-medium">Xarita integratsiyasi</span>
            </div>
            <Button
              variant="primary"
              className="w-full mt-4"
              type="button"
              onClick={() => notifyPlannedFeature('Jonli xarita', 'GPS kuzatuv integratsiyasi rejada.')}
            >
              Kuzatish
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
