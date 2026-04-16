import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, MapPin, Phone, Building2, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getClientBalance } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import type { Client } from '../../types';

export default function AdminClients() {
  const { userData } = useAuth();
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const handleApprove = async (client: Client) => {
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
      if (userData) {
        await logAudit(AuditActions.CLIENT_APPROVE, EntityTypes.CLIENT, client.id, userData.uid, userData.name || '', userData.role, { registrationStatus: 'pending' }, { registrationStatus: 'approved' });
      }
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, registrationStatus: 'approved' as const, status: 'active' as const } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (client: Client) => {
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

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.stir?.includes(search) ||
    c.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);
  const statusLabel = (c: Client) => {
    if (c.registrationStatus === 'pending') return { label: 'Tasdiq kutilmoqda', className: 'bg-amber-500/20 text-amber-200 border border-amber-500/30' };
    if (c.status === 'active') return { label: 'Faol', className: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' };
    if (c.status === 'inactive') return { label: 'Nofaol', className: 'bg-emerald-500/15 text-slate-900 border border-emerald-200/60' };
    return { label: c.status || '—', className: 'bg-emerald-500/15 text-slate-900 border border-emerald-200/60' };
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
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" /> Yangi mijoz
        </Button>
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
                        <MapPin className="h-3 w-3 text-slate-400" /> {client.address || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-200">
                      {client.region || '—'}
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
                      {client.registrationStatus !== 'pending' && (
                        <Button variant="ghost" size="sm">Batafsil</Button>
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
    </div>
  );
}
