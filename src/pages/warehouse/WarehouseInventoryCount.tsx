import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Barcode, Search, Loader2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { inventoryAdjustment } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import type { InventoryItem, Product } from '../../types';

export default function WarehouseInventoryCount() {
  const { user, userData } = useAuth();
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [actualQty, setActualQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const { data: inventory, loading, refresh } = useFirestore<InventoryItem>('inventory');
  const { data: products } = useFirestore<Product>('products');

  const productStock = inventory.reduce((acc, item) => {
    if (!acc[item.productId]) acc[item.productId] = { total: 0, items: [] };
    acc[item.productId].total += item.quantity;
    acc[item.productId].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; items: InventoryItem[] }>);

  const productList = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const batchesToShow: InventoryItem[] = [];
  productList.slice(0, 80).forEach(p => {
    const items = productStock[p.id]?.items ?? [];
    items.forEach(b => batchesToShow.push(b));
  });

  const handleActualChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10);
    setActualQty(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleSaveAdjustments = async () => {
    if (!user || !userData) return;
    const toAdjust = batchesToShow.filter(
      item => actualQty[item.id] !== undefined && actualQty[item.id] !== item.quantity
    );
    if (toAdjust.length === 0) {
      alert('O‘zgarish yo‘q. Haqiqiy sonini kiriting.');
      return;
    }
    setSubmitting(true);
    try {
      for (const item of toAdjust) {
        const newQty = actualQty[item.id] ?? item.quantity;
        if (newQty < 0) continue;
        await inventoryAdjustment(
          item.productId,
          item.productName,
          item.sku,
          item.unit,
          item.id,
          item.batchNumber,
          item.quantity,
          newQty,
          'Inventarizatsiya',
          user.uid,
          userData.name || 'Omborchi'
        );
        await logAudit(AuditActions.INVENTORY_ADJUST, EntityTypes.INVENTORY, item.id, user.uid, userData.name || '', userData.role, { quantity: item.quantity }, { quantity: newQty });
      }
      setActualQty({});
      refresh();
    } catch (e) {
      console.error(e);
      alert('Aktlashtirishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = batchesToShow.some(
    item => actualQty[item.id] !== undefined && actualQty[item.id] !== item.quantity
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Inventarizatsiya</h1>
      <Card>
        <p className="text-slate-600 mb-4">
          Ombordagi qoldiqlarni real vaqtda tekshirish va kamchiliklarni aktlashtirish. Shtrix-kod / QR skaner orqali tezkor hisobga olish.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Mahsulot nomi, SKU yoki shtrix-kod..."
              className="pl-9"
              value={search || barcodeInput}
              onChange={(e) => { setSearch(e.target.value); setBarcodeInput(e.target.value); }}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Barcode className="h-4 w-4" /> Skaner
          </Button>
          {hasChanges && (
            <Button
              variant="primary"
              className="gap-2"
              onClick={handleSaveAdjustments}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              Aktlashtirish
            </Button>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mahsulot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Partiya / SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tizim qoldig‘i</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Haqiqiy soni</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Yaroqlilik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {batchesToShow.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.batchNumber} / {item.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        type="number"
                        min={0}
                        className="w-24 text-right"
                        value={actualQty[item.id] ?? ''}
                        onChange={(e) => handleActualChange(item.id, e.target.value)}
                        placeholder={String(item.quantity)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(item.expiryDate).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {batchesToShow.length === 0 && (
              <p className="p-6 text-center text-slate-500">Qidiruv bo‘yicha yoki omborda partiyalar topilmadi.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
