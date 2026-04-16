import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Package,
  AlertCircle,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getSalesChartData, getTopAgents, getTopProducts, getSalesByRegion, getRecentOrders, getPendingApprovalsCount } from '../../services/dashboard';
import type { DashboardStats, Order } from '../../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number; quantity: number }[]>([]);
  const [salesByRegion, setSalesByRegion] = useState<{ region: string; sales: number; orders: number; clients: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState({ clients: 0, orders: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, chart, agents, products, regionSales, orders, pending] = await Promise.all([
        getDashboardStats(),
        getSalesChartData(30),
        getTopAgents(5),
        getTopProducts(10),
        getSalesByRegion(),
        getRecentOrders(10),
        getPendingApprovalsCount(),
      ]);
      
      setStats(statsData);
      setChartData(chart.labels.map((label, i) => ({
        name: label,
        total: chart.datasets[0].data[i],
      })));
      setTopAgents(agents);
      setTopProducts(products);
      setSalesByRegion(regionSales);
      setRecentOrders(orders);
      setPendingApprovals(pending);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'warning', label: 'Kutilmoqda' },
      confirmed: { variant: 'info', label: 'Tasdiqlangan' },
      picking: { variant: 'info', label: 'Yig\'ilmoqda' },
      packed: { variant: 'info', label: 'Qadoqlangan' },
      in_transit: { variant: 'info', label: 'Yo\'lda' },
      delivered: { variant: 'success', label: 'Yetkazildi' },
      cancelled: { variant: 'error', label: 'Bekor qilindi' },
    };
    const config = variants[status] || { variant: 'neutral', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const statCards = stats ? [
    { 
      label: 'Kunlik tushum', 
      value: formatCurrency(stats.dailyRevenue), 
      change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`, 
      trend: stats.revenueChange >= 0 ? 'up' : 'down', 
      icon: CreditCard 
    },
    { 
      label: 'Yangi buyurtmalar', 
      value: `${stats.dailyOrders} ta`, 
      change: '+5.2%', 
      trend: 'up', 
      icon: ShoppingBag 
    },
    { 
      label: 'Faol do\'konlar', 
      value: `${stats.activeClients} ta`, 
      change: `+${stats.newClientsThisMonth}`, 
      trend: 'up', 
      icon: Users 
    },
    { 
      label: 'Qarzdorlik', 
      value: formatCurrency(stats.totalReceivables), 
      change: `${formatCurrency(stats.overdueReceivables)} muddatidan o'tgan`,
      trend: 'down', 
      icon: Package 
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500/80"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(pendingApprovals.clients > 0 || pendingApprovals.orders > 0 || (stats?.lowStockProducts || 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingApprovals.clients > 0 && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-200">
                  {pendingApprovals.clients} ta yangi mijoz tasdiqlashni kutyapti
                </p>
              </div>
            </div>
          )}
          {pendingApprovals.orders > 0 && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-medium text-emerald-200">
                  {pendingApprovals.orders} ta yangi buyurtma kutyapti
                </p>
              </div>
            </div>
          )}
          {(stats?.lowStockProducts || 0) > 0 && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-red-200" />
              <div>
                <p className="text-sm font-medium text-red-100">
                  {stats?.lowStockProducts} ta mahsulot qoldigi kam
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-200 border border-emerald-500/30">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-2">{stat.value}</div>
            <div className={`flex items-center text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {stat.trend === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {stat.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Savdo dinamikasi (30 kun)</h3>
            <Badge variant="success">+{((stats?.revenueChange || 0)).toFixed(1)}%</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b1220', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 12px 40px rgba(15,23,42,0.35)' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Savdo']}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Top Agents */}
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Eng faol agentlar (TOP-5)</h3>
          <div className="space-y-4">
            {topAgents.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Ma\'lumot yo\'q</p>
            ) : (
              topAgents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/70 border border-emerald-200/60 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-200 font-bold border border-emerald-500/30">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{agent.name}</div>
                      <div className="text-sm text-slate-400">{agent.orders} ta buyurtma</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{formatCurrency(agent.sales)}</div>
                    <div className="text-xs text-slate-400">{agent.region}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* TOP-10 mahsulotlar va Mijozlar tahlili */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Eng ko‘p sotilayotgan mahsulotlar (TOP-10)</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Ma’lumot yo‘q</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/70 border border-emerald-200/60 rounded-2xl backdrop-blur-xl">
                  <div className="font-medium text-slate-800">{i + 1}. {p.name}</div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{formatCurrency(p.sales)}</div>
                    <div className="text-xs text-slate-400">{p.quantity} dona</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Mijozlar tahlili (hudud bo‘yicha savdo)</h3>
          <div className="space-y-3">
            {salesByRegion.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Ma’lumot yo‘q</p>
            ) : (
              salesByRegion.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/70 border border-emerald-200/60 rounded-2xl backdrop-blur-xl">
                  <div>
                    <div className="font-medium text-slate-800">{r.region}</div>
                    <div className="text-xs text-slate-400">{r.orders} buyurtma, {r.clients} mijoz</div>
                  </div>
                  <div className="font-bold text-emerald-300">{formatCurrency(r.sales)}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">So'nggi buyurtmalar</h3>
          <Link to="/admin/orders" className="text-sm text-emerald-300 hover:text-emerald-200 font-medium">
            Barchasini ko&apos;rish
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-100">
            <thead className="bg-white/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Buyurtma #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Mijoz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Summa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Buyurtmalar yo\'q
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-300">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {order.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
