import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MapPin, Search, Navigation, CheckCircle2, Store, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { getClientBalance, agentCheckInService } from '../../services/firestore';
import { getRouteMapUrl } from '../../services/integrations';
import type { Client, AgentCheckIn } from '../../types';

export default function AgentShops() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [checkedInToday, setCheckedInToday] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const { data: clients, loading } = useFirestore<Client>('clients');
  const { data: checkIns } = useFirestore<AgentCheckIn>('agent_check_ins');
  const agentClients = useMemo(
    () => clients.filter((c) => c.agentId === user?.uid),
    [clients, user?.uid]
  );

  const agentClientIdsKey = useMemo(() => agentClients.map((c) => c.id).join(','), [agentClients]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const c of agentClients.slice(0, 30)) {
        if (cancelled) return;
        const bal = await getClientBalance(c.id);
        if (!cancelled) setBalances((prev) => ({ ...prev, [c.id]: bal }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentClientIdsKey, agentClients]);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const agentCheckIns = checkIns.filter(
      ch => ch.agentId === user?.uid && new Date(ch.checkInAt) >= todayStart
    );
    setCheckedInToday(new Set(agentCheckIns.map(ch => ch.clientId)));
  }, [checkIns, user?.uid]);

  const handleCheckIn = async (client: Client) => {
    if (!user?.uid || !userData?.name) return;
    if (!navigator.geolocation) {
      alert('GPS qo‘llab-quvvatlanmaydi');
      return;
    }
    setCheckingIn(client.id);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await agentCheckInService.create({
            agentId: user.uid,
            agentName: userData.name,
            clientId: client.id,
            clientName: client.name,
            location: { lat: position.coords.latitude, lng: position.coords.longitude },
            checkInAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          } as Omit<import('../../types').AgentCheckIn, 'id'>);
          setCheckedInToday(prev => new Set([...prev, client.id]));
        } catch (e) {
          console.error(e);
        } finally {
          setCheckingIn(null);
        }
      },
      () => {
        alert('Joylashuvni olishda xatolik');
        setCheckingIn(null);
      }
    );
  };

  const handleOpenMap = () => {
    const withLocation = agentClients.filter(c => c.location?.lat);
    if (withLocation.length === 0) return;
    const waypoints = withLocation.map(c => ({ lat: c.location!.lat, lng: c.location!.lng }));
    window.open(getRouteMapUrl(waypoints, 'yandex'), '_blank');
  };

  const filteredShops = agentClients.filter(shop =>
    (shop.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white/60 pt-2 pb-4 z-10 backdrop-blur-xl border-b border-emerald-200/60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Do'kon qidirish..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="font-bold text-slate-900">Mening hududim ({agentClients.length} do‘kon)</h2>
        <button
          type="button"
          className="text-sm text-emerald-300 font-medium flex items-center gap-1"
          onClick={handleOpenMap}
        >
          <Navigation className="h-4 w-4" /> Xaritada ko‘rish
        </button>
      </div>

      <div className="space-y-3">
        {filteredShops.length === 0 ? (
          <Card className="py-12 text-center">
            <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Sizga biriktirilgan do‘konlar yo‘q yoki qidiruv bo‘yicha natija topilmadi.</p>
          </Card>
        ) : (
          filteredShops.map((shop) => {
            const debt = balances[shop.id] ?? 0;
            const visited = checkedInToday.has(shop.id);
            return (
              <Card key={shop.id} className="p-4 shadow-sm border-emerald-200/60">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      visited
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    }`}>
                      {visited ? <CheckCircle2 className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{shop.name}</h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {shop.address || shop.region || '—'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-emerald-200/60">
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Qarzdorlik</div>
                    <div className={`text-sm font-bold ${debt > 0 ? 'text-red-200' : 'text-emerald-300'}`}>
                      {debt > 0 ? `${formatCurrency(debt)} UZS` : 'Qarz yo‘q'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs h-8 px-3 gap-1"
                      onClick={() => navigate(`/agent/order?clientId=${shop.id}&clientName=${encodeURIComponent(shop.name || '')}`)}
                    >
                      <ShoppingCart className="h-4 w-4" /> Buyurtma
                    </Button>
                    {!visited && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3"
                        onClick={() => handleCheckIn(shop)}
                        disabled={checkingIn === shop.id}
                      >
                        {checkingIn === shop.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check-in'}
                      </Button>
                    )}
                    {visited && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Tashrif
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
