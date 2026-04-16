import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  Building2, MapPin, Phone, ShieldCheck, LogOut, Mail, User, 
  Package, ShoppingCart, Star, CreditCard, Clock, ChevronRight,
  Edit3, Camera, FileText, Settings, MapPinned, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

// Demo statistics - in real app, fetch from API
const demoStats = {
  totalOrders: 24,
  totalSpent: 12500000,
  activeOrders: 3,
  favoriteProducts: 5,
  creditLimit: 50000000,
  currentDebt: 8500000,
  loyaltyPoints: 1250,
  memberSince: '2024-01-15',
};

// Demo recent orders
const demoRecentOrders = [
  { id: 'ORD-001', date: '2026-03-15', status: 'delivered', total: 1250000, items: 8 },
  { id: 'ORD-002', date: '2026-03-10', status: 'in_transit', total: 2100000, items: 12 },
  { id: 'ORD-003', date: '2026-03-05', status: 'delivered', total: 890000, items: 5 },
];

// Demo addresses
const demoAddresses = [
  { id: 1, name: 'Asosiy manzil', address: 'Toshkent sh., Yunusobod t., 19-kvartal, 42-uy', isDefault: true },
  { id: 2, name: 'Ombor', address: 'Toshkent sh., Yashnobod t., 12-kvartal, 8-uy', isDefault: false },
];

export default function B2BProfile() {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-emerald-100 text-emerald-700',
      in_transit: 'bg-blue-100 text-blue-700',
      pending: 'bg-amber-100 text-amber-700',
    };
    const labels: Record<string, string> = {
      delivered: 'Yetkazildi',
      in_transit: 'Yo\'lda',
      pending: 'Kutilmoqda',
    };
    return <Badge className={styles[status] || 'bg-slate-100'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header with Cover Image */}
      <div className="relative">
        <div className="h-32 md:h-48 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl"></div>
        <div className="absolute -bottom-12 left-6 md:left-10 flex items-end">
          <div className="relative">
            <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
              <Building2 className="h-12 w-12 md:h-16 md:w-16 text-emerald-600" />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="ml-4 mb-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{userData?.name || 'Kompaniya Nomi'}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {userData?.status === 'active' ? 'Tasdiqlangan hamkor' : 'Tasdiq kutilmoqda'}
            </p>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
            <Edit3 className="h-4 w-4 mr-2" /> Tahrirlash
          </Button>
        </div>
      </div>

      {/* Spacer for avatar overlap */}
      <div className="h-12 md:h-16"></div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-2">
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Umumiy ko\'rinish', icon: User },
                { id: 'orders', label: 'Buyurtmalarim', icon: Package },
                { id: 'addresses', label: 'Manzillarim', icon: MapPinned },
                { id: 'finance', label: 'Moliyaviy hisobot', icon: Wallet },
                { id: 'settings', label: 'Sozlamalar', icon: Settings },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === item.id 
                      ? 'bg-emerald-50 text-emerald-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              ))}
            </nav>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-90">Loyalty ballari</span>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold">{demoStats.loyaltyPoints}</div>
            <div className="text-xs opacity-75 mt-1">ball</div>
          </Card>

          <Button variant="danger" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Tizimdan chiqish
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{demoStats.totalOrders}</div>
                  <div className="text-xs text-slate-500">Jami buyurtmalar</div>
                </Card>
                <Card className="p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{demoStats.activeOrders}</div>
                  <div className="text-xs text-slate-500">Faol buyurtmalar</div>
                </Card>
                <Card className="p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{formatPrice(demoStats.totalSpent).replace(' so\'m', '')}</div>
                  <div className="text-xs text-slate-500">Jami xaridlar</div>
                </Card>
                <Card className="p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{demoStats.favoriteProducts}</div>
                  <div className="text-xs text-slate-500">Sevimli mahsulotlar</div>
                </Card>
              </div>

              {/* Credit Info */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-600" /> Kredit ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Kredit limiti</div>
                    <div className="text-xl font-bold text-slate-900">{formatPrice(demoStats.creditLimit)}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Joriy qarz</div>
                    <div className="text-xl font-bold text-rose-600">{formatPrice(demoStats.currentDebt)}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">Mavjud limit</div>
                    <div className="text-xl font-bold text-emerald-600">{formatPrice(demoStats.creditLimit - demoStats.currentDebt)}</div>
                  </div>
                </div>
              </Card>

              {/* Recent Orders */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" /> So'ngi buyurtmalar
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
                    Barchasini ko'rish
                  </Button>
                </div>
                <div className="space-y-3">
                  {demoRecentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{order.id}</div>
                          <div className="text-sm text-slate-500">{order.items} ta mahsulot • {new Date(order.date).toLocaleDateString('uz-UZ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatPrice(order.total)}</div>
                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Aloqa ma'lumotlari</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Telefon</div>
                      <div className="font-medium text-slate-900">{userData?.phone || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Email</div>
                      <div className="font-medium text-slate-900">{userData?.email || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl md:col-span-2">
                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Manzil</div>
                      <div className="font-medium text-slate-900">{userData?.address || 'Manzil kiritilmagan'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'orders' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Barcha buyurtmalar</h3>
              <div className="text-center py-12 text-slate-500">
                <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p>To'liq buyurtmalar tarixi tez orada mavjud bo'ladi</p>
              </div>
            </Card>
          )}

          {activeTab === 'addresses' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Mening manzillarim</h3>
                <Button variant="primary" size="sm">Yangi manzil</Button>
              </div>
              <div className="space-y-3">
                {demoAddresses.map((addr) => (
                  <div key={addr.id} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <MapPinned className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {addr.name}
                            {addr.isDefault && (
                              <Badge className="bg-emerald-100 text-emerald-700">Asosiy</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">{addr.address}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Tahrirlash</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Moliyaviy hisobot</h3>
              <div className="text-center py-12 text-slate-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p>Akt sverka va moliyaviy hisobot tez orada mavjud bo'ladi</p>
              </div>
            </Card>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Kompaniya ma'lumotlari</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Do'kon nomi</label>
                      <Input defaultValue={userData?.name || "Makro Supermarket"} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Yuridik nom</label>
                      <Input defaultValue="Makro Retail MChJ" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">STIR (INN)</label>
                      <Input defaultValue={userData?.stir || ''} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">MFO</label>
                      <Input defaultValue="00444" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Bank hisob raqami</label>
                    <Input defaultValue="20208000900123456789" />
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                    <Button variant="outline" className="w-full sm:w-auto">Bekor qilish</Button>
                    <Button variant="primary" className="w-full sm:w-auto">Saqlash</Button>
                  </div>
                </form>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Xavfsizlik</h3>
                <form className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Joriy parol</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Yangi parol</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Parolni tasdiqlang</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row justify-end">
                    <Button variant="primary" className="w-full sm:w-auto">Parolni yangilash</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
