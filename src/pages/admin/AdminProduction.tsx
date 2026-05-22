import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Search, Plus, Play, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useCatalogProducts } from '../../hooks/useCatalogProducts';
import { addNotification } from '../../platform/notifications';
import { hasDjangoJwt } from '../../services/djangoAuth';
import DjangoApiReconnect from '../../components/DjangoApiReconnect';

interface ProductionOrder {
  id: string;
  product: string;
  productId: string;
  quantity: number;
  unit: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProduction() {
  const [search, setSearch] = useState('');
  const { data: products } = useCatalogProducts();
  const productionOrders: ProductionOrder[] = [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    quantity: 0,
    unit: 'kg',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setForm(f => ({
      ...f,
      productId,
      productName: product?.name || '',
      unit: product?.unit || 'kg',
    }));
  };

  const handleCreate = async () => {
    if (!form.productName.trim() || form.quantity <= 0) return;
    setSaving(true);
    try {
      addNotification(
        'Tez orada',
        'Ishlab chiqarish buyurtmalari Django API ga ulanadi. Hozircha Ombor (WMS) orqali kirim qiling.'
      );
      setShowCreateModal(false);
      setForm({ productId: '', productName: '', quantity: 0, unit: 'kg', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = productionOrders.filter(o =>
    o.product?.toLowerCase().includes(search.toLowerCase()) || o.id?.includes(search)
  );

  if (!hasDjangoJwt()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Ishlab chiqarish</h1>
        <DjangoApiReconnect />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Ishlab chiqarish moduli Django API ga ulanmoqda. Partiyalar va kirimlar hozir{' '}
        <strong>Ombor (WMS)</strong> bo‘limida boshqariladi.
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Ishlab chiqarish</h1>
        <Button
          variant="primary"
          className="gap-2"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 px-6 text-center text-slate-500">
                      Ishlab chiqarish buyurtmalari yo&apos;q. &quot;Yangi buyurtma&quot; tugmasini bosing.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
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
                      <div>Tug: {order.endDate || '\u2014'}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => addNotification('Partiya', `${order.id} — ${order.product || order.productId}, ${order.quantity} ${order.unit}`)}
                      >
                        Batafsil
                      </Button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4">Xomashyo qoldig&apos;i</h3>
            <p className="text-sm text-slate-500">Xomashyo qoldiqlari hozircha ko&apos;rsatilmaydi.</p>
            <Button
              variant="outline"
              className="w-full mt-4"
              type="button"
              onClick={() => (window.location.href = '/admin/wms')}
            >
              Barcha xomashyolar
            </Button>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100">
            <h3 className="font-bold text-slate-900 mb-2">Retseptura (BOM)</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Mahsulotlar tarkibi va ishlab chiqarish normalarini boshqarish.
            </p>
            <Button
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              type="button"
              onClick={() => addNotification('Retseptura', 'WMS → Mahsulotlar bo‘limida norma va retsepturalarni boshqaring.')}
            >
              Retseptlarni ko&apos;rish
            </Button>
          </Card>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi ishlab chiqarish buyurtmasi" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot *</label>
            <select
              className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
              value={form.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
            >
              <option value="">Mahsulot tanlang</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor *</label>
              <Input
                type="number"
                min="1"
                value={form.quantity || ''}
                onChange={(e) => setForm(f => ({ ...f, quantity: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birlik</label>
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={form.unit}
                onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="pcs">dona</option>
                <option value="box">quti</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Boshlash sanasi</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tugash sanasi</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleCreate} disabled={saving || !form.productName.trim() || form.quantity <= 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
