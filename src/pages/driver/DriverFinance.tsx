import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Wallet, ArrowUpRight, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { notifyPlannedFeature } from '../../platform/notifications';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import type { Client, Order, Payment } from '../../types';

export default function DriverFinance() {
  const [amount, setAmount] = useState('');
  const { userData } = useAuth();
  const driverUid = userData?.uid ?? '';
  const { data: orders } = useFirestore<Order>('orders');
  const { data: clients } = useFirestore<Client>('clients');
  const { data: payments } = useFirestore<Payment>('payments');

  const myOrderClientIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of orders) {
      if (o.driverId === driverUid) ids.add(o.clientId);
    }
    return ids;
  }, [orders, driverUid]);

  const debtList = useMemo(
    () =>
      clients
        .filter((c) => myOrderClientIds.has(c.id) && c.currentBalance > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          debt: c.currentBalance,
          lastPayment: c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('uz-UZ') : '—',
        })),
    [clients, myOrderClientIds]
  );

  const recentTransactions = useMemo(() => {
    return payments
      .filter((p) => p.clientId && myOrderClientIds.has(p.clientId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        shop: p.clientName || p.description,
        amount: p.amount,
        type: p.type,
        date: new Date(p.createdAt).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }),
      }));
  }, [payments, myOrderClientIds]);

  const routeDebt = debtList.reduce((s, x) => s + x.debt, 0);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-slate-900 border-none shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-900">Marshrut bo‘yicha qarzdorlik (yig‘ilishi kerak)</h2>
          <Wallet className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="text-3xl font-bold mb-1">
          {routeDebt.toLocaleString('uz-UZ')} <span className="text-lg font-normal text-emerald-700">UZS</span>
        </div>
        <div className="text-sm text-emerald-700 flex items-center gap-1 mt-2">
          <AlertCircle className="h-4 w-4" />
          {debtList.length ? `${debtList.length} ta mijoz` : 'Sizga biriktirilgan buyurtmalar bo‘yicha qarzdorlik yo‘q'}
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-emerald-600" /> Pul qabul qilish
        </h3>
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Do&apos;konni tanlang</label>
            <select className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Tanlang...</option>
              {debtList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} (Qarz: {shop.debt.toLocaleString('uz-UZ')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Summa (UZS)</label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full bg-slate-50 border-slate-200 text-slate-700"
              type="button"
              onClick={() => notifyPlannedFeature('Karta orqali to‘lov')}
            >
              Karta orqali
            </Button>
            <Button
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-700 border-none"
              type="button"
              onClick={() => notifyPlannedFeature('Naqd pul qabul qilish')}
            >
              Naqd pul
            </Button>
          </div>
        </form>
      </Card>

      <Button
        variant="primary"
        className="w-full h-14 text-lg font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 border-none gap-2"
        type="button"
        onClick={() => notifyPlannedFeature('Kassaga topshirish')}
      >
        <Wallet className="h-6 w-6" /> Kassaga topshirish
      </Button>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" /> So&apos;nggi to&apos;lovlar
          </h3>
          <button
            type="button"
            className="text-sm text-emerald-700 font-medium hover:underline"
            onClick={() => notifyPlannedFeature('To‘lovlar tarixi')}
          >
            Barchasi
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 px-1">Hozircha to‘lov yozuvlari yo‘q.</p>
          ) : (
            recentTransactions.map((trx) => (
              <Card key={trx.id} className="p-4 shadow-sm border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{trx.shop}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {trx.date} • {trx.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 text-sm">+{trx.amount.toLocaleString('uz-UZ')}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">{trx.id}</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
