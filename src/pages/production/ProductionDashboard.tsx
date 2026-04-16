import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Factory, Plus, ArrowRight, CheckCircle2, Package, Settings, BarChart3 } from 'lucide-react';

export default function ProductionDashboard() {
  const activeBatches = [
    { id: 'PRD-B-101', product: 'Premium Un 50kg', status: 'Jarayonda', progress: 65, expected: 500, unit: 'qop', startTime: '08:00' },
    { id: 'PRD-B-102', product: 'Makaron 10kg', status: 'Kutish', progress: 0, expected: 200, unit: 'qop', startTime: '14:00' },
  ];

  const rawMaterials = [
    { name: 'Bug\'doy (1-nav)', stock: 12500, unit: 'kg', status: 'Yaxshi' },
    { name: 'Qadoqlash qoplari', stock: 850, unit: 'dona', status: 'Kam qoldi' },
    { name: 'Tuz', stock: 450, unit: 'kg', status: 'Yaxshi' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Ishlab chiqarish (Production)</h1>
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" /> Yangi partiya
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Batches */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Factory className="h-5 w-5 text-emerald-600" /> Faol jarayonlar
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {activeBatches.map((batch) => (
                <div key={batch.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-500">{batch.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          batch.status === 'Jarayonda' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{batch.product}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500">Kutilayotgan hajm</div>
                      <div className="font-bold text-slate-900">{batch.expected} {batch.unit}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Jarayon: {batch.progress}%</span>
                      <span className="text-slate-500">Boshlandi: {batch.startTime}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${batch.progress > 0 ? 'bg-emerald-600' : 'bg-slate-300'}`} 
                        style={{ width: `${batch.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">Tahrirlash</Button>
                    <Button variant="primary" size="sm" className="flex-1 gap-2" disabled={batch.progress === 100}>
                      Yakunlash <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors border-dashed border-2">
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900">Tayyor mahsulotni omborga o'tkazish</h4>
              <p className="text-sm text-slate-500 mt-1">WMS ga kirim qilish</p>
            </Card>
            <Card className="flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors border-dashed border-2">
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Settings className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900">Retseptura (Texkarta) sozlamalari</h4>
              <p className="text-sm text-slate-500 mt-1">Xomashyo sarfini belgilash</p>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" /> Xomashyo qoldig'i
            </h3>
            <div className="space-y-4">
              {rawMaterials.map((material, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{material.name}</div>
                    <div className={`text-xs font-medium mt-1 ${
                      material.status === 'Yaxshi' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {material.status}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">
                    {material.stock.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{material.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 gap-2 text-sm">
              Barchasini ko'rish <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>

          <Card className="bg-white/70 text-slate-900 border border-emerald-200/60">
            <h3 className="font-bold mb-2">Kunlik hisobot</h3>
            <p className="text-sm text-slate-400 mb-4">Bugungi ishlab chiqarilgan mahsulotlar va sarflangan xomashyo hisoboti.</p>
            <Button variant="primary" className="w-full bg-emerald-500 hover:bg-emerald-600 border-none">
              Hisobotni yuklash
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
