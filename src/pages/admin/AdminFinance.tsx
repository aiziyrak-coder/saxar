import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Wallet, TrendingUp, TrendingDown, FileText, Download, Building2, Loader2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { downloadCsv } from '../../platform/csv';
import { extractVatFromInclusive } from '../../platform/vat';
import { addNotification } from '../../platform/notifications';
import { configureIntegrations, goPayroll } from '../../utils/featureActions';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { paymentApi } from '../../services/api';
import { resolveDjangoClientId } from '../../utils/djangoClientId';
import { platformApi, type PlatformSettingsDto } from '../../services/platformApi';
import { useAuth } from '../../context/AuthContext';
import type { Payment, Expense, Client, ExpenseCategory } from '../../types';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'salary', label: 'Ish haqi' },
  { value: 'rent', label: 'Ijara' },
  { value: 'utilities', label: 'Kommunal' },
  { value: 'fuel', label: 'Yoqilg\u2019i' },
  { value: 'maintenance', label: 'Ta\u2019mirlash' },
  { value: 'tax', label: 'Soliq' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office', label: 'Ofis' },
  { value: 'other', label: 'Boshqa' },
];

export default function AdminFinance() {
  const { userData } = useAuth();
  const [platform, setPlatform] = useState<PlatformSettingsDto | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'aktsverka' | 'expenses'>('transactions');
  const [showModal, setShowModal] = useState<'payment' | 'expense' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasDjangoJwt()) return;
    platformApi.getSettings().then(setPlatform).catch(() => setPlatform(null));
  }, []);

  const { data: payments, create: createPaymentFs } = useFirestore<Payment>('payments');
  const { data: expenses, create: createExpense } = useFirestore<Expense>('expenses');
  const { data: clients } = useFirestore<Client>('clients');

  const [paymentForm, setPaymentForm] = useState({
    direction: 'in' as 'in' | 'out',
    type: 'cash' as Payment['type'],
    amount: 0,
    clientId: '',
    clientName: '',
    description: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'other' as ExpenseCategory,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

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

  const debtors = clients.filter(c => c.currentBalance > 0);

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

  const handleSavePayment = async () => {
    if (paymentForm.amount <= 0) return;
    setSaving(true);
    try {
      const description =
        paymentForm.description.trim() ||
        `${paymentForm.direction === 'in' ? 'Kirim' : 'Chiqim'} - ${paymentForm.type}`;

      if (hasDjangoJwt() && paymentForm.clientId) {
        const djangoClientId = await resolveDjangoClientId(paymentForm.clientId);
        if (djangoClientId) {
          await paymentApi.create({
            client: djangoClientId,
            amount: paymentForm.amount,
            type: paymentForm.type,
            description,
          });
        }
      }

      await createPaymentFs({
        type: paymentForm.type,
        direction: paymentForm.direction,
        amount: paymentForm.amount,
        currency: 'UZS',
        clientId: paymentForm.clientId || undefined,
        clientName: paymentForm.clientName.trim(),
        description,
        createdBy: userData?.uid || '',
        createdByName: userData?.name || '',
      } as Omit<Payment, 'id'>);
      setShowModal(null);
      setPaymentForm({ direction: 'in', type: 'cash', amount: 0, clientId: '', clientName: '', description: '' });
      addNotification('To\u2019lov saqlandi', `${paymentForm.amount.toLocaleString()} UZS muvaffaqiyatli kiritildi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'To\u2019lov saqlashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpense = async () => {
    if (expenseForm.amount <= 0 || !expenseForm.description.trim()) return;
    setSaving(true);
    try {
      await createExpense({
        category: expenseForm.category,
        amount: expenseForm.amount,
        description: expenseForm.description.trim(),
        date: expenseForm.date,
        createdBy: userData?.uid || '',
        createdByName: userData?.name || '',
      } as Omit<Expense, 'id'>);
      setShowModal(null);
      setExpenseForm({ category: 'other', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      addNotification('Xarajat saqlandi', `${expenseForm.amount.toLocaleString()} UZS muvaffaqiyatli kiritildi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Xarajat saqlashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
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
            variant="outline"
            className="gap-2"
            type="button"
            onClick={() => setShowModal('expense')}
          >
            <TrendingDown className="h-4 w-4" /> Xarajat
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => setShowModal('payment')}
          >
            <FileText className="h-4 w-4" /> Yangi to&apos;lov
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
            <div className="text-slate-500 font-medium">Oylik tushum (to&apos;lovlar)</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(monthlyRevenue)} UZS</div>
          <div className="text-sm font-medium text-slate-500">Joriy oy: kirim yo&apos;nalishi</div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-500 font-medium">Oylik chiqim</div>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{formatCurrency(monthlyOutflow)} UZS</div>
          <div className="text-sm font-medium text-slate-500">Chiqim to&apos;lovlari + xarajatlar</div>
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
                <h3 className="text-lg font-bold text-slate-900">So&apos;nggi tranzaksiyalar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/70 border-b border-emerald-200/60">
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Sana / ID</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Manba / Maqsad</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">To&apos;lov turi</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allTransactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-emerald-50 transition-colors">
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
                    {allTransactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Tranzaksiyalar yo&apos;q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'aktsverka' ? (
            <>
              <div className="p-6 border-b border-emerald-200/60 flex justify-between items-center bg-white/60">
                <h3 className="text-lg font-bold text-slate-900">Mijozlar bilan solishtirma dalolatnoma</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/70 border-b border-emerald-200/60">
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Mijoz (Do&apos;kon)</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">Qarzdorlik</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider">So&apos;nggi to&apos;lov</th>
                      <th className="py-3 px-6 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {debtors.map((client) => (
                      <tr key={client.id} className="hover:bg-emerald-50 transition-colors">
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
                <h3 className="text-lg font-bold text-slate-900">Operatsion xarajatlar</h3>
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
                          Xarajat yozuvlari yo&apos;q
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
                    <div className="text-xs text-slate-500">
                      {platform?.onec_enabled ? 'Ulangan' : 'Ulanmagan'}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={configureIntegrations}>
                  Sozlash
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center font-bold text-emerald-600">DX</div>
                  <div>
                    <div className="font-medium text-slate-900">Didox (EHF)</div>
                    <div className="text-xs text-slate-500">
                      {platform?.didox_enabled ? 'Ulangan' : 'Ulanmagan'}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={configureIntegrations}>
                  Sozlash
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">EA</div>
                  <div>
                    <div className="font-medium text-slate-900">E-Aktiv</div>
                    <div className="text-xs text-slate-500">
                      {platform?.eaktiv_enabled ? 'Ulangan' : 'Ulanmagan'}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={configureIntegrations}>
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
              onClick={goPayroll}
            >
              Hisoblashni boshlash
            </Button>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showModal === 'payment'} onClose={() => !saving && setShowModal(null)} title="Yangi to&apos;lov" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yo&apos;nalish</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={paymentForm.direction}
                onChange={(e) => setPaymentForm(f => ({ ...f, direction: e.target.value as 'in' | 'out' }))}
              >
                <option value="in">Kirim (mijozdan)</option>
                <option value="out">Chiqim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To&apos;lov turi</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={paymentForm.type}
                onChange={(e) => setPaymentForm(f => ({ ...f, type: e.target.value as Payment['type'] }))}
              >
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="transfer">Pul o&apos;tkazma</option>
                <option value="click">Click</option>
                <option value="payme">Payme</option>
                <option value="uzum">Uzum</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summa (UZS) *</label>
            <Input
              type="number"
              min="0"
              value={paymentForm.amount || ''}
              onChange={(e) => setPaymentForm(f => ({ ...f, amount: Number(e.target.value) || 0 }))}
            />
            {paymentForm.amount > 0 && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                QQS 12%: {extractVatFromInclusive(paymentForm.amount, 12).vat.toLocaleString()} UZS | 
                Asosiy: {extractVatFromInclusive(paymentForm.amount, 12).net.toLocaleString()} UZS
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mijoz (Django API uchun)</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2"
              value={paymentForm.clientId}
              onChange={(e) => {
                const c = clients.find((x) => x.id === e.target.value);
                setPaymentForm((f) => ({
                  ...f,
                  clientId: e.target.value,
                  clientName: c?.name || f.clientName,
                }));
              }}
            >
              <option value="">Tanlang</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Mijoz nomi (ixtiyoriy)"
            value={paymentForm.clientName}
            onChange={(e) => setPaymentForm(f => ({ ...f, clientName: e.target.value }))}
          />
          <Input
            placeholder="Tavsif / Izoh"
            value={paymentForm.description}
            onChange={(e) => setPaymentForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(null)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleSavePayment} disabled={saving || paymentForm.amount <= 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal isOpen={showModal === 'expense'} onClose={() => !saving && setShowModal(null)} title="Yangi xarajat" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summa (UZS) *</label>
            <Input
              type="number"
              min="0"
              value={expenseForm.amount || ''}
              onChange={(e) => setExpenseForm(f => ({ ...f, amount: Number(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tavsif *</label>
            <Input
              placeholder="Xarajat tavsifi"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(null)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveExpense} disabled={saving || expenseForm.amount <= 0 || !expenseForm.description.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
