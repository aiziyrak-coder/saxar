import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck } from 'lucide-react';
import { getExpiringInventory, getLowStockProducts } from '../../services/firestore';

export default function WarehouseDashboard() {
  const [expiringCount, setExpiringCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    Promise.all([
      getExpiringInventory(7).then(items => items.length),
      getLowStockProducts().then(items => items.length),
    ]).then(([exp, low]) => {
      setExpiringCount(exp);
      setLowStockCount(low);
    });
  }, []);

  const links = [
    { to: '/warehouse/wms', icon: Package, label: 'Ombor (WMS)', desc: 'Qoldiq, FIFO, yaroqlilik' },
    { to: '/warehouse/receiving', icon: ArrowDownToLine, label: 'Kirim', desc: 'Ishlab chiqarishdan qabul' },
    { to: '/warehouse/shipment', icon: ArrowUpFromLine, label: 'Chiqim', desc: 'Logistikaga yuklab berish' },
    { to: '/warehouse/inventory-count', icon: ClipboardCheck, label: 'Inventarizatsiya', desc: 'Real vaqtda tekshirish' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ombor dashboard</h1>
      {(expiringCount > 0 || lowStockCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiringCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Yaroqlilik muddati tugayotgan mahsulotlar</p>
                <p className="text-sm text-red-600">{expiringCount} ta partiya (7 kun ichida)</p>
              </div>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <Package className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Kam qoldiq</p>
                <p className="text-sm text-amber-600">{lowStockCount} ta mahsulot</p>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {links.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="p-6 hover:border-emerald-300 transition-colors h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-900">{item.label}</span>
              </div>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
