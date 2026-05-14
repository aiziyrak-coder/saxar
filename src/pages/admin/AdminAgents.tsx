import { useMemo } from 'react';
import { where } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, MapPin, Target, TrendingUp } from 'lucide-react';
import { notifyPlannedFeature } from '../../platform/notifications';
import { useFirestore } from '../../hooks/useFirestore';
import type { Client, Order, User } from '../../types';

export default function AdminAgents() {
  const { data: agentUsers, loading: agentsLoading } = useFirestore<User>('users', [where('role', '==', 'agent')]);
  const { data: allClients } = useFirestore<Client>('clients');
  const { data: allOrders } = useFirestore<Order>('orders');

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const agents = useMemo(() => {
    return agentUsers.map((u) => {
      const uid = u.uid;
      const shops = allClients.filter((c) => c.agentId === uid);
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
        region: u.region ?? '—',
        plan: 0,
        fact,
        shops: shops.length,
        active: activeOrders,
      };
    });
  }, [agentUsers, allClients, allOrders, monthStart]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Agentlar (Distributorlar)</h1>
        <Button
          variant="primary"
          className="gap-2"
          type="button"
          onClick={() => notifyPlannedFeature('Yangi agent')}
        >
          <Users className="h-4 w-4" /> Yangi agent
        </Button>
      </div>

      {agentsLoading && <p className="text-slate-500 text-sm">Yuklanmoqda...</p>}
      {!agentsLoading && agents.length === 0 && (
        <p className="text-slate-500">Hozircha agent foydalanuvchilari yo‘q (Firestore `users`, role=agent).</p>
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
                      {agent.plan > 0 ? `${(agent.plan / 1_000_000).toFixed(0)}M` : '—'}
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
                    <p className="text-xs text-slate-500 mt-2">Reja kiritilmagan — foiz ko‘rsatilmaydi.</p>
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
                  onClick={() => notifyPlannedFeature('Agent savdo tarixi', agent.name)}
                >
                  Tarix
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  type="button"
                  onClick={() => notifyPlannedFeature('Agent xaritasi', agent.name)}
                >
                  Xarita
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
