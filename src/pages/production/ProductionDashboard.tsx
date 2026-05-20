import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Factory, Plus, CheckCircle2, Package, Settings, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addNotification, notifyPlannedFeature } from '../../platform/notifications';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';

interface ProductionBatch {
  id: string;
  product: string;
  productId: string;
  status: string;
  progress: number;
  expected: number;
  quantity: number;
  unit: string;
  startTime: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductionDashboard() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { data: activeBatches, create: createBatch, update: updateBatch } = useFirestore<ProductionBatch>('production_orders');
  const { data: products } = useFirestore<Product>('products');
  const { data: inventory } = useFirestore<{ id: string; productName: string; quantity: number; unit: string; status: string }>('inventory');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    expected: 0,
    unit: 'kg',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setForm(f => ({ ...f, productId, productName: product?.name || '', unit: product?.unit || 'kg' }));
  };

  const handleCreate = async () => {
    if (!form.productName.trim() || form.expected <= 0) return;
    setSaving(true);
    try {
      await createBatch({
        product: form.productName,
        productId: form.productId,
        status: 'Kutilmoqda',
        progress: 0,
        expected: form.expected,
        quantity: form.expected,
        unit: form.unit,
        startTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        startDate: form.startDate,
        endDate: form.endDate,
        createdBy: userData?.uid || '',
        createdByName: userData?.name || '',
      } as Omit<ProductionBatch, 'id'>);
      setShowCreateModal(false);
      setForm({ productId: '', productName: '', expected: 0, unit: 'kg', startDate: new Date().toISOString().split('T')[0], endDate: '' });
      addNotification('Partiya yaratildi', 'Yangi ishlab chiqarish partiyasi muvaffaqiyatli yaratildi.');
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Partiya yaratishda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (batch: ProductionBatch) => {
    try {
      await updateBatch(batch.id, { status: 'Yakunlandi', progress: 100 });
      addNotification('Yakunlandi', `${batch.product} partiyasi yakunlandi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Yakunlashda xatolik.');
    }
  };

  const handleStartBatch = async (batch: ProductionBatch) => {
    try {
      await updateBatch(batch.id, { status: 'Jarayonda', progress: 10, startTime: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) });
      addNotification('Boshlandi', `${batch.product} partiyasi ishga tushirildi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Boshlashda xatolik.');
    }
  };

  const rawMaterials = inventory
    .filter(i => i.status === 'available')
    .reduce((acc, item) => {
      const existing = acc.find(r => r.name === item.productName);
      if (existing) { existing.stock += item.quantity; }
      else { acc.push({ name: item.productName, stock: item.quantity, unit: item.unit, status: item.quantity > 50 ? 'Yaxshi' : 'Kam' }); }
      return acc;
    }, [] as { name: string; stock: number; unit: string; status: string }[])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Ishlab chiqarish (Production)</h1>
        <Button variant="primary" className="gap-2" type="button" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Yangi partiya
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Factory className="h-5 w-5 text-emerald-600" /> Faol jarayonlar
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {activeBatches.length === 0 ? (
                <p className="text-sm text-slate-500">&quot;Yangi partiya&quot; tugmasini bosib ishlab chiqarish buyurtmasini yarating.</p>
              ) : (
                activeBatches.map((batch) => (
                <div key={batch.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-500">{batch.id.slice(0, 12)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          batch.status === 'Jarayonda' ? 'bg-emerald-100 text-emerald-700' :
                          batch.status === 'Yakunlandi' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{batch.product}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500">Kutilayotgan hajm</div>
                      <div className="font-bold text-slate-900">{batch.expected || batch.quantity} {batch.unit}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Jarayon: {batch.progress}%</span>
                      <span className="text-slate-500">Boshlandi: {batch.startTime || batch.startDate}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${batch.progress > 0 ? 'bg-emerald-600' : 'bg-slate-300'}`} 
                        style={{ width: `${batch.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                    {batch.status === 'Kutilmoqda' && (
                      <Button variant="primary" size="sm" className="flex-1 gap-2" type="button" onClick={() => handleStartBatch(batch)}>
                        <Factory className="h-4 w-4" /> Boshlash
                      </Button>
                    )}
                    {batch.status === 'Jarayonda' && (
                      <Button variant="primary" size="sm" className="flex-1 gap-2" type="button" onClick={() => handleComplete(batch)}>
                        Yakunlash <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {batch.status === 'Yakunlandi' && (
                      <span className="flex-1 text-center text-sm text-emerald-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Yakunlangan
                      </span>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card
              className="flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors border-dashed border-2"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/production/transfer')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/production/transfer'); } }}
            >
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900">Tayyor mahsulotni omborga o&apos;tkazish</h4>
              <p className="text-sm text-slate-500 mt-1">WMS ga kirim qilish</p>
            </Card>
            <Card
              className="flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors border-dashed border-2"
              role="button"
              tabIndex={0}
              onClick={() => notifyPlannedFeature('Retseptura (texkarta)')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); notifyPlannedFeature('Retseptura (texkarta)'); } }}
            >
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <Settings className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900">Retseptura (Texkarta) sozlamalari</h4>
              <p className="text-sm text-slate-500 mt-1">Xomashyo sarfini belgilash</p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" /> Xomashyo qoldig&apos;i
            </h3>
            <div className="space-y-4">
              {rawMaterials.length === 0 ? (
                <p className="text-sm text-slate-500">Omborga mahsulot kirim qilinmagan.</p>
              ) : (
                rawMaterials.map((material, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{material.name}</div>
                      <div className={`text-xs font-medium mt-1 ${material.status === 'Yaxshi' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {material.status}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {material.stock.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{material.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="bg-white/70 text-slate-900 border border-emerald-200/60">
            <h3 className="font-bold mb-2">Kunlik hisobot</h3>
            <p className="text-sm text-slate-400 mb-4">Bugungi ishlab chiqarilgan mahsulotlar hisoboti.</p>
            <Button variant="primary" className="w-full bg-emerald-500 hover:bg-emerald-600 border-none" type="button" onClick={() => notifyPlannedFeature('Kunlik ishlab chiqarish hisoboti')}>
              Hisobotni yuklash
            </Button>
          </Card>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi ishlab chiqarish partiyasi" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot *</label>
            <select className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm" value={form.productId} onChange={(e) => handleProductSelect(e.target.value)}>
              <option value="">Mahsulot tanlang</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor *</label>
              <Input type="number" min="1" value={form.expected || ''} onChange={(e) => setForm(f => ({ ...f, expected: Number(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birlik</label>
              <select className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm" value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="kg">kg</option><option value="g">g</option><option value="l">l</option><option value="pcs">dona</option><option value="box">quti</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Boshlanish</label><Input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Tugash</label><Input type="date" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>Bekor qilish</Button>
            <Button type="button" variant="primary" onClick={handleCreate} disabled={saving || !form.productName.trim() || form.expected <= 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
