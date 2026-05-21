import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME_PATHS } from '../constants/roles';
import type { UserRole } from '../types';

/** Noma’lum URL — foydalanuvchini o‘z rol bosh sahifasiga yuboradi. */
export default function NotFoundRedirect() {
  const { userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Yuklanmoqda…
      </div>
    );
  }

  const role = (userData?.role || 'b2b') as UserRole;
  const home = ROLE_HOME_PATHS[role] || '/';
  if (location.pathname === home) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-800">Sahifa topilmadi</h1>
        <p className="text-sm text-slate-500">So‘ralgan manzil mavjud emas.</p>
      </div>
    );
  }

  return <Navigate to={home} replace />;
}
