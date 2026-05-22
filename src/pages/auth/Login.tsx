import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Phone, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { BRAND } from '../../constants/branding';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../../constants/devRoleLogins';
import { API_BASE_URL } from '../../services/api';
import { probeDjangoApiReachable } from '../../services/djangoAuth';
import { completeDemoRoleLogin, loginWithDjangoCredentials } from '../../utils/demoRoleLogin';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const probe = DEV_ROLE_PHONE_CREDENTIALS.admin;
      const ok = await probeDjangoApiReachable(probe.phone, probe.password);
      if (!cancelled) setApiOk(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Telefon raqamini kiriting');
      return;
    }
    if (!password.trim()) {
      setError('Parolni kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await loginWithDjangoCredentials(phone.trim(), password.trim());
      if (!result.ok) setError(result.error || 'Kirish amalga oshmadi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: (typeof DEV_ROLE_ORDER)[number]) => {
    const creds = DEV_ROLE_PHONE_CREDENTIALS[role];
    setPhone(creds.phone);
    setPassword(creds.password);
    setLoading(true);
    setError('');
    try {
      const result = await completeDemoRoleLogin(role, creds);
      if (!result.ok) setError(result.error || 'Kirish amalga oshmadi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden antialiased bg-zinc-50 text-zinc-900">
      <div className="w-full max-w-lg mx-auto relative z-10 flex flex-col items-stretch">
        <div className="flex justify-start mb-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifa
          </Button>
        </div>
        <div className="flex justify-center text-emerald-700 mb-2">
          <Package className="h-10 w-10" />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-zinc-950">Tizimga kirish</h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-zinc-600">
          {BRAND.erpProductName} — faqat Django API
        </p>
        {apiOk === true && (
          <p className="mt-2 text-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            API ulangan ({API_BASE_URL})
          </p>
        )}
        {apiOk === false && (
          <p className="mt-2 text-center text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            API javob bermadi — serverda yangi frontend deploy qiling va{' '}
            <code className="font-mono">ensure_role_users</code> ishga tushiring.
          </p>
        )}

        <div className="mt-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/95 p-4 shadow-md">
          <div className="flex gap-3 mb-3">
            <ShieldCheck className="h-9 w-9 shrink-0 text-emerald-800" />
            <div>
              <p className="text-sm font-bold text-zinc-900">Rollar — tezkir kirish</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Tugmani bosing yoki telefon va parolni qo‘lda kiriting.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEV_ROLE_ORDER.map((role) => {
              const c = DEV_ROLE_PHONE_CREDENTIALS[role];
              return (
                <Button
                  key={role}
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-stretch py-2.5 px-3 text-left gap-1"
                  disabled={loading}
                  onClick={() => void handleRoleQuickLogin(role)}
                >
                  <span className="text-xs font-bold text-emerald-950 w-full">{c.title}</span>
                  <span className="text-[11px] text-zinc-700 w-full font-mono select-all">{c.phone}</span>
                  <span className="text-[11px] text-zinc-600 w-full font-mono select-all">
                    Parol: {c.password}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center mt-5">
        <Card className="p-4 sm:p-6 w-full max-w-lg mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handlePhoneLogin}>
            <div>
              <label htmlFor="login-phone" className="block text-sm font-medium text-slate-700">
                Telefon
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="login-phone"
                  type="tel"
                  required
                  className="pl-10"
                  placeholder="+998 90 000 01 01"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                Parol
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="login-password"
                  type="password"
                  required
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? 'Kiring...' : 'Kirish'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-emerald-700 hover:text-emerald-600"
            >
              Ro&apos;yxatdan o&apos;tish (B2B)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
