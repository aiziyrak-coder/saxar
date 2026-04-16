import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, MapPin, Target, TrendingUp } from 'lucide-react';

export default function AdminAgents() {
  const agents = [
    { id: 'AGT-001', name: 'Azizbek Rahimov', region: 'Toshkent sh.', plan: 150000000, fact: 120000000, shops: 45, active: 40 },
    { id: 'AGT-002', name: 'Sardor Qodirov', region: 'Samarqand', plan: 100000000, fact: 95000000, shops: 32, active: 30 },
    { id: 'AGT-003', name: 'Umidjon Aliyev', region: 'Farg\'ona', plan: 120000000, fact: 88000000, shops: 38, active: 25 },
    { id: 'AGT-004', name: 'Javohir Tursunov', region: 'Buxoro', plan: 80000000, fact: 76000000, shops: 28, active: 26 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Agentlar (Distributorlar)</h1>
        <Button variant="primary" className="gap-2">
          <Users className="h-4 w-4" /> Yangi agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const percent = Math.round((agent.fact / agent.plan) * 100);
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
                    <span className="text-slate-500 flex items-center gap-1"><Target className="h-3 w-3"/> Plan</span>
                    <span className="font-medium text-slate-900">{(agent.plan / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 flex items-center gap-1"><TrendingUp className="h-3 w-3"/> Fakt</span>
                    <span className="font-medium text-slate-900">{(agent.fact / 1000000).toFixed(0)}M</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
                    <div className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : percent >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                  </div>
                  <div className="text-right text-xs font-bold mt-1 text-slate-700">{percent}%</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Do'konlar</div>
                    <div className="font-bold text-slate-900">{agent.shops} ta</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Faol (Buyurtma)</div>
                    <div className="font-bold text-emerald-600">{agent.active} ta</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Tarix</Button>
                <Button variant="secondary" size="sm" className="flex-1">Xarita</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
