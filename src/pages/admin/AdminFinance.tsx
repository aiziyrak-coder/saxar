import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Wallet, TrendingUp, TrendingDown, FileText, Download, Building2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { downloadCsv } from '../../platform/csv';
import { addNotification, notifyPlannedFeature } from '../../platform/notifications';
import type { Payment, Expense, Client } from '../../types';

export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'aktsverka' | 'expenses'>('transactions');
  
  // Fetch data
  const { data: payments } = useFirestore<Payment>('payments');
  const { data: expenses } = useFirestore<Expense>('expenses');
  const { data: clients } = useFirestore<Client>('clients');

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const totalReceivables = useMemo(
    () => clients.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0),
    [clients]
  );

  const debtorCount = useMemo(() => clients.filter((c) => c.currentBalance > 0).length, [clients]);

  const monthlyRevenue = useMemo(
    () =>
      payments
        .filter((p) => p.direction === 'in' && new Date(p.createdAt) >= monthStart)
        .reduce((s, p) => s + p.amount, 0),
    [payments, monthStart]
  );

  const monthlyOutflow = useMemo(() => {
    const fromPayments = payments
      .filter((p) => p.direction === 'out' && new Date(p.createdAt) >= monthStart)
      .reduce((s, p) => s + p.amount, 0);
    const fromExpenses = expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((s, e) => s + e.amount, 0);
    return fromPayments + fromExpenses;
  }, [payments, expenses, monthStart]);

  // Get recent transactions (payments + expenses combined)
  const allTransactions = [
    ...payments.map(p => ({
      id: p.id,
      date: new Date(p.createdAt).toLocaleDateString('uz-UZ'),
      type: p.direction === 'in' ? 'Kirim' : 'Chiqim' as const,
      amount: p.amount,
      source: p.clientName || p.description,
      method: p.type,
      createdAt: p.createdAt,
    })),
    ...expenses.map(e => ({
      id: e.id,
      date: new Date(e.date).toLocaleDateString('uz-UZ'),
      type: 'Chiqim' as const,
      amount: e.amount,
      source: e.description,
      method: 'Xarajat',
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get debtors
  const debtors = clients.filter(c => c.currentBalance > 0);
  // Total receivables: debtors.reduce((sum, c) => sum + c.currentBalance, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
  };

  const exportFinanceCsv = () => {
    const rows = allTransactions.map((trx) => ({
      sana: trx.date,
      id: trx.id,
      manba: trx.source,
      tur: trx.type,
      usul: trx.method,
      summa_UZS: trx.amount,
    }));
    downloadCsv(`moliya-tranzaksiyalar-${Date.now()}.csv`, rows);
    addNotification('Excel', `${rows.length} ta qator yuklandi.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Moliya va Buxgalteriya</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" type="button" onClick={exportFinanceCsv}>
            <Download className="h-4 w-4" /> Hisobot (Excel)
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => notifyPlannedFeature('Yangi tranzaksiya', 'Qo‘lda tranzaksiya kiritish rejada.')}
          >
            <FileText className="h-4 w-4" /> Yangi tranzaksiya
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-slate-900 border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="text-emerald-700 font-medium">Debet (mijozlar)</div>
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold mb-2">{formatCurrency(totalReceivables)} UZS</div>
          <div className="flex gap-4 text-sm text-emerald-700 mt-4 pt-4 border-t border-emerald-500/30">
            <div>Qarzdor mijozlar: {debtorCount} ta</div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-500 font-medium">Oylik tushum (to‘lovlar)</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(monthlyRevenue)} UZS</div>
          <div className="text-sm font-medium text-slate-500">Joriy oy: kirim yo‘nalishi</div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-500 font-medium">Oylik chiqim</div>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(monthlyOutflow)} UZS</div>
          <div className="text-sm font-medium text-slate-500">Chiqim to‘lovlari + xarajatlar</div>
        </Card>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button 
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Tranzaksiyalar
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'aktsverka' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('aktsverka')}
        >
          Akt Sverka (Qarzdorlik)
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('expenses')}
        >
          Operatsion xarajatlar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          {activeTab === 'transactions' ? (
            <>
              <div className="p-6 border-b border-emerald-200/60 flex justify-between items-center bg-white/60">
                <h3 className="text-lg font-bold text-slate-900">So'nggi tranzaksiyalar</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => notifyPlannedFeature('Barcha tranzaksiyalar')}
                >
                  Barchasi
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/70 border-b border-emerald-200/60">
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Sana / ID</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Manba / Maqsad</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">To'lov turi</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allTransactions.map((trx, i) => (
                      <tr key={i} className="hover:bg-emerald-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{trx.date}</div>
                          <div className="text-xs text-slate-400">{trx.id}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{trx.source}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <span className={`h-2 w-2 rounded-full ${trx.type === 'Kirim' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {trx.type}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700">{trx.method}</td>
                        <td className={`py-4 px-6 text-right font-bold ${trx.type === 'Kirim' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {trx.type === 'Kirim' ? '+' : '-'}{trx.amount.toLocaleString()} UZS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'aktsverka' ? (
            <>
              <div className="p-6 border-b border-emerald-200/60 flex justify-between items-center bg-white/60">
                <h3 className="text-lg font-bold text-slate-900">Mijozlar bilan solishtirma dalolatnoma</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => notifyPlannedFeature('Akt sverka', 'Barcha mijozlar bo‘yicha kengaytirilgan dalolatnoma rejada.')}
                >
                  Barchasi
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/70 border-b border-emerald-200/60">
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Mijoz (Do'kon)</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Qarzdorlik</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">So'nggi to'lov</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {debtors.map((client, i) => (
                      <tr key={i} className="hover:bg-emerald-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-900">{client.name}</td>
                        <td className={`py-4 px-6 font-bold ${client.currentBalance > 0 ? 'text-red-200' : 'text-emerald-300'}`}>
                          {formatCurrency(client.currentBalance)} UZS
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700">
                          {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString('uz-UZ') : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Badge variant={client.currentBalance > 0 ? 'error' : 'success'}>
                            {client.currentBalance > 0 ? 'Qarzdor' : 'Toza'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 border-b border-emerald-200/60 bg-white/60">
                <h3 className="text-lg font-bold text-slate-900">Operatsion xarajatlar (Firestore)</h3>
                <p className="text-sm text-slate-500 mt-1">Buxgalteriya modulidagi xarajat yozuvlari bilan sinxron.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/70 border-b border-emerald-200/60">
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Sana</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Tavsif</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Kategoriya</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[...expenses]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((ex) => (
                        <tr key={ex.id} className="hover:bg-emerald-50 transition-colors">
                          <td className="py-4 px-6 text-sm text-slate-900">
                            {new Date(ex.date).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-900">{ex.description}</td>
                          <td className="py-4 px-6 text-sm text-slate-700">{ex.category}</td>
                          <td className="py-4 px-6 text-right font-bold text-red-600">
                            -{ex.amount.toLocaleString()} UZS
                          </td>
                        </tr>
                      ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Xarajat yozuvlari yo‘q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
        
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" /> Integratsiyalar
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center font-bold text-emerald-600">1C</div>
                  <div>
                    <div className="font-medium text-slate-900">1C: Buxgalteriya</div>
                    <div className="text-xs text-emerald-600 font-medium">Ulangan (Sinxron)</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => notifyPlannedFeature('1C integratsiya')}
                >
                  Sozlash
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center font-bold text-emerald-600">DX</div>
                  <div>
                    <div className="font-medium text-slate-900">Didox (EHF)</div>
                    <div className="text-xs text-emerald-600 font-medium">Ulangan</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => notifyPlannedFeature('Didox integratsiya')}
                >
                  Sozlash
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">EA</div>
                  <div>
                    <div className="font-medium text-slate-900">E-Aktiv</div>
                    <div className="text-xs text-slate-500">Ulanmagan</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => notifyPlannedFeature('E-Aktiv ulanish')}
                >
                  Ulash
                </Button>
              </div>
            </div>
          </Card>
          
          <Card>
            <h3 className="font-bold text-slate-900 mb-4">Ish haqi (Payroll)</h3>
            <div className="text-sm text-slate-600 mb-4">
              Joriy oy uchun xodimlar, agentlar va dastavkachilar ish haqini hisoblash.
            </div>
            <Button
              variant="primary"
              className="w-full"
              type="button"
              onClick={() => notifyPlannedFeature('Payroll hisoblash')}
            >
              Hisoblashni boshlash
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
