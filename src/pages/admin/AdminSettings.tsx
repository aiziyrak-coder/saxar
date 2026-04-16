import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Users, Percent, Shield, Database, Bell, Plus, Loader2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { promotionService } from '../../services/firestore';
import type { Promotion } from '../../types';

const PROMO_TYPES = [
  { value: 'percent', label: 'Foiz chegirma (%)' },
  { value: 'fixed', label: 'Qat\'iy summa (so\'m)' },
  { value: 'buy_x_get_y', label: 'X ta olsa Y ta tekin' },
] as const;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'prices' | 'users' | 'security' | 'api' | 'sms'>('prices');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    name: '',
    type: 'percent' as 'percent' | 'fixed' | 'buy_x_get_y',
    value: 0,
    buyQuantity: 10,
    getQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const { data: promotions, loading: promoLoading, refresh: refreshPromos } = useFirestore<Promotion>('promotions');

  const handleSavePromo = async () => {
    if (!promoForm.name.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const end = promoForm.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await promotionService.create({
        name: promoForm.name.trim(),
        type: promoForm.type,
        value: promoForm.value,
        buyQuantity: promoForm.type === 'buy_x_get_y' ? promoForm.buyQuantity : undefined,
        getQuantity: promoForm.type === 'buy_x_get_y' ? promoForm.getQuantity : undefined,
        startDate: promoForm.startDate,
        endDate: end,
        isActive: promoForm.isActive,
        createdAt: now,
        updatedAt: now,
      } as Omit<Promotion, 'id'>);
      setShowPromoModal(false);
      setPromoForm({ name: '', type: 'percent', value: 0, buyQuantity: 10, getQuantity: 1, startDate: new Date().toISOString().split('T')[0], endDate: '', isActive: true });
      refreshPromos();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const togglePromoActive = async (p: Promotion) => {
    try {
      await promotionService.update(p.id, { isActive: !p.isActive, updatedAt: new Date().toISOString() });
      refreshPromos();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Tizim Sozlamalari</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'prices' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveTab('prices')}
          >
            <Percent className="h-5 w-5 mr-3" /> Narxlar va Chegirmalar
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" onClick={() => setActiveTab('users')}>
            <Users className="h-5 w-5 mr-3" /> Foydalanuvchilar (RBAC)
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" onClick={() => setActiveTab('security')}>
            <Shield className="h-5 w-5 mr-3" /> Xavfsizlik va Audit
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" onClick={() => setActiveTab('api')}>
            <Database className="h-5 w-5 mr-3" /> Integratsiyalar (API)
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100" onClick={() => setActiveTab('sms')}>
            <Bell className="h-5 w-5 mr-3" /> Xabarnomalar (SMS)
          </Button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'prices' && (
            <Card>
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Narx siyosati va Aksiyalar</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">B2B Mijozlar uchun ulgurji narx ustamasi (Markup)</h4>
                  <div className="flex items-center gap-4">
                    <Input type="number" defaultValue="15" className="w-24" />
                    <span className="text-slate-600">% (Tannarx ustiga)</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Barcha mahsulotlar uchun standart ustama foizi.</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-900">Faol Aksiyalar</h4>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPromoModal(true)}>
                      <Plus className="h-4 w-4" /> Yangi aksiya
                    </Button>
                  </div>
                  {promoLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promotions.length === 0 ? (
                        <p className="text-slate-500 py-4">Aksiyalar hali qo‘shilmagan. «Yangi aksiya» orqali qo‘shing.</p>
                      ) : (
                        promotions.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-4 border rounded-lg ${p.isActive ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200'}`}
                          >
                            <div>
                              <div className={`font-bold ${p.isActive ? 'text-emerald-900' : 'text-slate-900'}`}>{p.name}</div>
                              <div className={`text-sm mt-1 ${p.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {p.type === 'buy_x_get_y' && `${p.buyQuantity} ta olsa ${p.getQuantity} ta tekin`}
                                {p.type === 'percent' && `${p.value}% chegirma`}
                                {p.type === 'fixed' && `${p.value} so‘m chegirma`}
                                {' • '}{p.startDate} – {p.endDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {p.isActive ? 'Faol' : 'Nofaol'}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => togglePromoActive(p)}>
                                {p.isActive ? 'O‘chirish' : 'Yoqish'}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-medium text-slate-900 mb-4">Qarzdorlik limiti (Kredit liniyasi)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Yangi do‘konlar uchun limit</label>
                      <div className="flex items-center gap-2">
                        <Input type="number" defaultValue="5000000" />
                        <span className="text-slate-500">UZS</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Ishonchli do‘konlar uchun limit</label>
                      <div className="flex items-center gap-2">
                        <Input type="number" defaultValue="50000000" />
                        <span className="text-slate-500">UZS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {activeTab !== 'prices' && (
            <Card>
              <p className="text-slate-500">Ushbu bo‘lim sozlamalari keyingi yangilanishda qo‘shiladi.</p>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showPromoModal} onClose={() => !saving && setShowPromoModal(false)} title="Yangi aksiya">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomi</label>
            <Input value={promoForm.name} onChange={e => setPromoForm(f => ({ ...f, name: e.target.value }))} placeholder="masalan: 10 ta olsa 1 ta tekin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Turi</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={promoForm.type}
              onChange={e => setPromoForm(f => ({ ...f, type: e.target.value as typeof promoForm.type }))}
            >
              {PROMO_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {(promoForm.type === 'percent' || promoForm.type === 'fixed') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{promoForm.type === 'percent' ? 'Foiz (%)' : 'Summa (so‘m)'}</label>
              <Input type="number" min={0} value={promoForm.value || ''} onChange={e => setPromoForm(f => ({ ...f, value: Number(e.target.value) || 0 }))} />
            </div>
          )}
          {promoForm.type === 'buy_x_get_y' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">X (sotib olish)</label>
                <Input type="number" min={1} value={promoForm.buyQuantity} onChange={e => setPromoForm(f => ({ ...f, buyQuantity: Number(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Y (tekin)</label>
                <Input type="number" min={0} value={promoForm.getQuantity} onChange={e => setPromoForm(f => ({ ...f, getQuantity: Number(e.target.value) || 0 }))} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Boshlanish</label>
              <Input type="date" value={promoForm.startDate} onChange={e => setPromoForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tugash (ixtiyoriy)</label>
              <Input type="date" value={promoForm.endDate} onChange={e => setPromoForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={promoForm.isActive} onChange={e => setPromoForm(f => ({ ...f, isActive: e.target.checked }))} />
            <span className="text-sm text-slate-700">Faol</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPromoModal(false)} disabled={saving}>Bekor qilish</Button>
            <Button variant="primary" onClick={handleSavePromo} disabled={saving || !promoForm.name.trim()} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
