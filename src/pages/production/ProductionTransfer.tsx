import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, ArrowRight } from 'lucide-react';

export default function ProductionTransfer() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Tayyor mahsulotni omborga o‘tkazish</h1>
      <Card>
        <p className="text-slate-600 mb-4">
          Ishlab chiqarish partiyasini yakunlagach, tayyor mahsulotni WMS ga kirim qilish. Xomashyoni tayyor mahsulotga aylantirish jarayoni shu yerda kirituvchi xodim tomonidan bajariladi.
        </p>
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-amber-50 rounded-full">
              <Package className="h-8 w-8 text-amber-600" />
            </div>
            <ArrowRight className="h-8 w-8 text-slate-400" />
            <div className="p-4 bg-emerald-50 rounded-full">
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <p className="mb-4">Ishlab chiqarish → Ombor (WMS kirim)</p>
          <Button variant="primary" className="gap-2">
            Kirim qilish
          </Button>
        </div>
      </Card>
    </div>
  );
}
