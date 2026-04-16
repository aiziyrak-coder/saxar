import { Card } from '../../components/ui/Card';
import { Wallet, Building2, CreditCard } from 'lucide-react';

export default function AccountantFinance() {
  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n);

  const accounts = [
    { name: 'Kassa (naqd)', type: 'cash', balance: 12500000, icon: Wallet },
    { name: 'Bank (asosiy hisob)', type: 'bank', balance: 85000000, icon: Building2 },
    { name: 'Click / Payme', type: 'terminal', balance: 32000000, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Kassa va Bank</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <acc.icon className="h-6 w-6" />
              </div>
              <span className="font-semibold text-slate-900">{acc.name}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</div>
            <p className="text-sm text-slate-500 mt-2">Naqd kirim/chiqim va to‘lovlar Admin → Moliya bo‘limida kiritiladi.</p>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="text-lg font-bold text-slate-900 mb-2">To‘lov tizimlari integratsiyasi</h3>
        <p className="text-slate-600">Payme, Click, Uzum Pay API lari orqali B2B mijozlar qarzini to‘lash imkoniyati sozlamalarda yoqiladi.</p>
      </Card>
    </div>
  );
}
