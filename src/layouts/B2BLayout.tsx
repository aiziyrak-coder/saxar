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
              <Link
                to="/b2b/cart"
                className={`hidden md:inline-flex relative rounded-full p-2 transition-colors ${
                  location.pathname.includes('/cart')
                    ? 'text-emerald-700 ring-2 ring-emerald-400/50 bg-emerald-50/80'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
                aria-current={location.pathname.includes('/cart') ? 'page' : undefined}
              >
                <ShoppingCart className="h-6 w-6" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[10px] font-bold text-white">
                    {totalCount > 9 ? '9+' : totalCount}
                  </span>
                )}
              </Link>
              <Link to="/b2b/profile" className="p-2 text-slate-600 hover:text-emerald-700 transition-colors">
                <User className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Suzuvchi savatcha — kichik dumaloq FAB */}
      <Link
        to="/b2b/cart"
        title="Savatcha"
        aria-label="Savatcha"
        aria-current={location.pathname.includes('/cart') ? 'page' : undefined}
        className={`fixed z-[100] relative flex h-12 w-12 items-center justify-center rounded-full
                   border bg-white/90 text-emerald-700 shadow-lg backdrop-blur-md
                   transition-transform hover:scale-105 hover:bg-white hover:shadow-xl
                   active:scale-95
                   bottom-[max(1rem,env(safe-area-inset-bottom,0px))]
                   right-[max(1rem,env(safe-area-inset-right,0px))]
                   ${
                     location.pathname.includes('/cart')
                       ? 'border-emerald-500 ring-2 ring-emerald-400/60'
                       : 'border-emerald-300/80'
                   }`}
      >
        <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
        {totalCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-0.5 text-[10px] font-bold text-white shadow-sm"
            aria-label={`${totalCount} ta mahsulot`}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </Link>
      <main className="flex-1 relative z-10 w-full overflow-y-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
