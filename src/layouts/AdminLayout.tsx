import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wallet,
  LogOut,
  Menu,
  BarChart3,
  Settings,
  Bell,
  ShoppingCart,
  Moon,
  Sun,
  Star,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pushRecentRoute, getRecentRoutes, clearRecentRoutes } from '../platform/recentRoutes';
import { isFavoritePath, toggleFavoritePath } from '../platform/favorites';
import { ApiHealthBadge } from '../components/platform/ApiHealthBadge';
import { NotificationPanel, useUnreadNotificationCount } from '../components/platform/NotificationPanel';
import { roleSubPath } from '../constants/roles';

const ADMIN_NAV: { path: string; icon: typeof LayoutDashboard; label: string }[] = [
  { path: roleSubPath('admin', 'dashboard'), icon: LayoutDashboard, label: 'Dashboard' },
  { path: roleSubPath('admin', 'production'), icon: Package, label: 'Ishlab chiqarish' },
  { path: roleSubPath('admin', 'orders'), icon: ShoppingCart, label: 'Buyurtmalar' },
  { path: roleSubPath('admin', 'clients'), icon: Users, label: 'Mijozlar' },
  { path: roleSubPath('admin', 'wms'), icon: Package, label: 'Ombor (WMS)' },
  { path: roleSubPath('admin', 'agents'), icon: Users, label: 'Agentlar' },
  { path: roleSubPath('admin', 'logistics'), icon: Truck, label: 'Logistika' },
  { path: roleSubPath('admin', 'finance'), icon: Wallet, label: 'Moliya & Buxgalteriya' },
  { path: roleSubPath('admin', 'reports'), icon: BarChart3, label: 'Hisobotlar' },
  { path: roleSubPath('admin', 'workspace'), icon: Sparkles, label: 'Platform (20+)' },
  { path: roleSubPath('admin', 'settings'), icon: Settings, label: 'Sozlamalar' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [favTick, setFavTick] = useState(0);
  const unread = useUnreadNotificationCount();

  useEffect(() => {
    const cur = ADMIN_NAV.find((i) => i.path === location.pathname);
    if (cur) pushRecentRoute(location.pathname, cur.label);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const recent = getRecentRoutes();

  return (
    <div className="min-h-screen bg-emerald-50 flex relative overflow-hidden text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-10%] h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-purple-300/30 blur-3xl dark:bg-purple-900/15" />
      </div>
      <aside
        className={`bg-white/70 backdrop-blur-2xl text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col fixed h-full z-40 shadow-[0_18px_60px_rgba(16,185,129,0.08)] border-r border-emerald-200/60 dark:border-slate-700`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-200/60 dark:border-slate-700">
          {sidebarOpen && (
            <span className="text-xl font-bold truncate tracking-tight">Saxar ERP — Admin</span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (location.pathname.startsWith(item.path + '/') && item.path !== '/admin');
            const fav = isFavoritePath(item.path);
            return (
              <div key={item.path} className="flex items-center gap-0.5">
                <Link
                  to={item.path}
                  className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 shadow-sm dark:text-emerald-300'
                      : 'text-slate-600 hover:bg-emerald-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
                </Link>
                {sidebarOpen && (
                  <button
                    type="button"
                    title={fav ? 'Sevimlidan olib tashlash' : 'Sevimlilar'}
                    className="shrink-0 p-2 rounded-lg text-amber-500 hover:bg-amber-500/10"
                    onClick={() => {
                      toggleFavoritePath(item.path);
                      setFavTick((x) => x + 1);
                    }}
                    aria-label="Sevimli"
                  >
                    <Star className={`h-4 w-4 ${fav ? 'fill-amber-400' : ''}`} />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
        {sidebarOpen && recent.length > 0 && (
          <div className="px-3 pb-2 border-t border-emerald-200/40 dark:border-slate-700 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">So‘nggi</span>
              <button
                type="button"
                className="text-[10px] text-slate-400 hover:text-slate-600"
                onClick={() => clearRecentRoutes()}
              >
                Tozalash
              </button>
            </div>
            <ul className="space-y-0.5 max-h-28 overflow-y-auto">
              {recent.slice(0, 5).map((r) => (
                <li key={r.path + r.at}>
                  <Link to={r.path} className="text-xs text-emerald-700 hover:underline dark:text-emerald-400 block truncate">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="p-4 border-t border-emerald-200/60 dark:border-slate-700">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 hover:bg-emerald-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 w-full transition-colors text-left"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Chiqish</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white/60 backdrop-blur-2xl border-b border-emerald-200/60 dark:bg-slate-900/60 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_10px_40px_rgba(16,185,129,0.10)]">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {ADMIN_NAV.find((i) => i.path === location.pathname)?.label || 'Boshqaruv Paneli'}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <ApiHealthBadge />
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-emerald-200/80 px-2 py-1 text-xs text-slate-600 hover:bg-emerald-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Ctrl+K"
              onClick={() => window.dispatchEvent(new CustomEvent('saxar:open-command-palette'))}
            >
              <Search className="h-3.5 w-3.5" />
              Ctrl+K
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:bg-emerald-500/10 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Mavzu"
              onClick={() => toggleTheme()}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 relative transition-colors"
              onClick={() => setNotifOpen(true)}
              aria-label="Bildirishnomalar"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <div className="h-8 w-8 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm border border-emerald-500/20 dark:text-emerald-300">
              {getInitials(userData?.name || 'Admin')}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      {/* favTick — sevimli yulduzchalarini yangilash */}
      <span className="hidden" aria-hidden>
        {favTick}
      </span>
    </div>
  );
}
