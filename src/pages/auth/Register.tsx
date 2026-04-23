import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Building, Phone, FileText, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { persistDemoUser } from '../../constants/branding';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    inn: '',
    companyName: '',
  });

  const FIXED_PASSWORD = 'SaxarERP123!';
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

    setLoading(true);
    setError('');
    try {
      const syntheticEmail = makeSyntheticEmail(formData.phone);
      const result = await createUserWithEmailAndPassword(auth, syntheticEmail, FIXED_PASSWORD);
      await updateProfile(result.user, { displayName: companyName });
      const uid = result.user.uid;
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: syntheticEmail,
        phone: formData.phone.trim(),
        role: 'b2b',
        name: companyName,
        status: 'pending',
        stir: stirDigits,
        companyName,
        address: '',
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(db, 'clients', uid), {
        id: uid,
        name: companyName,
        ownerName: companyName,
        phone: formData.phone.trim(),
        stir: stirDigits,
        companyName,
        address: '',
        region: '',
        status: 'pending',
        registrationStatus: 'pending',
        discountPercent: 0,
        paymentType: 'transfer',
        creditLimit: 0,
        creditDays: 0,
        currentBalance: 0,
        totalPurchases: 0,
        createdAt: now,
        updatedAt: now,
      });
      navigate('/b2b');
    } catch (err) {
      const fbErr = err as { message?: string; code?: string };
      const msg = String(fbErr?.message || '');
      const isOpNotAllowed =
        fbErr?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');

      if (isOpNotAllowed) {
        const syntheticEmailFallback = makeSyntheticEmail(formData.phone);
        persistDemoUser(
          JSON.stringify({
            uid: `demo_phone_b2b_${formData.phone.replace(/\D/g, '').slice(-6) || 'user'}`,
            email: syntheticEmailFallback,
            phone: formData.phone,
            role: 'b2b',
            name: formData.companyName,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
        window.location.href = '/b2b';
        return;
      }

      setError(
        msg.includes('email-already-in-use')
          ? "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
          : fbErr?.message || "Ro'yxatdan o'tishda xatolik"
      );
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
        <div className="w-full flex justify-start mb-4">
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
        <div className="flex justify-center text-emerald-700 mb-4">
          <Package className="h-12 w-12" />
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
          B2B Ro'yxatdan o'tish
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
          Ulgurji narxlarda xarid qilish uchun do'koningizni ro'yxatdan o'tkazing
        </p>
      </div>

      <div className="w-full relative z-10 flex justify-center">
        <Card className="p-4 sm:p-6 sm:rounded-3xl w-full max-w-md mx-auto overflow-hidden">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">STIR (INN)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="text"
                  required
                  className="pl-10"
                  placeholder="9 raqamli STIR"
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">9 raqamli korxona identifikatori</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Korxona (Do'kon) nomi</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="text"
                  required
                  className="pl-10"
                  placeholder="Masalan: Omadli Savdo MChJ"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Telefon raqam</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="tel"
                  required
                  className="pl-10"
                  placeholder="+998 90 123 45 67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Ro'yxatdan keyin kirish paroli tizim tomonidan belgilanadi (demo rejimda avtomatik).
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? 'Ro\'yxatdan o\'tilyapti...' : 'Ro\'yxatdan o\'tish'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-slate-600">Akkauntingiz bormi? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-emerald-700 hover:text-emerald-600"
            >
              Tizimga kirish
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
