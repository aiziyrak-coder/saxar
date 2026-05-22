import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Building, Phone, FileText, ArrowLeft } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import { persistUserSession, userFromDjangoProfile } from '../../services/sessionStore';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    inn: '',
    companyName: '',
    password: '',
    passwordConfirm: '',
  });
  const makeSyntheticEmail = (phone: string) => {
    const digits = phone.replace(/\D/g, '').trim();
    if (!digits) throw new Error('Telefon raqam kiritilmagan');
    return `${digits}@saxar.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stirDigits = formData.inn.replace(/\D/g, '');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const companyName = formData.companyName.trim();

    if (stirDigits.length !== 9) {
      setError("STIR 9 raqamdan iborat bo'lishi kerak");
      return;
    }
    if (!companyName) {
      setError('Korxona nomini kiriting');
      return;
    }
    if (phoneDigits.length < 9 || phoneDigits.length > 12) {
      setError("Telefon raqam 9 dan 12 gacha raqamdan iborat bo'lishi kerak");
      return;
    }
    const pwd = formData.password.trim();
    if (pwd.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
      return;
    }
    if (pwd !== formData.passwordConfirm.trim()) {
      setError('Parollar mos kelmaydi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const syntheticEmail = makeSyntheticEmail(formData.phone);
      const dj = await api.post<{
        id: number;
        email?: string;
        phone?: string;
        role?: string;
        company_name?: string;
        stir?: string;
        is_active?: boolean;
      }>('/accounts/auth/register-b2b/', {
        email: syntheticEmail,
        password: pwd,
        phone: formData.phone.trim(),
        stir: stirDigits,
        company_name: companyName,
      });

      persistUserSession(
        userFromDjangoProfile(
          {
            id: dj.id,
            role: 'b2b',
            is_active: false,
            email: dj.email || syntheticEmail,
            phone: dj.phone || formData.phone.trim(),
            company_name: companyName,
            stir: stirDigits,
            first_name: companyName,
          },
          formData.phone.trim()
        )
      );
      navigate('/b2b/profile', { state: { pendingApproval: true } });
    } catch (apiErr) {
      if (apiErr instanceof ApiError) {
        setError(apiErr.message || 'Ro‘yxatdan o‘tib bo‘lmadi');
      } else {
        setError(apiErr instanceof Error ? apiErr.message : "Ro'yxatdan o'tishda xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        'min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden antialiased ' +
        'bg-zinc-50 text-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 ' +
        '[color-scheme:light]'
      }
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>
      <div className="w-full relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md mx-auto flex justify-start mb-4">
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
        <div className="flex justify-center text-emerald-700 mb-3 drop-shadow-sm">
          <Package className="h-11 w-11" strokeWidth={2} />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight dark:text-zinc-950">
          B2B Ro'yxatdan o'tish
        </h2>
        <p className="mt-2 max-w-md text-center text-xs sm:text-sm text-zinc-600 leading-relaxed dark:text-zinc-600">
          Ulgurji narxlarda xarid qilish uchun do'koningizni ro'yxatdan o'tkazing
        </p>
      </div>

      <div className="w-full relative z-10 flex justify-center mt-6">
        <Card
          className={
            'p-4 sm:p-6 sm:rounded-3xl w-full max-w-md mx-auto overflow-hidden ' +
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-900">STIR (INN)</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-emerald-800/90" strokeWidth={2} />
                </div>
                <Input
                  type="text"
                  required
                  className="pl-10 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:placeholder:text-zinc-500"
                  placeholder="9 raqamli STIR"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-600 leading-snug dark:text-zinc-600">
                9 raqamli korxona identifikatori
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-900">
                Korxona (Do'kon) nomi
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-emerald-800/90" strokeWidth={2} />
                </div>
                <Input
                  type="text"
                  required
                  className="pl-10 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:placeholder:text-zinc-500"
                  placeholder="Masalan: Omadli Savdo MChJ"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-900">Telefon raqam</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-emerald-800/90" strokeWidth={2} />
                </div>
                <Input
                  type="tel"
                  required
                  className="pl-10 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:placeholder:text-zinc-500"
                  placeholder="+998 90 123 45 67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900">Parol</label>
              <Input
                type="password"
                required
                minLength={6}
                className="mt-1.5"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900">Parolni tasdiqlang</label>
              <Input
                type="password"
                required
                minLength={6}
                className="mt-1.5"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full justify-center py-2.5 font-semibold" disabled={loading}>
              {loading ? 'Ro\'yxatdan o\'tilyapti...' : 'Ro\'yxatdan o\'tish'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-zinc-700 dark:text-zinc-700">
            <span>Akkauntingiz bormi? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline"
            >
              Tizimga kirish
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
