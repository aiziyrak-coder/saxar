import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Phone, ArrowLeft, Lock } from 'lucide-react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BRAND, persistDemoUser } from '../../constants/branding';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../../constants/devRoleLogins';
import { logger } from '../../services/logger';
import type { UserRole } from '../../types';

/** Prod: faqat `VITE_ALLOW_DEMO_LOGIN=true` bo‘lsa; dev: doim ko‘rinadi */
const showDemoLogin =
  !import.meta.env.PROD || String(import.meta.env.VITE_ALLOW_DEMO_LOGIN).toLowerCase() === 'true';

const ROUTES: Record<string, string> = {
  admin: '/admin',
  accountant: '/accountant',
  warehouse: '/warehouse',
  production: '/production',
  b2b: '/b2b',
  agent: '/agent',
  driver: '/driver',
};

const FIXED_PASSWORD = 'SaxarERP123!';

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
    const pwd = password.trim() || FIXED_PASSWORD;
    try {
      const syntheticEmail = makeSyntheticEmail(phone.trim());
      await signInWithEmailAndPassword(auth, syntheticEmail, pwd);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const role = userDoc.exists() ? String(userDoc.data().role || 'b2b') : 'b2b';
        navigate(ROUTES[role] || '/');
      }
    } catch (err) {
      const error = err as { message?: string; code?: string };
      const msg = String(error?.message || '');
      const isOpNotAllowed =
        error?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');

      if (isOpNotAllowed) {
        persistDemoUser(
          JSON.stringify({
            uid: `demo_phone_b2b_${phone.replace(/\D/g, '').slice(-6) || 'user'}`,
            email: makeSyntheticEmail(phone.trim()),
            phone,
            role: 'b2b',
            name: 'Demo B2B Client',
            status: 'active',
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
          : error?.message || 'Kirish amalga oshmadi'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    const creds = DEV_ROLE_PHONE_CREDENTIALS[role];
    if (!creds) return;
    setPhone(creds.phone);
    setPassword(creds.password);
    setLoading(true);
    setError('');
    try {
      const syntheticEmail = makeSyntheticEmail(creds.phone);
      const credential = await signInWithEmailAndPassword(auth, syntheticEmail, creds.password);
      const userDocRef = doc(db, 'users', credential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: credential.user.uid,
          email: syntheticEmail,
          phone: creds.phone,
          role,
          name: creds.displayName,
          createdAt: new Date().toISOString(),
        });
      }

      const data = userDoc.exists() ? userDoc.data() : { role };
      const effectiveRole = String(data.role || role);
      navigate(ROUTES[effectiveRole] || ROUTES[role] || '/');
    } catch (err) {
      logger.error('Rol bilan tezkir kirish', err instanceof Error ? err : undefined);
      const error = err as { message?: string; code?: string };
      const msg = String(error?.message || '');
      const invalid =
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/user-not-found' ||
        msg.includes('invalid-credential');
      const isOpNotAllowed =
        error?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');

      if (showDemoLogin && (isOpNotAllowed || invalid)) {
        persistDemoUser(
          JSON.stringify({
            uid: `demo_phone_${role}_${creds.phone.replace(/\D/g, '').slice(-4)}`,
            email: makeSyntheticEmail(creds.phone),
            phone: creds.phone,
            role,
            name: creds.displayName,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
        window.location.href = ROUTES[role] || '/';
        return;
      }

      setError(error?.message || 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-10%] h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
      </div>
      <div className="w-full relative z-10 flex flex-col items-center">
        <div className="w-full flex justify-start">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200/60 bg-white/60 hover:bg-white transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifa
          </Button>
        </div>
        <div className="flex justify-center text-emerald-700 mb-3 sm:mb-5">
          <Package className="h-12 w-12" />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tizimga kirish
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
          {BRAND.erpProductName} — tizimga kirish
        </p>
      </div>

      <div className="w-full relative z-10 flex justify-center">
        <Card className="p-4 sm:p-6 sm:rounded-3xl w-full max-w-md mx-auto overflow-hidden">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/70 text-slate-600">yoki telefon raqam orqali</span>
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
                  placeholder="Bo‘sh qoldirsangiz — standart demo parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Qo‘lda kirishda parol bo‘sh bo‘lsa, ichki demo parol ishlatiladi.</p>
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
                <span className="text-slate-500">Telefon raqamni tekshiring</span>
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                {loading ? 'Kiring...' : 'Kirish'}
              </Button>
            </div>
          </form>

          {showDemoLogin && (
            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/70 text-slate-600">Tezkir kirish (rol bo‘yicha)</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 mb-3">
                Tugmani bosing: telefon va parol avtomatik to‘ldiriladi va tizimga kiriladi. Faqat dev yoki{' '}
                <code className="text-[11px] bg-slate-100 px-1 rounded">VITE_ALLOW_DEMO_LOGIN=true</code>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEV_ROLE_ORDER.map((role) => {
                  const c = DEV_ROLE_PHONE_CREDENTIALS[role];
                  return (
                    <Button
                      key={role}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-[3.25rem] flex-col items-stretch py-2 px-3 text-left gap-0.5"
                      disabled={loading}
                      onClick={() => void handleRoleQuickLogin(role)}
                    >
                      <span className="text-xs font-semibold text-slate-800 w-full">{c.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono w-full truncate" title={`${c.phone} · ${c.password}`}>
                        {c.phone} · {c.password}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

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
