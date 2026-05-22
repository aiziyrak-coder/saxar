import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Loader2, Plus, Shield, Database, Bell, RefreshCw } from 'lucide-react';
import { readLocalAuditLogs } from '../../../services/audit';
import { platformApi, djangoUsersApi, type PlatformSettingsDto, type DjangoUserRow } from '../../../services/platformApi';
import { ApiError } from '../../../services/api';
import { hasDjangoJwt } from '../../../services/djangoAuth';
import { addNotification } from '../../../platform/notifications';
import type { AuditLog, UserRole } from '../../../types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Buxgalter' },
  { value: 'warehouse', label: 'Ombor' },
  { value: 'production', label: 'Ishlab chiqarish' },
  { value: 'agent', label: 'Agent' },
  { value: 'driver', label: 'Haydovchi' },
  { value: 'b2b', label: 'B2B mijoz' },
];

function ApiAuthHint({ onRetry }: { onRetry?: () => void }) {
  return (
    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      Django API uchun admin JWT kerak. Chiqib qayta kiring (admin telefon + parol) yoki «JWT yangilash» tugmasini bosing.
      {onRetry && (
        <Button variant="outline" size="sm" type="button" className="ml-2 mt-2" onClick={onRetry}>
          JWT yangilash
        </Button>
      )}
    </p>
  );
}

export function UsersRbacPanel() {
  const [djangoUsers, setDjangoUsers] = useState<DjangoUserRow[]>([]);
  const [djangoLoading, setDjangoLoading] = useState(false);
  const [djangoErr, setDjangoErr] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<DjangoUserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'agent' as UserRole, password: '' });

  const loadDjango = useCallback(async () => {
    if (!hasDjangoJwt()) {
      setDjangoErr('JWT yo‘q');
      return;
    }
    setDjangoLoading(true);
    setDjangoErr(null);
    try {
      const rows = await djangoUsersApi.list();
      setDjangoUsers(rows);
    } catch (e) {
      setDjangoErr(e instanceof ApiError ? e.message : 'Django foydalanuvchilar yuklanmadi');
    } finally {
      setDjangoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDjango();
  }, [loadDjango]);

  const handleSaveUser = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (!hasDjangoJwt()) {
      addNotification('API', 'JWT kerak — qayta kiring.');
      return;
    }
    setSaving(true);
    try {
      const email = form.email.trim() || `${form.phone.replace(/\D/g, '')}@saxar.local`;
      if (editUser) {
        await djangoUsersApi.patch(editUser.id, {
          first_name: form.name.trim(),
          phone: form.phone.trim(),
          email,
          role: form.role,
        });
        addNotification('Yangilandi', `${form.name} saqlandi.`);
      } else {
        await djangoUsersApi.create({
          email,
          phone: form.phone.trim(),
          role: form.role,
          password: form.password || `Saxar${form.phone.replace(/\D/g, '').slice(-6) || '123456'}`,
          first_name: form.name.trim(),
          is_active: true,
        });
        addNotification('Foydalanuvchi', `${form.name} qo‘shildi.`);
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ name: '', phone: '', email: '', role: 'agent', password: '' });
      await loadDjango();
    } catch (e) {
      addNotification('Xatolik', e instanceof ApiError ? e.message : 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: DjangoUserRow) => {
    if (!hasDjangoJwt()) return;
    try {
      await djangoUsersApi.patch(u.id, { is_active: u.is_active === false });
      await loadDjango();
      addNotification('Holat', u.is_active === false ? 'Faollashtirildi' : 'Bloklandi');
    } catch (e) {
      addNotification('Xatolik', e instanceof ApiError ? e.message : 'Holat o‘zgartirilmadi');
    }
  };

  const changeRole = async (u: DjangoUserRow, role: UserRole) => {
    if (!hasDjangoJwt()) return;
    try {
      await djangoUsersApi.patch(u.id, { role });
      await loadDjango();
    } catch (e) {
      addNotification('Xatolik', e instanceof ApiError ? e.message : 'Rol o‘zgartirilmadi');
    }
  };

  const openEdit = (u: DjangoUserRow) => {
    setEditUser(u);
    setForm({
      name: u.first_name || u.username || '',
      phone: u.phone || '',
      email: u.email || '',
      role: u.role as UserRole,
      password: '',
    });
    setShowModal(true);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-lg font-bold text-slate-900">Foydalanuvchilar (RBAC)</h3>
        <Button
          variant="primary"
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditUser(null);
            setForm({ name: '', phone: '', email: '', role: 'agent', password: '' });
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" /> Yangi foydalanuvchi
        </Button>
      </div>

      <p className="text-sm text-slate-600">
        Barcha foydalanuvchilar <strong>Django</strong> da saqlanadi — rol, bloklash va tahrirlash shu yerda ishlaydi.
      </p>

      {!hasDjangoJwt() && <ApiAuthHint onRetry={loadDjango} />}
      {djangoErr && hasDjangoJwt() && <p className="text-sm text-red-600">{djangoErr}</p>}

      {djangoLoading ? (
        <div className="flex gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Ism</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Holat</th>
                <th className="p-3">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {djangoUsers.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3 text-slate-500">#{u.id}</td>
                  <td className="p-3 font-medium">{u.first_name || u.username}</td>
                  <td className="p-3">{u.phone || '—'}</td>
                  <td className="p-3">
                    <select
                      className="border border-slate-200 rounded px-2 py-1 text-sm"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as UserRole)}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <Badge variant={u.is_active !== false ? 'success' : 'default'}>
                      {u.is_active !== false ? 'active' : 'inactive'}
                    </Badge>
                  </td>
                  <td className="p-3 flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" type="button" onClick={() => openEdit(u)}>
                      Tahrirlash
                    </Button>
                    <Button variant="ghost" size="sm" type="button" onClick={() => toggleStatus(u)}>
                      {u.is_active !== false ? 'Bloklash' : 'Faollashtirish'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {djangoUsers.length === 0 && <p className="p-4 text-slate-500">Foydalanuvchilar yo‘q.</p>}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" type="button" onClick={loadDjango} disabled={djangoLoading}>
          <RefreshCw className={`h-3 w-3 ${djangoLoading ? 'animate-spin' : ''}`} /> Yangilash
        </Button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
      >
        <div className="space-y-3">
          <Input label="Ism" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Email (ixtiyoriy)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-slate-700">Rol</label>
            <select
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Django parol (ixtiyoriy)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Bekor
            </Button>
            <Button variant="primary" onClick={handleSaveUser} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export function SecurityAuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(() => {
    setLoading(true);
    setLogs(readLocalAuditLogs());
    setLoading(false);
  }, []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [idleMin, setIdleMin] = useState(30);
  const [retention, setRetention] = useState(90);
  const [enforcePwd, setEnforcePwd] = useState(true);

  const load = useCallback(async () => {
    if (!hasDjangoJwt()) return;
    try {
      const s = await platformApi.getSettings();
      setIdleMin(s.session_idle_minutes);
      setRetention(s.audit_log_retention_days);
      setEnforcePwd(s.enforce_strong_password);
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Yuklanmadi');
    }
  }, []);

  useEffect(() => {
    load();
    refresh();
  }, [load, refresh]);

  const save = async () => {
    if (!hasDjangoJwt()) return;
    setSaving(true);
    try {
      await platformApi.putSettings({
        session_idle_minutes: idleMin,
        audit_log_retention_days: retention,
        enforce_strong_password: enforcePwd,
      });
      addNotification('Xavfsizlik', 'Sozlamalar saqlandi.');
      await load();
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const recentLogs = useMemo(() => logs.slice(0, 50), [logs]);

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Shield className="h-5 w-5 text-emerald-600" /> Xavfsizlik va Audit
      </h3>
      {!hasDjangoJwt() && <ApiAuthHint onRetry={load} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Sessiya ogohlantiruvi (daqiqa)</label>
          <Input type="number" min={5} value={idleMin} onChange={(e) => setIdleMin(Number(e.target.value) || 30)} />
        </div>
        <div>
          <label className="text-sm text-slate-600">Audit jurnali saqlash (kun)</label>
          <Input type="number" min={7} value={retention} onChange={(e) => setRetention(Number(e.target.value) || 90)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enforcePwd} onChange={(e) => setEnforcePwd(e.target.checked)} />
        Kuchli parol talab qilish
      </label>
      <Button variant="primary" onClick={save} disabled={saving || !hasDjangoJwt()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
      </Button>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="border-t border-slate-100 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Audit jurnali (oxirgi 50)</h4>
          <Button variant="outline" size="sm" type="button" onClick={() => refresh()}>
            Yangilash
          </Button>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">Hozircha yozuvlar yo‘q. Harakatlar avtomatik qayd etiladi.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto text-xs space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="font-medium text-slate-800">
                  {log.action} — {log.entityType} #{log.entityId}
                </div>
                <div className="text-slate-500">
                  {log.userName} ({log.userRole}) • {new Date(log.createdAt).toLocaleString('uz-UZ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function IntegrationsApiPanel() {
  const [s, setS] = useState<PlatformSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [onecKey, setOnecKey] = useState('');

  const load = useCallback(async () => {
    if (!hasDjangoJwt()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setS(await platformApi.getSettings());
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const payload: Partial<PlatformSettingsDto> & { onec_api_key?: string } = { ...s };
      if (onecKey) payload.onec_api_key = onecKey;
      const updated = await platformApi.putSettings(payload);
      setS(updated);
      setOnecKey('');
      addNotification('Integratsiyalar', 'Saqlandi.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const patch = (partial: Partial<PlatformSettingsDto>) => setS((prev) => (prev ? { ...prev, ...partial } : prev));

  if (loading) {
    return (
      <Card className="p-8 flex gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Database className="h-5 w-5 text-emerald-600" /> Integratsiyalar (API)
      </h3>
      {!hasDjangoJwt() && <ApiAuthHint onRetry={load} />}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {s && (
        <>
          <div className="space-y-4">
            <h4 className="font-medium">To‘lov tizimlari</h4>
            {(['payme', 'click', 'uzum'] as const).map((key) => (
              <div key={key} className="flex flex-wrap items-center gap-3 p-3 border rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium capitalize">
                  <input
                    type="checkbox"
                    checked={s[`${key}_enabled` as keyof PlatformSettingsDto] as boolean}
                    onChange={(e) => patch({ [`${key}_enabled`]: e.target.checked } as Partial<PlatformSettingsDto>)}
                  />
                  {key}
                </label>
                <Input
                  className="flex-1 min-w-[200px]"
                  placeholder="Merchant ID"
                  value={s[`${key}_merchant_id` as keyof PlatformSettingsDto] as string}
                  onChange={(e) =>
                    patch({ [`${key}_merchant_id`]: e.target.value } as Partial<PlatformSettingsDto>)
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Buxgalteriya / hujjat</h4>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.onec_enabled} onChange={(e) => patch({ onec_enabled: e.target.checked })} />
              1C integratsiya
            </label>
            <Input
              placeholder="1C API URL"
              value={s.onec_base_url}
              onChange={(e) => patch({ onec_base_url: e.target.value })}
            />
            <Input
              type="password"
              placeholder={s.onec_api_key_configured ? 'API kalit (o‘zgartirish)' : '1C API kalit'}
              value={onecKey}
              onChange={(e) => setOnecKey(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.didox_enabled} onChange={(e) => patch({ didox_enabled: e.target.checked })} />
              Didox
            </label>
            <Input value={s.didox_api_url} onChange={(e) => patch({ didox_api_url: e.target.value })} placeholder="Didox API URL" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.eaktiv_enabled} onChange={(e) => patch({ eaktiv_enabled: e.target.checked })} />
              E-Aktiv
            </label>
            <Input value={s.eaktiv_api_url} onChange={(e) => patch({ eaktiv_api_url: e.target.value })} placeholder="E-Aktiv API URL" />
          </div>
          <div className="border-t pt-4">
            <label className="text-sm text-slate-600">Xarita provayderi</label>
            <select
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2"
              value={s.maps_provider}
              onChange={(e) => patch({ maps_provider: e.target.value })}
            >
              <option value="yandex">Yandex</option>
              <option value="google">Google</option>
            </select>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={s.soliq_api_enabled} onChange={(e) => patch({ soliq_api_enabled: e.target.checked })} />
              Soliq.uz STIR API
            </label>
          </div>
          <Button variant="primary" onClick={save} disabled={saving || !hasDjangoJwt()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
          </Button>
        </>
      )}
    </Card>
  );
}

export function SmsNotificationsPanel() {
  const [s, setS] = useState<PlatformSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [eskizPwd, setEskizPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasDjangoJwt()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setS(await platformApi.getSettings());
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      const payload: Partial<PlatformSettingsDto> & { sms_eskiz_password?: string } = {
        sms_enabled: s.sms_enabled,
        sms_provider: s.sms_provider,
        sms_sender_name: s.sms_sender_name,
        sms_eskiz_email: s.sms_eskiz_email,
        notify_order_status: s.notify_order_status,
        notify_low_stock: s.notify_low_stock,
        notify_payment_received: s.notify_payment_received,
      };
      if (eskizPwd) payload.sms_eskiz_password = eskizPwd;
      setS(await platformApi.putSettings(payload));
      setEskizPwd('');
      addNotification('SMS', 'Sozlamalar saqlandi.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  const testSend = async () => {
    if (!testPhone.trim()) return;
    try {
      const res = await platformApi.testSms(testPhone.trim(), 'Saxar ERP test SMS');
      addNotification(res.ok ? 'SMS yuborildi' : 'SMS xato', res.detail);
    } catch (e) {
      addNotification('SMS', e instanceof ApiError ? e.message : 'Xato');
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Bell className="h-5 w-5 text-emerald-600" /> Xabarnomalar (SMS)
      </h3>
      {!hasDjangoJwt() && <ApiAuthHint onRetry={load} />}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {s && (
        <>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={s.sms_enabled} onChange={(e) => setS({ ...s, sms_enabled: e.target.checked })} />
            SMS xabarnomalar yoqilgan
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600">Provayder</label>
              <select
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2"
                value={s.sms_provider}
                onChange={(e) => setS({ ...s, sms_provider: e.target.value })}
              >
                <option value="eskiz">Eskiz.uz</option>
                <option value="playmobile">Playmobile</option>
              </select>
            </div>
            <Input
              label="Jo‘natuvchi nomi (from)"
              value={s.sms_sender_name}
              onChange={(e) => setS({ ...s, sms_sender_name: e.target.value })}
            />
          </div>
          <Input
            label="Eskiz email"
            value={s.sms_eskiz_email}
            onChange={(e) => setS({ ...s, sms_eskiz_email: e.target.value })}
          />
          <Input
            label="Eskiz parol"
            type="password"
            placeholder={s.sms_eskiz_password_configured ? '•••••• (o‘zgartirish)' : 'Parol'}
            value={eskizPwd}
            onChange={(e) => setEskizPwd(e.target.value)}
          />
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Avtomatik xabarnomalar</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.notify_order_status}
                onChange={(e) => setS({ ...s, notify_order_status: e.target.checked })}
              />
              Buyurtma holati
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.notify_low_stock}
                onChange={(e) => setS({ ...s, notify_low_stock: e.target.checked })}
              />
              Kam qolgan zaxira
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.notify_payment_received}
                onChange={(e) => setS({ ...s, notify_payment_received: e.target.checked })}
              />
              To‘lov qabul qilindi
            </label>
          </div>
          <Button variant="primary" onClick={save} disabled={saving || !hasDjangoJwt()}>
            Saqlash
          </Button>
          <div className="border-t pt-4 flex flex-wrap gap-2 items-end">
            <Input label="Test telefon" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+998..." />
            <Button variant="outline" type="button" onClick={testSend} disabled={!hasDjangoJwt()}>
              Test SMS
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
