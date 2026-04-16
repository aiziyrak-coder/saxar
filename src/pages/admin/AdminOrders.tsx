import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Filter, ShoppingCart, CheckCircle2, Clock, AlertCircle, Truck } from 'lucide-react';

export default function AdminOrders() {
  const [search, setSearch] = useState('');

  const orders = [
    { id: 'ORD-2026-001', client: 'Makro Supermarket', date: '15 Mar 2026 10:30', amount: 12500000, status: 'Yangi', items: 15, agent: 'Azizbek R.' },
    { id: 'ORD-2026-002', client: 'Havas Do\'kon', date: '15 Mar 2026 09:15', amount: 4500000, status: 'Tasdiqlangan', items: 5, agent: 'Sardor Q.' },
    { id: 'ORD-2026-003', client: 'Korzinka', date: '14 Mar 2026 16:45', amount: 8200000, status: 'Yetkazilmoqda', items: 12, agent: 'B2B Portal' },
    { id: 'ORD-2026-004', client: 'Oila Market', date: '14 Mar 2026 14:20', amount: 3400000, status: 'Yakunlangan', items: 8, agent: 'Umidjon A.' },
    { id: 'ORD-2026-005', client: 'Safia', date: '14 Mar 2026 11:10', amount: 15000000, status: 'Bekor qilingan', items: 20, agent: 'B2B Portal' },
  ];

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(search.toLowerCase()) || 
    order.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Buyurtmalar</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtr
          </Button>
          <Button variant="primary" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> Yangi buyurtma
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-emerald-200/60 flex items-center gap-4 bg-white/60">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buyurtma ID yoki mijoz nomi..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/70 border-b border-emerald-200/60">
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Buyurtma ID / Sana</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Mijoz / Agent</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Mahsulotlar</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Summa</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order, i) => (
                <tr key={i} className="hover:bg-emerald-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{order.id}</div>
                    <div className="text-xs text-slate-400 mt-1">{order.date}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900">{order.client}</div>
                    <div className="text-xs text-slate-400 mt-1">Agent: {order.agent}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700">
                    {order.items} xil
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">
                    {order.amount.toLocaleString()} UZS
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Yangi' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' :
                      order.status === 'Tasdiqlangan' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' :
                      order.status === 'Yetkazilmoqda' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' :
                      order.status === 'Yakunlangan' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' :
                      'bg-red-500/20 text-red-200 border border-red-500/30'
                    }`}>
                      {order.status === 'Yangi' && <Clock className="h-3 w-3" />}
                      {order.status === 'Tasdiqlangan' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'Yetkazilmoqda' && <Truck className="h-3 w-3" />}
                      {order.status === 'Yakunlangan' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'Bekor qilingan' && <AlertCircle className="h-3 w-3" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button variant="ghost" size="sm">Ko'rish</Button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Buyurtma topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
