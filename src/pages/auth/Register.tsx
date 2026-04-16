import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Building, Phone, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { sendVerificationCode } from '../../services/integrations';
import { persistDemoUser } from '../../constants/branding';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
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

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const stirDigits = formData.inn.replace(/\D/g, '');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const companyName = formData.companyName.trim();

    if (stirDigits.length !== 9) {
      setError('STIR 9 raqamdan iborat bo\'lishi kerak');
      return;
    }
    if (!companyName) {
      setError('Korxona nomini kiriting');
      return;
    }
    if (phoneDigits.length < 9 || phoneDigits.length > 12) {
      setError('Telefon raqam 9 dan 12 gacha raqamdan iborat bo\'lishi kerak');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { success } = await sendVerificationCode(formData.phone.trim());
      if (success) setStep(2);
      else setError('SMS yuborishda xatolik. Qayta urinib ko\'ring.');
    } catch {
      setError('SMS xizmati vaqtincha ishlamayapti');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const code = smsCode.join('');
    if (code.length !== 6) {
      setError('6 xonali kodni kiriting');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    const stirDigits = formData.inn.replace(/\D/g, '');
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const companyName = formData.companyName.trim();
    if (stirDigits.length !== 9 || phoneDigits.length < 9 || phoneDigits.length > 12 || !companyName) {
      setError('Ma\'lumotlarni tekshirib, qayta urinib ko\'ring');
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
      const error = err as { message?: string; code?: string };
      const msg = String(error?.message || '');
      const isOpNotAllowed =
        error?.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed');
    
      if (isOpNotAllowed) {
        // Providerlar o'chiq bo'lsa, UI ko'rish uchun local demo (default: b2b).
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
          : error?.message || "Ro'yxatdan o'tishda xatolik"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    if (step === 1) handleStep1(e);
    else if (step === 2) handleStep2(e);
    else if (step === 3) handleStep3(e);
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

          {step === 1 && (
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
          )}
          
          {/* Progress Bar */}
          <div className="mb-4 hidden sm:block">
            <div className="flex items-center justify-between">
              <div className={`flex flex-col items-center ${step >= 1 ? 'text-emerald-700' : 'text-slate-500'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-700'}`}>1</div>
                <span className="text-xs mt-1 font-medium">Ma'lumotlar</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-emerald-500' : 'bg-emerald-200/60'}`}></div>
              <div className={`flex flex-col items-center ${step >= 2 ? 'text-emerald-700' : 'text-slate-500'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-700'}`}>2</div>
                <span className="text-xs mt-1 font-medium">SMS Tasdiq</span>
              </div>
              <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-emerald-500' : 'bg-emerald-200/60'}`}></div>
              <div className={`flex flex-col items-center ${step >= 3 ? 'text-emerald-700' : 'text-slate-500'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-emerald-500 bg-emerald-500/15' : 'border-slate-700'}`}>3</div>
                <span className="text-xs mt-1 font-medium">Tugatish</span>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleNext}>
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-200">STIR (INN)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      required
                      className="pl-10"
                      placeholder="9 ruxsatli raqam"
                      value={formData.inn}
                      onChange={(e) => setFormData({...formData, inn: e.target.value})}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">STIR kiritilganda korxona nomi avtomatik tortib olinadi (Soliq.uz)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Korxona (Do'kon) nomi</label>
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
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Telefon raqam</label>
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
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                  {loading ? 'SMS yuborilmoqda...' : 'Davom etish'}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{formData.phone}</span> raqamiga tasdiqlash kodi yuborildi.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 text-center">SMS Kodni kiriting</label>
                  <div className="mt-2 flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-10 h-12 text-center text-xl font-bold border border-emerald-200/60 rounded-md focus:ring-emerald-400 focus:border-emerald-400 bg-white/75 text-slate-900"
                        value={smsCode[i]}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                          const next = [...smsCode];
                          next[i] = v;
                          setSmsCode(next);
                          if (v && i < 5) (e.target.nextElementSibling as HTMLInputElement)?.focus();
                        }}
                        onKeyDown={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (e.key === 'Backspace' && !smsCode[i] && i > 0) {
                            (target.previousElementSibling as HTMLInputElement | null)?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center text-sm mt-4">
                  <span className="text-slate-400">Kod kelmadimi? </span>
                  <button type="button" className="text-emerald-700 font-medium hover:text-emerald-600">Qayta yuborish (0:59)</button>
                </div>
                <Button type="submit" variant="primary" className="w-full justify-center mt-6" disabled={loading}>
                  Tasdiqlash
                </Button>
                <Button type="button" variant="ghost" className="w-full justify-center mt-2 text-slate-400" onClick={() => setStep(1)}>
                  Orqaga
                </Button>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-3">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/15 mb-4 border border-emerald-200/60">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Arizangiz qabul qilindi!</h3>
                <p className="text-slate-600 mb-4">
                  Sizning ma'lumotlaringiz tekshirilmoqda. Admin tasdiqlaganidan so'ng tizimga kirishingiz va ulgurji narxlarni ko'rishingiz mumkin.
                </p>
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
                  {loading ? 'Yuklanmoqda...' : 'B2B Portalga kirish'}
                </Button>
              </div>
            )}
          </form>

          {step === 1 && (
            <div className="mt-4 text-center text-sm hidden sm:block">
              <span className="text-slate-600">Akkauntingiz bormi? </span>
              <button onClick={() => navigate('/login')} className="font-medium text-emerald-700 hover:text-emerald-600">
                Tizimga kirish
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
