import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';

export default function B2BLayout() {
  const location = useLocation();
  const { userData } = useAuth();
  const { totalCount } = useCart(userData?.uid);

  return (
    <div className="min-h-screen bg-emerald-50 relative overflow-hidden text-slate-900 flex flex-col">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-10%] h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
      </div>
      <header className="bg-white/60 backdrop-blur-2xl border-b border-emerald-200/60 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <Package className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-semibold text-slate-900 tracking-tight">Saxar ERP — B2B</span>
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm">
              <Link to="/b2b/catalog" className={`font-medium ${location.pathname.includes('catalog') ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-700'}`}>Katalog</Link>
              <Link to="/b2b/orders" className={`font-medium ${location.pathname.includes('orders') ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-700'}`}>Buyurtmalar</Link>
              <Link to="/b2b/finance" className={`font-medium ${location.pathname.includes('finance') ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-700'}`}>Akt Sverka</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link to="/b2b/cart" className="hidden md:inline-flex relative p-2 text-slate-600 hover:text-emerald-700 transition-colors">
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <Link to="/b2b/profile" className="p-2 text-slate-600 hover:text-emerald-700 transition-colors">
                <User className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Floating Savatcha (scroll paytida ham ko'rinadi) */}
      <Link
        to="/b2b/cart"
        className="fixed bottom-24 sm:bottom-6 right-4 z-60 relative flex items-center justify-center gap-2
                   w-12 h-12 sm:w-auto sm:px-4 rounded-2xl bg-white/70 backdrop-blur-2xl
                   border border-emerald-200/60 shadow-[0_18px_60px_rgba(16,185,129,0.12)]
                   hover:bg-white transition-colors"
        aria-label="Savatcha"
      >
        <ShoppingCart className="h-6 w-6 text-emerald-700" />
        <span className="hidden sm:inline text-sm font-semibold text-slate-900">Savatcha</span>
        {totalCount > 0 && (
          <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold
                           flex items-center justify-center border-2 border-white/80">
            {totalCount}
          </span>
        )}
      </Link>
      <main className="flex-1 relative z-10 w-full overflow-y-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
