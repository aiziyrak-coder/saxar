import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Truck, LogOut, Settings, Phone, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DriverProfile() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const driver = {
    name: userData?.name || 'Haydovchi Ismi',
    id: 'DR-2051',
    phone: '+998 90 987 65 43',
    email: userData?.email || 'driver@fooderp.uz',
    vehicle: 'Isuzu NPR 75',
    plateNumber: '01 A 123 BB',
    completedDeliveries: 1240,
    rating: 4.8
  };

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
      <Card className="text-center pt-8 pb-6 border-none shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-emerald-100"></div>
        <div className="relative z-10">
          <div className="h-24 w-24 bg-white/75 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-200/60 shadow-lg">
            <User className="h-12 w-12 text-slate-900" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{driver.name}</h2>
          <p className="text-sm text-slate-400 mb-4">Dastavkachi ID: {driver.id}</p>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4" /> Ishonchli xodim
          </div>
        </div>
      </Card>

      {/* Vehicle Info */}
      <Card className="shadow-sm border-emerald-200/60">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-emerald-300" /> Transport vositasi
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white/60 rounded-2xl border border-emerald-200/60">
            <div>
              <div className="text-xs text-slate-400 mb-1">Rusumi</div>
              <div className="font-bold text-slate-900">{driver.vehicle}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Davlat raqami</div>
              <div className="font-bold text-slate-900 px-2 py-1 bg-white/70 border border-emerald-200/60 rounded shadow-sm">
                {driver.plateNumber}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-xs text-slate-400">Yetkazib berishlar</div>
              <div className="font-bold text-lg text-slate-900">{driver.completedDeliveries} marta</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Reyting</div>
              <div className="font-bold text-lg text-emerald-600 flex items-center gap-1">
                {driver.rating} <span className="text-amber-400">★</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="shadow-sm border-emerald-200/60">
        <h3 className="font-bold text-slate-900 mb-4">Shaxsiy ma'lumotlar</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Phone className="h-4 w-4 text-emerald-700" />
            </div>
            <span className="font-medium text-slate-900">{driver.phone}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start gap-3 h-12">
          <Settings className="h-5 w-5 text-slate-400" /> Sozlamalar
        </Button>
        <Button variant="danger" className="w-full justify-start gap-3 h-12" onClick={handleLogout}>
          <LogOut className="h-5 w-5" /> Tizimdan chiqish
        </Button>
      </div>
    </div>
  );
}
