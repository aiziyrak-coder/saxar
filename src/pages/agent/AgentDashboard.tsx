import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Target, TrendingUp, ShoppingCart, CheckCircle2, Navigation, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import type { Client, Order, KPIRecord } from '../../types';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [checkedInShops, setCheckedInShops] = useState<string[]>([]);
  
  // Get agent's clients
  const { data: clients } = useFirestore<Client>('clients');
  const agentClients = clients.filter(c => c.agentId === user?.uid);
  
  // Get agent's orders for this month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const { data: orders } = useFirestore<Order>('orders');
  const agentOrders = orders.filter(o => o.agentId === user?.uid && o.orderDate >= firstDayOfMonth);
  
  // Get KPI
  const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const { data: kpiRecords } = useFirestore<KPIRecord>('kpi_records');
  const currentKPI = kpiRecords.find(k => k.agentId === user?.uid && k.period === currentPeriod);
  
  // Calculate stats
  const monthlySales = agentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const targetAmount = currentKPI?.targetAmount || 150000000;
  const completionPercent = targetAmount > 0 ? Math.round((monthlySales / targetAmount) * 100) : 0;
  const expectedBonus = currentKPI?.bonusAmount || Math.round(monthlySales * 0.02);
  
  // Get today's visits
  const todayStr = today.toISOString().split('T')[0];
  const todayVisits = agentClients.filter(c => c.lastOrderDate === todayStr).length;

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  const handleGPSCheckIn = (clientId: string) => {
    if (!currentLocation) {
      alert("GPS ma'lumotlari mavjud emas. Iltimos, joylashish xizmatini yoqing.");
      return;
    }
    
    // Record check-in
    setCheckedInShops(prev => [...prev, clientId]);
    
    // In real app, send to server
    console.log('Check-in:', {
      clientId,
      location: {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      },
      timestamp: new Date().toISOString(),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-slate-900 border-none shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-900">Oylik KPI ({currentPeriod})</h2>
          <Target className="h-5 w-5 text-emerald-600" />
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1 text-slate-700">
              <span>Bajarildi:</span>
              <span className="font-bold text-slate-900">{completionPercent}%</span>
            </div>
            <div className="w-full bg-emerald-50 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.35)]" 
                style={{ width: `${Math.min(completionPercent, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200/60">
            <div>
              <div className="text-xs text-emerald-200">Fakt savdo</div>
              <div className="font-bold text-lg">{formatCurrency(monthlySales)}</div>
            </div>
            <div>
              <div className="text-xs text-emerald-200">Kutilayotgan bonus</div>
              <div className="font-bold text-lg text-emerald-300">{formatCurrency(expectedBonus)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Users className="h-5 w-5 text-emerald-300 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{agentClients.length}</div>
          <div className="text-xs text-slate-400">Mijozlar</div>
        </Card>
        <Card className="p-3 text-center">
          <ShoppingCart className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{agentOrders.length}</div>
          <div className="text-xs text-slate-400">Buyurtmalar</div>
        </Card>
        <Card className="p-3 text-center">
          <CheckCircle2 className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{todayVisits}</div>
          <div className="text-xs text-slate-400">Bugun</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="primary" 
          className="h-24 flex-col gap-2 shadow-md"
          onClick={() => navigate('/agent/shops')}
        >
          <ShoppingCart className="h-6 w-6" />
          <span>Yangi buyurtma</span>
        </Button>
        <Button 
          variant="secondary" 
          className="h-24 flex-col gap-2 shadow-sm border-white/10"
          onClick={() => currentLocation && handleGPSCheckIn('manual')}
        >
          <Navigation className="h-6 w-6 text-emerald-300" />
          <span className="text-slate-900">GPS Check-in</span>
        </Button>
      </div>

      {/* Today's Route */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900">Mening mijozlarim</h3>
          <button 
            className="text-sm text-emerald-700 font-medium"
            onClick={() => navigate('/agent/shops')}
          >
            Barchasi
          </button>
        </div>
        
        <div className="space-y-3">
          {agentClients.slice(0, 5).map((client) => {
            const isCheckedIn = checkedInShops.includes(client.id);
            
            return (
            <Card key={client.id} className="p-4 flex items-center justify-between shadow-sm border-emerald-200/60">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isCheckedIn
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                      : 'bg-white/70 text-slate-700 border border-emerald-200/60'
                  }`}>
                    {isCheckedIn ? <CheckCircle2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </div>
                  <div>
                  <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                  <div className="text-xs text-slate-400">{client.address}</div>
                    {client.currentBalance > 0 && (
                    <div className="text-xs font-medium text-red-200 mt-1">
                        Qarz: {formatCurrency(client.currentBalance)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCheckedIn && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGPSCheckIn(client.id)}
                    >
                      <Navigation className="h-4 w-4 text-emerald-300" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/agent/shops')}
                  >
                    <TrendingUp className="h-5 w-5 text-slate-400" />
                  </Button>
                </div>
              </Card>
            );
          })}
          
          {agentClients.length === 0 && (
            <div className="text-center py-8 bg-white/60 border border-emerald-200/60 rounded-3xl">
              <p className="text-slate-400">Sizga biriktirilgan mijozlar yo'q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
