import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../context/AuthContext';
import {
  hasDjangoJwt,
  obtainDjangoJwt,
  tryRefreshDjangoJwt,
  notifyDjangoJwtRestored,
} from '../services/djangoAuth';

interface DjangoApiReconnectProps {
  title?: string;
  description?: string;
  onConnected?: () => void;
}

/**
 * Firebase bilan kirilgan, lekin Django API tokeni yo‘q yoki muddati tugagan.
 * Avval refresh token bilan tiklanadi; bo‘lmasa — parol kiritib JWT olinadi (chiqish shart emas).
 */
export default function DjangoApiReconnect({
  title = 'Server API bilan ulanish',
  description,
  onConnected,
}: DjangoApiReconnectProps) {
  const { userData, logout } = useAuth();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = userData?.phone?.trim() || '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await tryRefreshDjangoJwt();
      if (!cancelled && ok) {
        notifyDjangoJwtRestored();
        onConnected?.();
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [onConnected]);

  const handleConnect = async () => {
    if (!phone) {
      setError('Profilda telefon raqam yo‘q. Chiqib, login sahifasida telefon bilan kiring.');
      return;
    }
    if (!password.trim()) {
      setError('Parolni kiriting (login dagi parol).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pair = await obtainDjangoJwt(phone, password.trim());
      if (!pair?.access) {
        setError(
          'JWT olinmadi. Django da shu telefon va parol borligini tekshiring (masalan ensure_role_users).'
        );
        return;
      }
      notifyDjangoJwtRestored();
      onConnected?.();
    } catch {
      setError('Server bilan bog‘lanishda xatolik. Internet va API manzilini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  if (checking || hasDjangoJwt()) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const defaultDesc =
    'Tizim ikki qadamda ishlaydi: Firebase (kirish) va Django REST API (mahsulotlar, buyurtmalar, moliya). Hozir Firebase sessiyasi bor, lekin API kaliti (JWT) yo‘q yoki muddati tugagan. Quyida login parolingizni qayta kiriting — chiqish shart emas.';

  return (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="flex justify-center mb-4">
        <ShieldCheck className="h-12 w-12 text-amber-500" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">{title}</h2>
      <p className="text-sm text-slate-600 text-center mb-6">{description ?? defaultDesc}</p>

      {phone ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <Input value={phone} readOnly className="bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
            <Input
              type="password"
              placeholder="Login paroli"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleConnect()}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            variant="primary"
            className="w-full"
            disabled={loading}
            onClick={() => void handleConnect()}
          >
            {loading ? 'Ulanmoqda…' : 'API ga ulanish'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-red-600 text-center">{error || 'Telefon topilmadi.'}</p>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-center text-sm">
        <Link to="/login" className="text-emerald-700 hover:underline text-center">
          Login sahifasiga
        </Link>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-800 text-center"
          onClick={() => void logout()}
        >
          Butunlay chiqish
        </button>
      </div>
    </Card>
  );
}
