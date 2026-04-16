import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Target, LogOut, Settings, Phone, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AgentProfile() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const agent = {
    name: userData?.name || 'Agent Ismi',
    id: 'AG-1042',
    phone: '+998 90 123 45 67',
    email: userData?.email || 'agent@fooderp.uz',
    territory: 'Yunusobod, Toshkent',
    kpi: {
      plan: 150000000,
      fact: 120000000,
      bonus: 2400000,
    }
  };

  const percent = Math.round((agent.kpi.fact / agent.kpi.plan) * 100);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="text-center pt-8 pb-6 border-none shadow-md bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-emerald-600"></div>
        <div className="relative z-10">
          <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
            <User className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{agent.name}</h2>
          <p className="text-sm text-slate-500 mb-4">Agent ID: {agent.id}</p>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Award className="h-4 w-4" /> Katta Agent
          </div>
        </div>
      </Card>

      {/* KPI Summary */}
      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" /> Oylik Natijalar
        </h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1 text-slate-600">
              <span>Bajarildi:</span>
              <span className="font-bold text-emerald-600">{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div 
                className="bg-emerald-600 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.35)]" 
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Fakt savdo</div>
              <div className="font-bold text-lg text-slate-900">{(agent.kpi.fact / 1000000).toFixed(1)}M</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Bonus</div>
              <div className="font-bold text-lg text-emerald-600">{(agent.kpi.bonus / 1000000).toFixed(1)}M</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Shaxsiy ma'lumotlar</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <span className="font-medium text-slate-900">{agent.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-slate-500" />
            </div>
            <span className="font-medium text-slate-900">{agent.territory}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start gap-3 h-12 text-slate-700 bg-white border-slate-200 shadow-sm">
          <Settings className="h-5 w-5 text-slate-400" /> Sozlamalar
        </Button>
        <Button variant="danger" className="w-full justify-start gap-3 h-12 bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-sm" onClick={handleLogout}>
          <LogOut className="h-5 w-5" /> Tizimdan chiqish
        </Button>
      </div>
    </div>
  );
}
