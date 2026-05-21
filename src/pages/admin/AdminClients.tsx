import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Search, Plus, MapPin, Phone, Building2, CheckCircle2, AlertCircle, Loader2, XCircle, Download } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore';
import { tryGetFirebaseDb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { djangoUsersApi } from '../../services/platformApi';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { logger } from '../../services/logger';
import { clientService, userService, getClientBalance } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import { useDebouncedValue } from '../../platform/useDebouncedValue';
import { downloadCsv } from '../../platform/csv';
import { addNotification } from '../../platform/notifications';
import type { Client, User } from '../../types';

const REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Farg\u2019ona',
  'Andijon', 'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Jizzax',
  'Sirdaryo', 'Xorazm', 'Navoiy', 'Qoraqalpog\u2019iston',
];

export default function AdminClients() {
  const { userData } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    stir: '',
    companyName: '',
    address: '',
    region: '',
    paymentType: 'cash' as 'cash' | 'transfer' | 'mixed',
    creditLimit: 0,
    creditDays: 14,
    discountPercent: 0,
  });

  const fetchClients = () => {
    const db = tryGetFirebaseDb();
    if (!db) {
      setClients([]);
      setBalances({});
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'clients'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    getDocs(q).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
      setClients(list);
      return list;
    }).then(async list => {
      const bal: Record<string, number> = {};
      await Promise.all(list.slice(0, 50).map(async c => {
        bal[c.id] = await getClientBalance(c.id);
      }));
      setBalances(bal);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const syncDjangoClientActive = async (firebaseUid: string, isActive: boolean) => {
    const db = tryGetFirebaseDb();
    if (!db || !hasDjangoJwt()) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', firebaseUid));
      const rawId = userSnap.data()?.djangoUserId;
      const djangoId =
        typeof rawId === 'number' ? rawId : rawId != null ? Number(rawId) : NaN;
      if (Number.isFinite(djangoId) && djangoId > 0) {
        await djangoUsersApi.patch(djangoId, { is_active: isActive });
      }
    } catch (e) {
      logger.warn('Django mijoz holati yangilanmadi', {
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleApprove = async (client: Client) => {
    const db = tryGetFirebaseDb();
    if (!db) return;
    setActionLoading(client.id);
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        registrationStatus: 'approved',
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'users', client.id), {
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
      await syncDjangoClientActive(client.id, true);
      if (userData) {
        await logAudit(AuditActions.CLIENT_APPROVE, EntityTypes.CLIENT, client.id, userData.uid, userData.name || '', userData.role, { registrationStatus: 'pending' }, { registrationStatus: 'approved' });
      }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, registrationStatus: 'approved' as const, status: 'active' as const } : c));
      addNotification('Tasdiqlandi', `${client.name} — Django va Firebase faollashtirildi.`);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (client: Client) => {
    const db = tryGetFirebaseDb();
    if (!db) return;
    setActionLoading(client.id);
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        registrationStatus: 'rejected',
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'users', client.id), {
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      });
      await syncDjangoClientActive(client.id, false);
      if (userData) {
        await logAudit(AuditActions.CLIENT_REJECT, EntityTypes.CLIENT, client.id, userData.uid, userData.name || '', userData.role, { registrationStatus: 'pending' }, { registrationStatus: 'rejected' });
      }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, registrationStatus: 'rejected' as const, status: 'inactive' as const } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateClient = async () => {
    if (!clientForm.name.trim() || !clientForm.phone.trim()) return;
    setSaving(true);
    try {
      const phone = clientForm.phone.trim();
      const digits = phone.replace(/\D/g, '');
      const email = `${digits || 'client'}@saxar.local`;
      const password = (clientForm.stir.trim() || `Saxar${digits.slice(-6) || '123456'}`).slice(0, 32);

      let djangoId: number | undefined;
      if (hasDjangoJwt()) {
        const dj = await djangoUsersApi.create({
          email,
          phone,
          role: 'b2b',
          password,
          first_name: clientForm.name.trim(),
          is_active: true,
        });
        djangoId = dj.id;
      }

      const fsId = djangoId ? `b2b_${djangoId}` : `client_${Date.now()}`;
      const now = new Date().toISOString();

      if (djangoId) {
        await userService.create(
          {
            uid: fsId,
            djangoUserId: djangoId,
            email,
            phone,
            role: 'b2b',
            name: clientForm.name.trim(),
            companyName: clientForm.companyName.trim() || clientForm.name.trim(),
            status: 'active',
            createdAt: now,
            updatedAt: now,
          } as Omit<User, 'id'>,
          fsId
        );
      }

      await clientService.create(
        {
          name: clientForm.name.trim(),
          ownerName: clientForm.ownerName.trim(),
          phone,
          stir: clientForm.stir.trim(),
          companyName: clientForm.companyName.trim(),
          address: clientForm.address.trim(),
          region: clientForm.region,
          paymentType: clientForm.paymentType,
          creditLimit: clientForm.creditLimit,
          creditDays: clientForm.creditDays,
          discountPercent: clientForm.discountPercent,
          status: 'active',
          registrationStatus: 'approved',
          currentBalance: 0,
          totalPurchases: 0,
        } as Omit<Client, 'id'>,
        fsId
      );
      setShowCreateModal(false);
      setClientForm({
        name: '', ownerName: '', phone: '', stir: '', companyName: '',
        address: '', region: '', paymentType: 'cash', creditLimit: 0,
        creditDays: 14, discountPercent: 0,
      });
      addNotification('Mijoz yaratildi', `${clientForm.name} muvaffaqiyatli saqlandi.`);
      fetchClients();
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Mijoz yaratishda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.stir?.includes(debouncedSearch) ||
    c.ownerName?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportClientsCsv = () => {
    const rows = filteredClients.map(c => ({
      nomi: c.name,
      egasi: c.ownerName,
      telefon: c.phone,
      stir: c.stir,
      hudud: c.region,
      manzil: c.address,
      status: c.status,
      qarzdorlik: balances[c.id] ?? 0,
    }));
    downloadCsv(`mijozlar-${Date.now()}.csv`, rows);
    addNotification('CSV eksport', `${rows.length} ta mijoz yuklandi.`);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);
  const statusLabel = (c: Client) => {
    if (c.registrationStatus === 'pending') return { label: 'Tasdiq kutilmoqda', className: 'bg-amber-500/20 text-amber-200 border border-amber-500/30' };
    if (c.status === 'active') return { label: 'Faol', className: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' };
    if (c.status === 'inactive') return { label: 'Nofaol', className: 'bg-emerald-500/15 text-slate-900 border border-emerald-200/60' };
    return { label: c.status || '\u2014', className: 'bg-emerald-500/15 text-slate-900 border border-emerald-200/60' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Mijozlar (B2B)</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" type="button" onClick={exportClientsCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" /> Yangi mijoz
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-emerald-200/60 flex items-center gap-4 bg-white/60">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Mijoz nomi yoki STIR (INN)..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/70 border-b border-emerald-200/60">
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Mijoz / STIR</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Aloqa</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Hudud</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Qarzdorlik</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClients.map((client) => {
                const st = statusLabel(client);
                return (
                  <tr key={client.id} className="hover:bg-emerald-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {client.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">STIR: {client.stir}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700">
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-slate-400" /> {client.address || '\u2014'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-200">
                      {client.region || '\u2014'}
                    </td>
                    <td className={`py-4 px-6 text-sm font-bold ${(balances[client.id] ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(balances[client.id] ?? 0)} UZS
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}>
                        {client.registrationStatus === 'pending' && <AlertCircle className="h-3 w-3" />}
                        {client.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {client.registrationStatus === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200"
                            onClick={() => handleReject(client)}
                            disabled={actionLoading === client.id}
                          >
                            {actionLoading === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            Rad etish
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(client)}
                            disabled={actionLoading === client.id}
                          >
                            {actionLoading === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Tasdiqlash
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Mijoz topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi mijoz" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Do&apos;kon / korxona nomi *"
              value={clientForm.name}
              onChange={(e) => setClientForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Egasi (FIO)"
              value={clientForm.ownerName}
              onChange={(e) => setClientForm(f => ({ ...f, ownerName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Telefon raqami *"
              value={clientForm.phone}
              onChange={(e) => setClientForm(f => ({ ...f, phone: e.target.value }))}
            />
            <Input
              placeholder="STIR (INN)"
              value={clientForm.stir}
              onChange={(e) => setClientForm(f => ({ ...f, stir: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Kompaniya nomi"
            value={clientForm.companyName}
            onChange={(e) => setClientForm(f => ({ ...f, companyName: e.target.value }))}
          />
          <Input
            placeholder="Manzil"
            value={clientForm.address}
            onChange={(e) => setClientForm(f => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hudud</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={clientForm.region}
                onChange={(e) => setClientForm(f => ({ ...f, region: e.target.value }))}
              >
                <option value="">Tanlang</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To&apos;lov turi</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={clientForm.paymentType}
                onChange={(e) => setClientForm(f => ({ ...f, paymentType: e.target.value as 'cash' | 'transfer' | 'mixed' }))}
              >
                <option value="cash">Naqd</option>
                <option value="transfer">Pul o&apos;tkazma</option>
                <option value="mixed">Aralash</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kredit limit (UZS)</label>
              <Input
                type="number"
                min="0"
                value={clientForm.creditLimit}
                onChange={(e) => setClientForm(f => ({ ...f, creditLimit: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kredit kun</label>
              <Input
                type="number"
                min="0"
                value={clientForm.creditDays}
                onChange={(e) => setClientForm(f => ({ ...f, creditDays: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chegirma %</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={clientForm.discountPercent}
                onChange={(e) => setClientForm(f => ({ ...f, discountPercent: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleCreateClient} disabled={saving || !clientForm.name.trim() || !clientForm.phone.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
