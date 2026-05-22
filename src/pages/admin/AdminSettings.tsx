import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Users, Percent, Shield, Database, Bell, Plus, Loader2, Send } from 'lucide-react';
import { createPromotion, deletePromotion, listPromotions, updatePromotion } from '../../services/localPromotions';
import type { Promotion } from '../../types';
import { telegramApi, ApiError, type TelegramSettingsDto } from '../../services/api';
import {
  UsersRbacPanel,
  SecurityAuditPanel,
  IntegrationsApiPanel,
  SmsNotificationsPanel,
} from './settings/SettingsPanels';
import { hasDjangoJwt } from '../../services/djangoAuth';
import { platformApi } from '../../services/platformApi';
import { addNotification } from '../../platform/notifications';

const PROMO_TYPES = [
  { value: 'percent', label: 'Foiz chegirma (%)' },
  { value: 'fixed', label: 'Qat\'iy summa (so\'m)' },
  { value: 'buy_x_get_y', label: 'X ta olsa Y ta tekin' },
] as const;

function TelegramSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bindBusy, setBindBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<TelegramSettingsDto | null>(null);
  const [groupId, setGroupId] = useState('');
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyExpenses, setNotifyExpenses] = useState(true);
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [inviteUrl, setInviteUrl] = useState('');
  const [bindUserId, setBindUserId] = useState('');
  const [bindUsername, setBindUsername] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setOkMsg(null);
    try {
      const s = await telegramApi.getSettings();
      setSettings(s);
      setGroupId(String(s.admin_group_id));
      setNotifyNewOrders(s.notify_new_orders);
      setNotifyPayments(s.notify_payments);
      setNotifyExpenses(s.notify_expenses);
      setNotifyOrderStatus(s.notify_order_status);
      try {
        const inv = await telegramApi.getInviteLink();
        setInviteUrl(inv.invite_url);
      } catch {
        setInviteUrl('');
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Ma’lumotni yuklab bo‘lmadi (JWT / admin huquqi).';
      setErr(
        hasDjangoJwt()
          ? msg
          : `${msg} Admin sifatida qayta kiring — Django JWT avtomatik olinadi.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const gid = Number(groupId);
      if (!Number.isFinite(gid)) {
        setErr('Guruh ID raqam bo‘lishi kerak.');
        return;
      }
      const s = await telegramApi.putSettings({
        admin_group_id: gid,
        notify_new_orders: notifyNewOrders,
        notify_payments: notifyPayments,
        notify_expenses: notifyExpenses,
        notify_order_status: notifyOrderStatus,
      });
      setSettings(s);
      setOkMsg('Sozlamalar saqlandi.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setOkMsg('Havola nusxalandi.');
    } catch {
      setOkMsg(inviteUrl);
    }
  };

  const bindUser = async () => {
    const uid = Number(bindUserId);
    if (!Number.isFinite(uid) || uid < 1) {
      setErr('Foydalanuvchi ID butun son bo‘lishi kerak.');
      return;
    }
    setBindBusy(true);
    setErr(null);
    setOkMsg(null);
    try {
      await telegramApi.adminBindUserTelegram(uid, bindUsername.trim());
      setOkMsg(`Foydalanuvchi #${uid} uchun Telegram username yangilandi.`);
      setBindUsername('');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Bog‘lashda xato');
    } finally {
      setBindBusy(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center gap-2 p-8 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </Card>
    );
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Telegram bot (buyurtma, to‘lov, guruh)</h3>
        <p className="text-sm text-slate-600 mt-2">
          Server <code className="text-xs bg-slate-100 px-1 rounded">.env</code> da{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> va{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">TELEGRAM_WEBHOOK_SECRET</code> bo‘lishi kerak. Webhook:{' '}
          <code className="text-xs break-all">python manage.py set_telegram_webhook https://.../api/telegram/webhook/</code>
        </p>
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
      {okMsg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{okMsg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <span className="text-slate-600">Bot token (.env):</span>{' '}
          <strong>{settings?.bot_token_configured ? 'bor ✅' : 'yo‘q ❌'}</strong>
        </div>
        <div>
          <span className="text-slate-600">Webhook secret:</span>{' '}
          <strong>{settings?.webhook_secret_configured ? 'bor ✅' : 'yo‘q ❌'}</strong>
        </div>
        <div>
          <span className="text-slate-600">Bot @username:</span> <strong>@{settings?.bot_username || '—'}</strong>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Asosiy admin guruh ID (masalan -100…)</label>
        <Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="-1003852134921" />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyNewOrders} onChange={(e) => setNotifyNewOrders(e.target.checked)} />
          Yangi buyurtmalar guruhga
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyPayments} onChange={(e) => setNotifyPayments(e.target.checked)} />
          To‘lovlar guruhga + mijozga
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyExpenses} onChange={(e) => setNotifyExpenses(e.target.checked)} />
          Xarajatlar guruhga
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyOrderStatus} onChange={(e) => setNotifyOrderStatus(e.target.checked)} />
          Buyurtma holati o‘zgarsa guruh + mijoz
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={saveSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Saqlash
        </Button>
        <Button variant="outline" type="button" onClick={load}>
          Yangilash
        </Button>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h4 className="font-medium text-slate-900">Shaxsiy bog‘lanish havolasi (joriy akkaunt)</h4>
        <p className="text-xs text-slate-500">
          Havolani hodim yoki mijozga yuboring; u Telegramda ochganda akkaunt bot bilan bog‘lanadi.
        </p>
        {inviteUrl ? (
          <div className="flex flex-wrap gap-2 items-center">
            <code className="text-xs bg-slate-100 rounded px-2 py-1 max-w-full break-all">{inviteUrl}</code>
            <Button variant="outline" size="sm" type="button" onClick={copyInvite}>
              Nusxalash
            </Button>
          </div>
        ) : (
          <p className="text-xs text-amber-700">Havola olinmadi — bot token / getMe ni tekshiring.</p>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h4 className="font-medium text-slate-900">Mijoz / hodim — Telegram username</h4>
        <p className="text-xs text-slate-500">
          Avvalo foydalanuvchi ID va Telegramdagi @username (sizsiz) kiriting. Keyin foydalanuvchi botga /start bosadi
          yoki yuqoridagi havoladan foydalanadi.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Input
            label="User ID"
            type="number"
            value={bindUserId}
            onChange={(e) => setBindUserId(e.target.value)}
            placeholder="masalan 12"
          />
          <Input
            label="Telegram username (sizsiz)"
            value={bindUsername}
            onChange={(e) => setBindUsername(e.target.value)}
            placeholder="masalan alisher_dev"
          />
          <Button variant="secondary" type="button" onClick={bindUser} disabled={bindBusy} className="shrink-0">
            {bindBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

type SettingsTab = 'prices' | 'users' | 'security' | 'api' | 'sms' | 'telegram';

export default function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabParam && ['prices', 'users', 'security', 'api', 'sms', 'telegram'].includes(tabParam) ? tabParam : 'prices'
  );

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };
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
  const [markupPercent, setMarkupPercent] = useState(15);
  const [creditNew, setCreditNew] = useState(5_000_000);
  const [creditTrusted, setCreditTrusted] = useState(50_000_000);
  const [pricingSaving, setPricingSaving] = useState(false);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const refreshPromos = useCallback(() => {
    setPromoLoading(true);
    setPromotions(listPromotions());
    setPromoLoading(false);
  }, []);

  useEffect(() => {
    refreshPromos();
  }, [refreshPromos, activeTab]);

  useEffect(() => {
    if (!hasDjangoJwt()) return;
    platformApi.getSettings().then((s) => {
      setMarkupPercent(s.default_b2b_markup_percent);
      setCreditNew(s.credit_limit_new_client);
      setCreditTrusted(s.credit_limit_trusted_client);
    }).catch(() => {});
  }, [activeTab]);

  const savePricing = async () => {
    if (!hasDjangoJwt()) {
      addNotification('Sozlamalar', 'Admin JWT kerak — qayta kiring.');
      return;
    }
    setPricingSaving(true);
    try {
      await platformApi.putSettings({
        default_b2b_markup_percent: markupPercent,
        credit_limit_new_client: creditNew,
        credit_limit_trusted_client: creditTrusted,
      });
      addNotification('Narxlar', 'Saqlandi.');
    } catch {
      addNotification('Xatolik', 'Saqlashda xato.');
    } finally {
      setPricingSaving(false);
    }
  };

  const handleSavePromo = async () => {
    if (!promoForm.name.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const end = promoForm.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await createPromotion({
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
      });
      setShowPromoModal(false);
      setPromoForm({ name: '', type: 'percent', value: 0, buyQuantity: 10, getQuantity: 1, startDate: new Date().toISOString().split('T')[0], endDate: '', isActive: true });
      refreshPromos();
      addNotification('Aksiya', 'Saqlandi (mahalliy katalog).');
    } catch (e) {
      addNotification('Xatolik', e instanceof Error ? e.message : 'Aksiya saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  const togglePromoActive = async (p: Promotion) => {
    try {
      await updatePromotion(p.id, { isActive: !p.isActive, updatedAt: new Date().toISOString() });
      refreshPromos();
    } catch (e) {
      addNotification('Xatolik', 'Holat o‘zgartirilmadi');
    }
  };

  const handleDeletePromo = async (p: Promotion) => {
    if (!window.confirm(`"${p.name}" aksiyasi o‘chirilsinmi?`)) return;
    await deletePromotion(p.id);
    refreshPromos();
    addNotification('O‘chirildi', p.name);
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
            onClick={() => selectTab('prices')}
          >
            <Percent className="h-5 w-5 mr-3" /> Narxlar va Chegirmalar
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'users' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => selectTab('users')}
          >
            <Users className="h-5 w-5 mr-3" /> Foydalanuvchilar (RBAC)
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'security' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => selectTab('security')}
          >
            <Shield className="h-5 w-5 mr-3" /> Xavfsizlik va Audit
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'api' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => selectTab('api')}
          >
            <Database className="h-5 w-5 mr-3" /> Integratsiyalar (API)
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'sms' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => selectTab('sms')}
          >
            <Bell className="h-5 w-5 mr-3" /> Xabarnomalar (SMS)
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeTab === 'telegram' ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => selectTab('telegram')}
          >
            <Send className="h-5 w-5 mr-3" /> Telegram bot
          </Button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'telegram' && <TelegramSettingsPanel />}
          {activeTab === 'users' && <UsersRbacPanel />}
          {activeTab === 'security' && <SecurityAuditPanel />}
          {activeTab === 'api' && <IntegrationsApiPanel />}
          {activeTab === 'sms' && <SmsNotificationsPanel />}
          {activeTab === 'prices' && (
            <Card>
              <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Narx siyosati va Aksiyalar</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">B2B Mijozlar uchun ulgurji narx ustamasi (Markup)</h4>
                  <div className="flex items-center gap-4">
                    <Input type="number" min={0} value={markupPercent} onChange={(e) => setMarkupPercent(Number(e.target.value) || 0)} className="w-24" />
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
                              <Button variant="ghost" size="sm" type="button" onClick={() => togglePromoActive(p)}>
                                {p.isActive ? 'Nofaol' : 'Faol'}
                              </Button>
                              <Button variant="ghost" size="sm" type="button" className="text-red-600" onClick={() => handleDeletePromo(p)}>
                                O‘chirish
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
                        <Input type="number" min={0} value={creditNew} onChange={(e) => setCreditNew(Number(e.target.value) || 0)} />
                        <span className="text-slate-500">UZS</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Ishonchli do‘konlar uchun limit</label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} value={creditTrusted} onChange={(e) => setCreditTrusted(Number(e.target.value) || 0)} />
                        <span className="text-slate-500">UZS</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" type="button" onClick={savePricing} disabled={pricingSaving} className="mt-4">
                    {pricingSaving ? 'Saqlanmoqda...' : 'Narx siyosatini saqlash'}
                  </Button>
                </div>
              </div>
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
