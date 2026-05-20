import { useMemo, useState } from 'react';
import { where, type QueryConstraint } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Truck, MapPin, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { notifyPlannedFeature, addNotification } from '../../platform/notifications';
import { useFirestore } from '../../hooks/useFirestore';
import type { Delivery, User } from '../../types';

function deliveryStatusUz(status: Delivery['status']): string {
  switch (status) {
    case 'completed':
      return 'Yakunlandi';
    case 'in_progress':
      return "Yo\u2019lda";
    default:
      return 'Rejada';
  }
}

const DRIVER_CONSTRAINTS: QueryConstraint[] = [where('role', '==', 'driver')];

export default function AdminLogistics() {
  const { data: deliveries, loading, create: createDelivery } = useFirestore<Delivery>('deliveries');
  const { data: drivers } = useFirestore<User>('users', DRIVER_CONSTRAINTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    driverId: '',
    driverName: '',
    vehicleNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find(d => (d.id ?? d.uid) === driverId);
    setForm(f => ({
      ...f,
      driverId,
      driverName: driver?.name || '',
      vehicleNumber: driver?.vehicleNumber || f.vehicleNumber,
    }));
  };

  const handleCreate = async () => {
    if (!form.driverName.trim() || !form.date) return;
    setSaving(true);
    try {
      const routeId = `RT-${Date.now().toString(36).toUpperCase()}`;
      await createDelivery({
        routeId,
        driverId: form.driverId,
        driverName: form.driverName.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        date: form.date,
        status: 'planned',
        orders: [],
        totalCashCollected: 0,
        totalCardCollected: 0,
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
      } as Omit<Delivery, 'id'>);
      setShowCreateModal(false);
      setForm({ driverId: '', driverName: '', vehicleNumber: '', date: new Date().toISOString().split('T')[0], notes: '' });
      addNotification('Marshrut yaratildi', `${routeId} muvaffaqiyatli saqlandi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Marshrut yaratishda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

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
                .join(' \u2192 ') || d.routeId
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
          onClick={() => setShowCreateModal(true)}
        >
          <Truck className="h-4 w-4" /> Yangi marshrut
        </Button>
      </div>

      {loading && <p className="text-slate-500 text-sm">Yuklanmoqda...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!loading && rows.length === 0 && (
            <Card className="p-6 text-slate-500">Hozircha yetkazib berish yozuvlari yo&apos;q. &quot;Yangi marshrut&quot; tugmasini bosing.</Card>
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
                        : delivery.status === "Yo\u2019lda"
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {delivery.status === 'Yakunlandi' && <CheckCircle2 className="h-3 w-3" />}
                    {delivery.status === "Yo\u2019lda" && <Truck className="h-3 w-3" />}
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
                    <MapPin className="h-3 w-3 text-slate-400" /> {delivery.route || '\u2014'}
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
            <p className="text-sm text-slate-500 mb-4">Qaytarishlar ro&apos;yxati keyinchalik ma&apos;lumotlar bazasiga ulanadi.</p>
            <Button
              variant="outline"
              className="w-full mt-4"
              type="button"
              onClick={() => notifyPlannedFeature('Vozvratlar ro\u2019yxati')}
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

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi marshrut" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Haydovchi *</label>
            {drivers.length > 0 ? (
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={form.driverId}
                onChange={(e) => handleDriverSelect(e.target.value)}
              >
                <option value="">Haydovchi tanlang</option>
                {drivers.map(d => (
                  <option key={d.id ?? d.uid} value={d.id ?? d.uid}>{d.name} {d.vehicleNumber ? `(${d.vehicleNumber})` : ''}</option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Haydovchi ismi *"
                value={form.driverName}
                onChange={(e) => setForm(f => ({ ...f, driverName: e.target.value }))}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transport raqami</label>
              <Input
                placeholder="01 A 123 AA"
                value={form.vehicleNumber}
                onChange={(e) => setForm(f => ({ ...f, vehicleNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sana *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <Input
            placeholder="Izoh (ixtiyoriy)"
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleCreate} disabled={saving || !form.driverName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
