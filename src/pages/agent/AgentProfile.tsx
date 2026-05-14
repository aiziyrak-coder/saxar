import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Target, LogOut, Settings, Phone, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notifyPlannedFeature } from '../../platform/notifications';
import { useFirestore } from '../../hooks/useFirestore';
import type { Order } from '../../types';

export default function AgentProfile() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const agentUid = userData?.uid ?? '';
  const { data: orders } = useFirestore<Order>('orders');

  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monthFact = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.agentId === agentUid &&
            o.status === 'delivered' &&
            o.orderDate &&
            new Date(o.orderDate) >= monthStart
        )
        .reduce((s, o) => s + o.totalAmount, 0),
    [orders, agentUid, monthStart]
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const name = userData?.name || 'Agent';
  const displayId = userData?.id || userData?.uid || '—';
  const phone = userData?.phone || '—';
  const territory = userData?.region || 'Hudud biriktirilmagan';

  return (
    <div className="space-y-6">
      <Card className="text-center pt-8 pb-6 border-none shadow-md bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-emerald-600"></div>
        <div className="relative z-10">
          <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
            <User className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-500 mb-4">Profil: {displayId}</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Award className="h-4 w-4" /> Agent
          </div>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" /> Joriy oy (yakunlangan buyurtmalar)
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Fakt (oy)</div>
              <div className="font-bold text-lg text-slate-900">
                {(monthFact / 1_000_000).toFixed(2)}M UZS
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">Reja va bonuslar keyinchalik alohida modulda hisoblanadi.</p>
        </div>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4">Shaxsiy ma&apos;lumotlar</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <span className="font-medium text-slate-900">{phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-slate-500" />
            </div>
            <span className="font-medium text-slate-900">{territory}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 text-slate-700 bg-white border-slate-200 shadow-sm"
          type="button"
          onClick={() => notifyPlannedFeature('Agent sozlamalari')}
        >
          <Settings className="h-5 w-5 text-slate-400" /> Sozlamalar
        </Button>
        <Button variant="danger" className="w-full justify-start gap-3 h-12 bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-sm" onClick={handleLogout}>
          <LogOut className="h-5 w-5" /> Tizimdan chiqish
        </Button>
      </div>
    </div>
  );
}
