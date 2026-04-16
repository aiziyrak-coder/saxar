import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Play, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function AdminProduction() {
  const [search, setSearch] = useState('');

  const productionOrders = [
    { id: 'PROD-001', product: 'Premium Un 50kg', quantity: 100, unit: 'qop', status: 'Jarayonda', progress: 65, startDate: '15 Mar 2026', endDate: '16 Mar 2026' },
    { id: 'PROD-002', product: 'O\'simlik yog\'i 5L', quantity: 500, unit: 'dona', status: 'Kutilmoqda', progress: 0, startDate: '16 Mar 2026', endDate: '17 Mar 2026' },
    { id: 'PROD-003', product: 'Makaron 10kg', quantity: 200, unit: 'qop', status: 'Yakunlandi', progress: 100, startDate: '14 Mar 2026', endDate: '15 Mar 2026' },
    { id: 'PROD-004', product: 'Shakar 50kg (Qadoqlash)', quantity: 50, unit: 'qop', status: 'Muammo', progress: 30, startDate: '15 Mar 2026', endDate: '15 Mar 2026' },
  ];

  const rawMaterials = [
    { name: 'Bug\'doy (1-nav)', stock: 15000, unit: 'kg', status: 'Yaxshi' },
    { name: 'Kungaboqar urug\'i', stock: 8000, unit: 'kg', status: 'Yaxshi' },
    { name: 'Qadoq qoplari (50kg)', stock: 120, unit: 'dona', status: 'Kam qoldiq' },
    { name: 'Yelim idish (5L)', stock: 5000, unit: 'dona', status: 'Yaxshi' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Ishlab chiqarish</h1>
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" /> Yangi buyurtma
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buyurtma ID yoki mahsulot nomi..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">ID / Mahsulot</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Miqdor</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Holat</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Muddat</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productionOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{order.product}</div>
                      <div className="text-xs text-slate-500">{order.id}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'Yakunlandi' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Jarayonda' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'Muammo' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status === 'Yakunlandi' && <CheckCircle2 className="h-3 w-3" />}
                          {order.status === 'Jarayonda' && <Play className="h-3 w-3" />}
                          {order.status === 'Muammo' && <AlertTriangle className="h-3 w-3" />}
                          {order.status === 'Kutilmoqda' && <Clock className="h-3 w-3" />}
                          {order.status}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full ${order.status === 'Muammo' ? 'bg-red-500' : 'bg-emerald-600'}`} 
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      <div>Bosh: {order.startDate}</div>
                      <div>Tug: {order.endDate}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm">Batafsil</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4">Xomashyo qoldig'i</h3>
            <div className="space-y-4">
              {rawMaterials.map((material, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-slate-900">{material.name}</div>
                    <div className={`text-xs font-medium mt-0.5 ${material.status === 'Yaxshi' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {material.status}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">
                    {material.stock.toLocaleString()} <span className="text-slate-500 text-sm font-normal">{material.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Barcha xomashyolar</Button>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100">
            <h3 className="font-bold text-slate-900 mb-2">Retseptura (BOM)</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Mahsulotlar tarkibi va ishlab chiqarish normalarini boshqarish.
            </p>
            <Button variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Retseptlarni ko'rish
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
