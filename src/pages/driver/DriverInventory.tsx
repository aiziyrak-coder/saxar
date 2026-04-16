import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';

export default function DriverInventory() {
  const inventory = [
    { id: 'PRD-101', name: 'Premium Un 50kg', quantity: 120, unit: 'qop', status: 'ok' },
    { id: 'PRD-102', name: 'Makaron 10kg', quantity: 45, unit: 'qop', status: 'ok' },
    { id: 'PRD-103', name: 'Shakar 50kg', quantity: 80, unit: 'qop', status: 'warning' },
    { id: 'PRD-104', name: 'O\'simlik yog\'i 5L', quantity: 200, unit: 'dona', status: 'ok' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" /> Nakladnoy (Yuk xati)
        </h2>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
          <Download className="h-4 w-4" /> PDF
        </Button>
      </div>

      <Card className="bg-emerald-50 text-slate-900 border border-emerald-200/60 shadow-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-emerald-700 text-sm">Hujjat raqami</div>
          <div className="font-bold">#N-2026-03-15</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-emerald-700 text-sm">Jami yuk</div>
          <div className="font-bold text-xl">445 <span className="text-sm font-normal text-emerald-700">birlik</span></div>
        </div>
      </Card>

      <div className="space-y-3">
        {inventory.map((item) => (
          <Card key={item.id} className="p-4 shadow-sm border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {item.status === 'ok' ? <Package className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">KOD: {item.id}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-lg">{item.quantity}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.unit}</div>
              </div>
            </div>
            {item.status === 'warning' && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600 font-medium">
                <AlertTriangle className="h-4 w-4" /> Diqqat: Qadoq shikastlangan bo'lishi mumkin
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="pt-4">
        <Button variant="primary" className="w-full h-12 gap-2 shadow-md">
          <CheckCircle2 className="h-5 w-5" /> Yukni qabul qildim
        </Button>
      </div>
    </div>
  );
}
