import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { expenseService } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import type { Expense, ExpenseCategory } from '../../types';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'salary', label: 'Ish haqi' },
  { value: 'rent', label: 'Ijara' },
  { value: 'utilities', label: 'Kommunal' },
  { value: 'fuel', label: 'Yoqilg\'i' },
  { value: 'maintenance', label: 'Ta\'mirlash' },
  { value: 'tax', label: 'Soliq' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office', label: 'Ofis' },
  { value: 'other', label: 'Boshqa' },
];

export default function AccountantExpenses() {
  const { userData } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: 'other' as ExpenseCategory, amount: '', description: '', date: new Date().toISOString().slice(0, 10) });

  const loadExpenses = () => {
    const q = query(
      collection(getFirebaseDb(), 'expenses'),
      orderBy('date', 'desc'),
      limit(50)
    );
    getDocs(q).then(snap => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    const amount = parseInt(form.amount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setSubmitting(true);
    try {
      const id = await expenseService.create({
        category: form.category,
        amount,
        description: form.description || form.category,
        date: form.date,
        createdBy: userData.uid,
        createdByName: userData.name || 'Buxgalter',
        createdAt: new Date().toISOString(),
      } as Omit<Expense, 'id'>);
      await logAudit(AuditActions.EXPENSE_CREATE, EntityTypes.EXPENSE, id, userData.uid, userData.name || '', userData.role, undefined, { category: form.category, amount });
      setShowModal(false);
      setForm({ category: 'other', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
      loadExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n);
  const categoryLabels: Record<string, string> = {
    salary: 'Ish haqi',
    rent: 'Ijara',
    utilities: 'Kommunal',
    fuel: 'Yoqilg‘i',
    maintenance: 'Ta’mirlash',
    tax: 'Soliq',
    marketing: 'Marketing',
    office: 'Ofis',
    other: 'Boshqa',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Xarajatlar</h1>
        <Button variant="primary" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Xarajat qo&apos;shish
        </Button>
      </div>
      <Card>
        <p className="text-slate-600 mb-4">Korxonaning operatsion xarajatlari (benzin, ijara, soliq, ofis va h.k.).</p>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategoriya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Izoh</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Xarajatlar yo‘q
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{new Date(e.date).toLocaleDateString('uz-UZ')}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{categoryLabels[e.category] || e.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{e.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Xarajat qo'shish" size="sm">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya</label>
            <select
              className="block w-full rounded-lg border-slate-300 py-2.5 px-3 border focus:border-emerald-500"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summa (UZS)</label>
            <Input type="number" required min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sana</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Izoh</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Qisqacha izoh" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>{submitting ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
