import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Users, MapPin, Target, TrendingUp, Loader2 } from 'lucide-react';
import { addNotification } from '../../platform/notifications';
import { openLiveMap } from '../../utils/featureActions';
import { djangoUsersApi } from '../../services/platformApi';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { fetchAllOrdersMerged } from '../../utils/mergedData';
import { djangoRowToUser } from '../../utils/djangoUsers';
import type { Order, User } from '../../types';

const REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Farg\u2019ona',
  'Andijon', 'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Jizzax',
  'Sirdaryo', 'Xorazm', 'Navoiy', 'Qoraqalpog\u2019iston',
];

export default function AdminAgents() {
  const [agentUsers, setAgentUsers] = useState<User[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const refreshAgents = useCallback(async () => {
    if (!hasDjangoJwt()) {
      setAgentUsers([]);
      setAgentsLoading(false);
      return;
    }
    setAgentsLoading(true);
    try {
      const rows = await djangoUsersApi.list('agent');
      setAgentUsers(rows.map(djangoRowToUser));
    } catch (e) {
      setAgentUsers([]);
      addNotification('Xatolik', 'Agentlar ro‘yxati yuklanmadi.');
      console.error(e);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAgents();
    void fetchAllOrdersMerged().then(setAllOrders);
  }, [refreshAgents]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    region: '',
  });

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const agents = useMemo(() => {
    return agentUsers.map((u) => {
      const uid = u.uid;
      const shops = 0;
      const activeOrders = allOrders.filter(
        (o) => o.agentId === uid && !['delivered', 'cancelled', 'returned'].includes(o.status)
      ).length;
      const fact = allOrders
        .filter(
          (o) =>
            o.agentId === uid &&
            o.status === 'delivered' &&
            o.orderDate &&
            new Date(o.orderDate) >= monthStart
        )
        .reduce((s, o) => s + o.totalAmount, 0);
      return {
        id: u.id ?? uid,
        name: u.name,
        region: u.region ?? '\u2014',
        plan: 0,
        fact,
        shops,
        active: activeOrders,
      };
    });
  }, [agentUsers, allOrders, monthStart]);

  const handleCreateAgent = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (!hasDjangoJwt()) {
      addNotification('Xato', 'Django API bilan kiring.');
      return;
    }
    setSaving(true);
    try {
      const phone = form.phone.trim();
      const email = form.email.trim() || `${phone.replace(/\D/g, '')}@saxar.local`;
      await djangoUsersApi.create({
        email,
        phone,
        role: 'agent',
        password: `Saxar${phone.replace(/\D/g, '').slice(-6) || '123456'}`,
        first_name: form.name.trim(),
        region: form.region.trim() || undefined,
        is_active: true,
      });
      setShowCreateModal(false);
      setForm({ name: '', email: '', phone: '', region: '' });
      addNotification('Agent yaratildi', `${form.name} Django da saqlandi.`);
      await refreshAgents();
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Agent yaratishda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Agentlar (Distributorlar)</h1>
        <Button
          variant="primary"
          className="gap-2"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
          <Users className="h-4 w-4" /> Yangi agent
        </Button>
      </div>

      {agentsLoading && <p className="text-slate-500 text-sm">Yuklanmoqda...</p>}
      {!agentsLoading && agents.length === 0 && (
        <p className="text-slate-500">Hozircha agent foydalanuvchilari yo&apos;q (Django API, role=agent).</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const percent = agent.plan > 0 ? Math.round((agent.fact / agent.plan) * 100) : null;
          return (
            <Card key={agent.id} className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{agent.name}</h3>
                  <div className="flex items-center text-sm text-slate-500 gap-1">
                    <MapPin className="h-3 w-3" /> {agent.region}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Reja
                    </span>
                    <span className="font-medium text-slate-900">
                      {agent.plan > 0 ? `${(agent.plan / 1_000_000).toFixed(0)}M` : '\u2014'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Fakt (oy)
                    </span>
                    <span className="font-medium text-slate-900">
                      {(agent.fact / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  {percent !== null ? (
                    <>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
                        <div
                          className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <div className="text-right text-xs font-bold mt-1 text-slate-700">{percent}%</div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2">Reja kiritilmagan \u2014 foiz ko&apos;rsatilmaydi.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Do&apos;konlar</div>
                    <div className="font-bold text-slate-900">{agent.shops} ta</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Faol buyurtma</div>
                    <div className="font-bold text-emerald-600">{agent.active} ta</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  type="button"
                  onClick={() => {
                    window.location.href = `/admin/orders?agent=${encodeURIComponent(agent.id)}`;
                  }}
                >
                  Tarix
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  type="button"
                  onClick={() => openLiveMap()}
                >
                  Xarita
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi agent" size="md">
        <div className="space-y-4">
          <Input
            placeholder="To&apos;liq ism *"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Telefon *"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hudud</label>
            <select
              className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
              value={form.region}
              onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))}
            >
              <option value="">Tanlang</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleCreateAgent} disabled={saving || !form.name.trim() || !form.phone.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
