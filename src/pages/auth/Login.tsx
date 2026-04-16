import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Phone, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BRAND, persistDemoUser } from '../../constants/branding';
import { logger } from '../../services/logger';

/** Prod: faqat `VITE_ALLOW_DEMO_LOGIN=true` bo‘lsa; dev: doim ko‘rinadi */
const showDemoLogin =
  !import.meta.env.PROD || String(import.meta.env.VITE_ALLOW_DEMO_LOGIN).toLowerCase() === 'true';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts: Record<string, { email: string; password: string; name: string }> = {
    admin: { email: 'demo.admin@saxar.local', password: 'Demo123!', name: 'Demo Admin' },
    accountant: { email: 'demo.accountant@saxar.local', password: 'Demo123!', name: 'Demo Accountant' },
    warehouse: { email: 'demo.warehouse@saxar.local', password: 'Demo123!', name: 'Demo Warehouse' },
    production: { email: 'demo.production@saxar.local', password: 'Demo123!', name: 'Demo Production' },
    b2b: { email: 'demo.client@saxar.local', password: 'Demo123!', name: 'Demo B2B Mijoz' },
    agent: { email: 'demo.agent@saxar.local', password: 'Demo123!', name: 'Demo Agent' },
    driver: { email: 'demo.driver@saxar.local', password: 'Demo123!', name: 'Demo Haydovchi' },
  };

  const FIXED_PASSWORD = 'SaxarERP123!';
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
    try {
      const syntheticEmail = makeSyntheticEmail(phone.trim());
      await signInWithEmailAndPassword(auth, syntheticEmail, FIXED_PASSWORD);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const role = userDoc.exists() ? userDoc.data().role : 'b2b';
        const routes: Record<string, string> = {
          admin: '/admin',
          accountant: '/accountant',
          warehouse: '/warehouse',
          production: '/production',
          b2b: '/b2b',
          agent: '/agent',
          driver: '/driver',
        };
        navigate(routes[role] || '/');
      }
    } catch (err) {
      const error = err as { message?: string; code?: string };
      const msg = String(error?.message || '');
      const isOpNotAllowed =
        error?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');

      if (isOpNotAllowed) {
        // Providerlar o‘chiq bo‘lsa, UI ko‘rish uchun local demo (default: b2b).
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
          ? "Telefon raqam yoki kirish ma'lumotlari noto'g'ri"
          : error?.message || 'Kirish amalga oshmadi'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    const demo = demoAccounts[role];
    if (!demo) return;
    setLoading(true);
    setError('');
    const routes: Record<string, string> = {
      admin: '/admin',
      accountant: '/accountant',
      warehouse: '/warehouse',
      production: '/production',
      b2b: '/b2b',
      agent: '/agent',
      driver: '/driver',
    };
    try {
      let credentialUser;
      try {
        credentialUser = await signInWithEmailAndPassword(auth, demo.email, demo.password);
      } catch (err) {
        const error = err as { code?: string };
        if (error?.code === 'auth/user-not-found') {
          credentialUser = await createUserWithEmailAndPassword(auth, demo.email, demo.password);
        } else {
          throw err;
        }
      }

      const user = credentialUser.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: demo.email,
          role,
          name: demo.name,
          createdAt: new Date().toISOString(),
        });
      }

      navigate(routes[role] || '/');
    } catch (err) {
      logger.error('Demo kirish xatosi', err instanceof Error ? err : undefined);
      const error = err as { message?: string; code?: string };
      const msg = String(error?.message || '');
      const isOpNotAllowed = error?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');
      if (isOpNotAllowed) {
        // Firebase Auth provider o'chirilgan bo'lsa, UI ko'rish uchun local demo mode.
        persistDemoUser(
          JSON.stringify({
            uid: `demo_${role}`,
            email: demo.email,
            phone: '',
            role,
            name: demo.name,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
        window.location.href = routes[role] || '/';
        return;
      }

      setError('Demo akkauntga kirishda xatolik: ' + (error?.message || ''));
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
              <span className="px-2 bg-white/70 text-slate-600">
                yoki telefon raqam orqali
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handlePhoneLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Telefon raqam
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <Input
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
            <div className="mt-4 hidden sm:block">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/70 text-slate-600">
                    Demo uchun rollarni tanlang
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-2">
                Har bir rol uchun demo akkaunt mavjud. Tugmani bossangiz, avtomatik ravishda mos demo foydalanuvchi bilan tizimga kiritiladi.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'admin')} className="w-full text-xs" disabled={loading}>
                  Admin / Direktor
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'accountant')} className="w-full text-xs" disabled={loading}>
                  Buxgalter
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'warehouse')} className="w-full text-xs" disabled={loading}>
                  Ombor mudiri
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'production')} className="w-full text-xs" disabled={loading}>
                  Ishlab chiqarish
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'b2b')} className="w-full text-xs" disabled={loading}>
                  B2B Mijoz
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'agent')} className="w-full text-xs" disabled={loading}>
                  Agent
                </Button>
                <Button variant="outline" onClick={(e) => handleDemoLogin(e, 'driver')} className="w-full text-xs" disabled={loading}>
                  Dastavkachi
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm hidden sm:block">
            <span className="text-slate-600">Akkauntingiz yo'qmi? </span>
            <button
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
