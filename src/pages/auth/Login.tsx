import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Phone, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { getFirebaseAuth, tryGetFirebaseDb, isFirebaseConfigured } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  BRAND,
  isDemoLoginUiAllowed,
  shouldShowRoleLoginPanel,
  persistDemoUser,
} from '../../constants/branding';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../../constants/devRoleLogins';
import { completeDemoRoleLogin, findDevCredentialsByPhone } from '../../utils/demoRoleLogin';
import { logger } from '../../services/logger';
import type { UserRole } from '../../types';
import { parseUserRole, ROLE_HOME_PATHS } from '../../constants/roles';
import { obtainDjangoJwt, roleRequiresDjangoJwt } from '../../services/djangoAuth';
import { signOut } from 'firebase/auth';

const FIXED_PASSWORD = 'SaxarERP123!';

function allowDemoPasswordFallback(): boolean {
  return isDemoLoginUiAllowed();
}

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const makeSyntheticEmail = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '').trim();
    if (!digits) throw new Error('Telefon raqam kiritilmagan');
    return `${digits}@saxar.local`;
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Telefon raqamini kiriting');
      return;
    }
    setLoading(true);
    setError('');
    const pwd = password.trim() || (allowDemoPasswordFallback() ? FIXED_PASSWORD : '');
    if (!pwd) {
      setError('Parolni kiriting');
      setLoading(false);
      return;
    }
    try {
      const matched = findDevCredentialsByPhone(phone.trim());
      if (matched) {
        const usePwd = pwd || matched.creds.password;
        const result = await completeDemoRoleLogin(matched.role, {
          ...matched.creds,
          password: usePwd,
        });
        if (!result.ok) setError(result.error || 'Kirish amalga oshmadi');
        return;
      }

      if (!isFirebaseConfigured()) {
        if (shouldShowRoleLoginPanel()) {
          setError(
            'Telefon ro‘yxatdagi demo raqamlardan biri bo‘lishi kerak. Quyidagi rol tugmasini bosing.'
          );
          return;
        }
        if (!isDemoLoginUiAllowed()) {
          setError('Autentifikatsiya serveri sozlanmagan. Quyidagi rol tugmalaridan foydalaning.');
          return;
        }
        persistDemoUser(
          JSON.stringify({
            uid: `demo_phone_b2b_${phone.replace(/\D/g, '').slice(-6) || 'user'}`,
            email: makeSyntheticEmail(phone.trim()),
            phone,
            role: 'b2b',
            name: 'Demo B2B Client',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
        window.location.href = '/b2b';
        return;
      }

      const syntheticEmail = makeSyntheticEmail(phone.trim());
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, syntheticEmail, pwd);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const db = tryGetFirebaseDb();
        if (!db) {
          setError('Firestore mavjud emas. Konfiguratsiyani tekshiring.');
          return;
        }
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const role = parseUserRole(userDoc.exists() ? userDoc.data().role : undefined);
        if (roleRequiresDjangoJwt(role)) {
          const jwt = await obtainDjangoJwt(phone.trim(), pwd);
          if (!jwt) {
            await signOut(auth);
            setError(
              'Server API bilan bog‘lanishda xatolik. Django foydalanuvchi va parol to‘g‘riligini tekshiring.'
            );
            return;
          }
        } else if (role === 'b2b') {
          await obtainDjangoJwt(phone.trim(), pwd);
        }
        navigate(ROLE_HOME_PATHS[role]);
      }
    } catch (err) {
      const fbErr = err as { message?: string; code?: string };
      const msg = String(fbErr?.message || '');
      const isOpNotAllowed =
        fbErr?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');
      const apiKeyBad =
        fbErr?.code === 'auth/invalid-api-key' ||
        (typeof fbErr?.code === 'string' && fbErr.code.includes('api-key')) ||
        msg.toLowerCase().includes('api-key-not-valid') ||
        msg.toLowerCase().includes('invalid-api-key');

      if (isOpNotAllowed || apiKeyBad) {
        if (!isDemoLoginUiAllowed()) {
          setError('Kirish sozlamalari noto‘g‘ri. Administrator bilan bog‘laning.');
          return;
        }
        persistDemoUser(
          JSON.stringify({
            uid: `demo_phone_b2b_${phone.replace(/\D/g, '').slice(-6) || 'user'}`,
            email: makeSyntheticEmail(phone.trim()),
            phone,
            role: 'b2b',
            name: 'Demo B2B Client',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
        window.location.href = '/b2b';
        return;
      }

      setError(
        msg.includes('invalid-credential') || msg.includes('invalid-credentials')
          ? "Telefon raqam yoki parol noto'g'ri"
          : fbErr?.message || 'Kirish amalga oshmadi'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    if (!shouldShowRoleLoginPanel()) {
      setError('Rol bo‘yicha tezkir kirish o‘chirilgan (.env: VITE_SHOW_DEMO_ROLE_LOGIN=true).');
      return;
    }
    const creds = DEV_ROLE_PHONE_CREDENTIALS[role];
    if (!creds) return;
    setPhone(creds.phone);
    setPassword(creds.password);
    setLoading(true);
    setError('');
    try {
      await completeDemoRoleLogin(role, creds);
    } catch (err) {
      logger.error('Rol bilan tezkir kirish', err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        'min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden antialiased ' +
        'bg-zinc-50 text-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 [color-scheme:light]'
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10 flex flex-col items-stretch">
        <div className="flex justify-start mb-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-zinc-300 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-300 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-50"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 text-zinc-800" />
            Bosh sahifa
          </Button>
        </div>
        <div className="flex justify-center text-emerald-700 mb-2">
          <Package className="h-10 w-10" strokeWidth={2} />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight dark:text-zinc-950">
          Tizimga kirish
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-600">
          {BRAND.erpProductName} — tizimga kirish
        </p>

        {!isFirebaseConfigured() && (
          <p className="mt-3 text-center text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Firebase hozir ulanmagan — quyidagi demo akkauntlar orqali barcha rollarga kiring (Django API ham ishlatiladi).
          </p>
        )}

        {shouldShowRoleLoginPanel() && (
          <div
            className={
              'mt-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/95 p-4 shadow-md ' +
              'ring-1 ring-emerald-900/5 dark:border-emerald-200/90 dark:bg-emerald-50 dark:ring-emerald-900/5'
            }
          >
            <div className="flex gap-3 mb-3">
              <ShieldCheck className="h-9 w-9 shrink-0 text-emerald-800" strokeWidth={2} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900">Demo: ERP rollariga tezkir kirish</p>
                <p className="text-xs text-zinc-600 mt-0.5 leading-snug">
                  Tugmani bosing — telefon va parol avtomatik to‘ldiriladi va tizimga kiriladi. Har rol uchun alohida
                  demo parol (prod’da ham ishlaydi).
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
                    className={
                      'h-auto flex-col items-stretch py-2.5 px-3 text-left gap-1 ' +
                      'border-emerald-300/90 bg-white text-zinc-900 shadow-sm ' +
                      'hover:bg-emerald-100/70 hover:border-emerald-400 ' +
                      'dark:border-emerald-300/90 dark:bg-white dark:text-zinc-900 dark:hover:bg-emerald-100/70'
                    }
                    disabled={loading}
                    onClick={() => void handleRoleQuickLogin(role)}
                  >
                    <span className="text-xs font-bold text-emerald-950 w-full">{c.title}</span>
                    <span className="text-[11px] text-zinc-700 w-full select-all font-mono">{c.phone}</span>
                    <span className="text-[11px] text-zinc-600 w-full select-all font-mono">Parol: {c.password}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-full relative z-10 flex justify-center mt-5">
        <Card
          className={
            'p-4 sm:p-6 sm:rounded-3xl w-full max-w-lg mx-auto overflow-hidden ' +
            'border border-zinc-200/90 bg-white text-zinc-900 shadow-xl shadow-zinc-900/5 ' +
            'ring-1 ring-zinc-200/70 dark:border-zinc-200/90 dark:bg-white dark:text-zinc-900 ' +
            'dark:shadow-xl dark:shadow-zinc-900/8 dark:ring-zinc-200/70'
          }
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 dark:bg-red-50 dark:text-red-700">
              {error}
            </div>
          )}

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/70 text-slate-600">yoki qo‘lda telefon va parol</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handlePhoneLogin}>
            <div>
              <label htmlFor="login-phone" className="block text-sm font-medium text-slate-700">
                Telefon raqam
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="login-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className="pl-10"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                Parol
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-10"
                  placeholder={allowDemoPasswordFallback() ? 'Bo‘sh bo‘lsa — SaxarERP123!' : 'Parol'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {allowDemoPasswordFallback() ? (
                <p className="mt-1 text-xs text-slate-500">
                  Qo‘lda kirishda parol bo‘sh bo‘lsa, standart demo parol ishlatiladi.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Parolni kiriting.</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-emerald-200/60 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Eslab qolish
                </label>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Telefonni tekshiring</span>
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                {loading ? 'Kiring...' : 'Kirish'}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Akkauntingiz yo'qmi? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-emerald-700 hover:text-emerald-600"
            >
              Ro'yxatdan o'tish (B2B)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
