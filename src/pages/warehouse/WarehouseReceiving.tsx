import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { inventoryService, inventoryTransactionService, generateBatchNumber } from '../../services/firestore';
import type { Product, InventoryItem, InventoryTransaction } from '../../types';

export default function WarehouseReceiving() {
  const { userData } = useAuth();
  const { data: products } = useFirestore<Product>('products');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    manufactureDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    location: 'A-01',
    batchNumber: '',
  });

  const selectedProduct = products.find(p => p.id === form.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !userData) return;
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 1) return;
    const batchNumber = form.batchNumber || generateBatchNumber(form.productId);
    setSubmitting(true);
    try {
      const inv: Omit<InventoryItem, 'id'> = {
        productId: form.productId,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        batchNumber,
        quantity: qty,
        unit: selectedProduct.unit,
        expiryDate: form.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        manufactureDate: form.manufactureDate,
        location: form.location,
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      await inventoryService.create(inv);
      await inventoryTransactionService.create({
        type: 'in',
        productId: form.productId,
        productName: selectedProduct.name,
        batchNumber,
        quantity: qty,
        unit: selectedProduct.unit,
        referenceNumber: `KIRIM-${batchNumber}`,
        toLocation: form.location,
        notes: 'Ishlab chiqarishdan qabul',
        createdBy: userData.uid,
        createdByName: userData.name || 'Ombor',
        createdAt: new Date().toISOString(),
      } as Omit<InventoryTransaction, 'id'>);
      setShowModal(false);
      setForm({ productId: '', quantity: '', manufactureDate: new Date().toISOString().slice(0, 10), expiryDate: '', location: 'A-01', batchNumber: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Kirim (Ishlab chiqarishdan qabul)</h1>
        <Button variant="primary" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Yangi kirim
        </Button>
      </div>
      <Card>
        <p className="text-slate-600 mb-4">
          Tayyor mahsulotni ishlab chiqarishdan qabul qilish. Partiya raqami, miqdor, yaroqlilik muddati va joyni kiriting. FIFO bo‘yicha avtomatik joylashtiriladi.
        </p>
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <ArrowDownToLine className="h-12 w-12 mb-4 text-slate-300" />
          <p className="mb-4">Yangi kirim qilish uchun &quot;Yangi kirim&quot; tugmasini bosing.</p>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Omborga kirim" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
            <select
              required
              className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 border focus:border-emerald-500 focus:ring-emerald-500"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Tanlang</option>
              {products.filter(p => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor</label>
            <Input
              type="number"
              required
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ishlab chiqarilgan sana</label>
              <Input
                type="date"
                value={form.manufactureDate}
                onChange={(e) => setForm({ ...form, manufactureDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yaroqlilik muddati</label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Joylashuv (zona)</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="A-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Partiya raqami (ixtiyoriy)</label>
              <Input
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                placeholder="Avtomatik"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
              {submitting ? 'Saqlanmoqda...' : 'Kirim qilish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
