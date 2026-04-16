import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Users, Plus, Loader2 } from 'lucide-react';
import { where } from 'firebase/firestore';
import { payrollService, userService } from '../../services/firestore';
import type { PayrollItem as PayrollItemType, User } from '../../types';

const now = new Date();
const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export default function AccountantPayroll() {
  const [period, setPeriod] = useState(currentPeriod);
  const [items, setItems] = useState<PayrollItemType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    baseSalary: 0,
    bonusAmount: 0,
    commissionAmount: 0,
    deductionAmount: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [payrollList, usersList] = await Promise.all([
          payrollService.query([where('period', '==', period)]),
          userService.getAll('createdAt', 'asc'),
        ]);
        payrollList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!cancelled) {
          setItems(payrollList);
          setUsers(usersList.filter(u => u.role && u.role !== 'b2b'));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const handleAdd = async () => {
    const user = users.find(u => u.id === form.userId);
    if (!user || !form.userId) return;
    const total = form.baseSalary + form.bonusAmount + form.commissionAmount - form.deductionAmount;
    setSaving(true);
    try {
      await payrollService.create({
        userId: user.id,
        userName: user.phone || user.name || '—',
        role: user.role!,
        period,
        baseSalary: form.baseSalary,
        bonusAmount: form.bonusAmount,
        commissionAmount: form.commissionAmount,
        deductionAmount: form.deductionAmount,
        totalAmount: total,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Omit<PayrollItemType, 'id'>);
      const list = await payrollService.query([where('period', '==', period)]);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
      setShowModal(false);
      setForm({ userId: '', baseSalary: 0, bonusAmount: 0, commissionAmount: 0, deductionAmount: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Ish haqi (Payroll)</h1>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            className="border border-slate-300 rounded-lg px-3 py-2"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
          <Button variant="primary" className="gap-2" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Qo‘shish
          </Button>
        </div>
      </div>
      <Card>
        <p className="text-slate-600 mb-4">
          Xodimlarning fiks oyliklari, agentlarning bonuslari, dastavkachilarning bosib o‘tgan masofasiga qarab to‘lovlari.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Users className="h-12 w-12 mb-4 text-slate-300" />
            <p>Ushbu oy uchun ish haqi yozuvlari yo‘q. «Qo‘shish» orqali qo‘shing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Xodim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Oylik</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Bonus</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Komissiya</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Uchastka</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Jami</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.userName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.role}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMoney(row.baseSalary)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMoney(row.bonusAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMoney(row.commissionAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMoney(row.deductionAmount)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right text-slate-900">{formatMoney(row.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : row.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {row.status === 'draft' ? 'Qoralama' : row.status === 'approved' ? 'Tasdiqlangan' : 'To‘langan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => !saving && setShowModal(false)} title="Ish haqi qo‘shish">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Xodim</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={form.userId}
              onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
            >
              <option value="">Tanlang</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.phone || u.name || '—'} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Oylik (asosiy)</label>
            <Input type="number" min={0} value={form.baseSalary || ''} onChange={e => setForm(f => ({ ...f, baseSalary: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bonus</label>
            <Input type="number" min={0} value={form.bonusAmount || ''} onChange={e => setForm(f => ({ ...f, bonusAmount: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Komissiya</label>
            <Input type="number" min={0} value={form.commissionAmount || ''} onChange={e => setForm(f => ({ ...f, commissionAmount: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Uchastka (ajratma)</label>
            <Input type="number" min={0} value={form.deductionAmount || ''} onChange={e => setForm(f => ({ ...f, deductionAmount: Number(e.target.value) || 0 }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Bekor</Button>
            <Button variant="primary" onClick={handleAdd} disabled={saving || !form.userId} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
