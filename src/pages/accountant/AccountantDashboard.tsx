import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Wallet, FileText, Receipt, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { getDashboardStats, getPLSummary } from '../../services/dashboard';

export default function AccountantDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pl, setPl] = useState<{ revenue: number; expenses: number; profit: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = new Date();
    start.setDate(1);
    const startStr = start.toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];
    Promise.all([getDashboardStats(), getPLSummary(startStr, endStr)])
      .then(([s, p]) => {
        setStats(s);
        setPl(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const cards = [
    { label: 'Oylik tushum', value: formatCurrency(stats?.monthlyRevenue || 0), icon: Wallet },
    { label: 'Qarzdorlik (jami)', value: formatCurrency(stats?.totalReceivables || 0), icon: FileText },
    { label: 'Muddatidan o‘tgan qarz', value: formatCurrency(stats?.overdueReceivables || 0), icon: Receipt },
    { label: 'Faol mijozlar', value: `${stats?.activeClients || 0} ta`, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Buxgalteriya dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <Card key={i} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{c.label}</span>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900">{c.value}</div>
          </Card>
        ))}
      </div>
      {pl && (
        <Card className="bg-white/70 text-slate-900 border border-emerald-200/60">
          <h3 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" /> Foyda va Zarar (P&L) - Joriy oy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400">Daromad</div>
              <div className="text-xl font-bold text-emerald-400">{formatCurrency(pl.revenue)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Xarajatlar</div>
              <div className="text-xl font-bold text-red-400">{formatCurrency(pl.expenses)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Toza foyda</div>
              <div className="text-xl font-bold text-emerald-600">{formatCurrency(pl.profit)}</div>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" /> Tezkor harakatlar
        </h3>
        <p className="text-slate-600">Kassa & Bank, Akt sverka, Xarajatlar va Ish haqi bo‘limlariga sidebar orqali o‘ting.</p>
      </Card>
    </div>
  );
}
