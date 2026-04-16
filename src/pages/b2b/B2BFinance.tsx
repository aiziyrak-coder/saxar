import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, FileText, Wallet, TrendingDown, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClientBalance, getPaymentsByClient, getOrdersByClient } from '../../services/firestore';
import type { Payment } from '../../types';

interface TrxRow {
  id: string;
  date: string;
  type: string;
  amount: number;
  balance: number;
}

export default function B2BFinance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TrxRow[]>([]);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getClientBalance(user.uid),
      getPaymentsByClient(user.uid),
      getOrdersByClient(user.uid, 100),
    ]).then(([bal, payments, orders]) => {
      setBalance(bal);
      if (payments.length > 0) setLastPayment(payments[0]);
      const orderRows: TrxRow[] = orders.map(o => ({
        id: o.orderNumber,
        date: o.orderDate,
        type: 'Buyurtma',
        amount: -o.totalAmount,
        balance: 0,
      }));
      const paymentRows: TrxRow[] = payments.map(p => ({
        id: p.referenceNumber || p.id.slice(0, 8),
        date: p.createdAt.slice(0, 10),
        type: 'To\'lov',
        amount: p.amount,
        balance: 0,
      }));
      const combined = [...orderRows, ...paymentRows].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 50);
      let run = 0;
      combined.forEach(t => {
        run += t.amount;
        t.balance = run;
      });
      setTransactions(combined);
    }).finally(() => setLoading(false));
  }, [user?.uid]);

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });

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
        <h1 className="text-2xl font-bold text-slate-900">Akt Sverka (O&apos;zaro hisob-kitob)</h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> PDF yuklab olish
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-slate-900 border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="text-emerald-700 font-medium">Joriy qarz (Korxona oldida)</div>
            <TrendingDown className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold mb-2">{formatPrice(balance ?? 0)} UZS</div>
          {lastPayment && (
            <div className="text-sm text-emerald-700 mt-4 pt-4 border-t border-emerald-500/30">
              So&apos;nggi to&apos;lov: {formatPrice(lastPayment.amount)} UZS ({formatDate(lastPayment.createdAt)})
            </div>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-500 font-medium">To&apos;lov qilish</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Payme</Button>
              <Button variant="outline" className="flex-1">Click</Button>
              <Button variant="outline" className="flex-1">Uzum Pay</Button>
            </div>
            <Button variant="primary" className="w-full">To&apos;lovni amalga oshirish</Button>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" /> Tranzaksiyalar tarixi
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Sana</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Hujjat / ID</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Turi</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Summa</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-right">Qoldiq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Tranzaksiyalar yo&apos;q</td>
                </tr>
              ) : (
                transactions.map((trx, i) => (
                  <tr key={`${trx.id}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{formatDate(trx.date)}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{trx.id}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trx.type === 'To\'lov' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trx.type}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-sm text-right font-bold ${trx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trx.amount > 0 ? '+' : ''}{formatPrice(trx.amount)} UZS
                    </td>
                    <td className="py-4 px-6 text-sm text-right font-bold text-slate-900">
                      {formatPrice(trx.balance)} UZS
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
