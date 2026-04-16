import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FileText, Search } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Client } from '../../types';
import { getClientBalance } from '../../services/firestore';

export default function AccountantAktSverka() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'clients'),
      where('status', '==', 'active'),
      orderBy('name'),
      limit(200)
    );
    getDocs(q).then(snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setBalance(null);
      return;
    }
    getClientBalance(selectedClientId).then(setBalance);
  }, [selectedClientId]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerName && c.ownerName.toLowerCase().includes(search.toLowerCase()))
  );
  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Akt sverka (o‘zaro hisob-kitob)</h1>
      <Card>
        <p className="text-slate-600 mb-4">Har bir mijoz (do‘kon) bilan o‘zaro hisob-kitob solishtirma dalolatnomasi. Mijozni tanlang va uning qoldig‘ini ko‘ring.</p>
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Mijoz nomi bo‘yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Mijoz</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">STIR</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.stir}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={selectedClientId === c.id ? 'primary' : 'outline'}
                        onClick={() => setSelectedClientId(c.id === selectedClientId ? null : c.id)}
                      >
                        Tanlash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {selectedClientId && balance !== null && (
        <Card className="flex items-center gap-4">
          <FileText className="h-10 w-10 text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500">Tanlangan mijoz qoldig‘i (buyurtmalar − to‘lovlar)</p>
            <p className={`text-2xl font-bold ${balance > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
