import { useMemo, useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import { addNotification } from '../../platform/notifications';
import { downloadCsv } from '../../platform/csv';
import { useAuth } from '../../context/AuthContext';
import { fetchDriverOrdersMerged } from '../../utils/mergedData';
import type { Order } from '../../types';

export default function DriverInventory() {
  const { userData } = useAuth();
  const driverUid = userData?.uid ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    if (!driverUid) return;
    void fetchDriverOrdersMerged(userData?.djangoUserId, driverUid).then(setOrders);
  }, [driverUid, userData?.djangoUserId]);

  const todayStr = new Date().toISOString().split('T')[0];

  const inventory = useMemo(() => {
    const productMap: Record<string, { id: string; name: string; quantity: number; unit: string; status: 'ok' | 'warning' }> = {};
    orders
      .filter(
        (o) =>
          (o.driverId === driverUid ||
            o.driverId === String(userData?.djangoUserId ?? '')) &&
          ['confirmed', 'picking', 'packed', 'in_transit'].includes(o.status)
      )
      .forEach(order => {
        order.items.forEach(item => {
          const key = item.productId || item.productName;
          if (!productMap[key]) {
            productMap[key] = { id: item.productId || item.sku || key, name: item.productName, quantity: 0, unit: item.unit || 'kg', status: 'ok' };
          }
          productMap[key].quantity += item.quantity;
        });
      });
    return Object.values(productMap);
  }, [orders, driverUid]);

  const docRef = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `#N-${y}-${m}-${day}`;
  }, []);

  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);

  const handleAcceptCargo = () => {
    addNotification('Yuk qabul qilindi', `${totalUnits} birlik yuk qabul qilindi (${todayStr}).`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" /> Nakladnoy (Yuk xati)
        </h2>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" type="button" onClick={() => { downloadCsv(`nakladnoy-${Date.now()}.csv`, inventory.map(i => ({ mahsulot: i.name, miqdor: i.quantity }))); addNotification('Nakladnoy', 'CSV yuklandi (PDF printer orqali chop etishingiz mumkin).'); }}>
          <Download className="h-4 w-4" /> PDF
        </Button>
      </div>

      <Card className="bg-emerald-50 text-slate-900 border border-emerald-200/60 shadow-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-emerald-700 text-sm">Hujjat raqami</div>
          <div className="font-bold">{docRef}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-emerald-700 text-sm">Jami yuk</div>
          <div className="font-bold text-xl">
            {totalUnits} <span className="text-sm font-normal text-emerald-700">birlik</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {inventory.length === 0 ? (
          <p className="text-sm text-slate-500 px-1">Sizga tayinlangan faol buyurtmalar yo&apos;q yoki yuk hali tayinlanmagan.</p>
        ) : (
          inventory.map((item) => (
            <Card key={item.id} className="p-4 shadow-sm border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {item.status === 'ok' ? <Package className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">KOD: {item.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-lg">{item.quantity}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.unit}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {inventory.length > 0 && (
        <div className="pt-4">
          <Button variant="primary" className="w-full h-12 gap-2 shadow-md" type="button" onClick={handleAcceptCargo}>
            <CheckCircle2 className="h-5 w-5" /> Yukni qabul qildim
          </Button>
        </div>
      )}
    </div>
  );
}
