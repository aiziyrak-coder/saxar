import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';
import { notifyPlannedFeature } from '../../platform/notifications';

export default function DriverInventory() {
  const inventory: { id: string; name: string; quantity: number; unit: string; status: 'ok' | 'warning' }[] = [];

  const docRef = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `#N-${y}-${m}-${day}`;
  }, []);

  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" /> Nakladnoy (Yuk xati)
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8 text-xs"
          type="button"
          onClick={() => notifyPlannedFeature('Nakladnoy PDF')}
        >
          <Download className="h-4 w-4" /> PDF
        </Button>
      </div>

      <Card className="bg-emerald-50 text-slate-900 border border-emerald-200/60 shadow-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-emerald-700 text-sm">Hujjat raqami</div>
          <div className="font-bold">{docRef}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-emerald-700 text-sm">Jami yuk</div>
          <div className="font-bold text-xl">
            {totalUnits} <span className="text-sm font-normal text-emerald-700">birlik</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {inventory.length === 0 ? (
          <p className="text-sm text-slate-500 px-1">Namuna mahsulot qatorlari olib tashlangan. Yuk ro‘yxoni keyinchalik marshrut bilan ulanadi.</p>
        ) : (
          inventory.map((item) => (
            <Card key={item.id} className="p-4 shadow-sm border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
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
                  <AlertTriangle className="h-4 w-4" /> Diqqat: Qadoq shikastlangan bo&apos;lishi mumkin
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          className="w-full h-12 gap-2 shadow-md"
          type="button"
          onClick={() => notifyPlannedFeature('Yukni qabul qilish', 'Omborchi tasdiqlashi rejada.')}
        >
          <CheckCircle2 className="h-5 w-5" /> Yukni qabul qildim
        </Button>
      </div>
    </div>
  );
}
