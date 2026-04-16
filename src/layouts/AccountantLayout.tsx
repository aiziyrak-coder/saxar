import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, FileText, Receipt, Users, LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/accountant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/accountant/finance', icon: Wallet, label: 'Kassa & Bank' },
  { path: '/accountant/akt-sverka', icon: FileText, label: 'Akt sverka' },
  { path: '/accountant/expenses', icon: Receipt, label: 'Xarajatlar' },
  { path: '/accountant/payroll', icon: Users, label: 'Ish haqi' },
];

export default function AccountantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex relative overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-10%] h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
      </div>
      <aside className={`bg-white/70 backdrop-blur-2xl text-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col fixed h-full z-40 shadow-[0_18px_60px_rgba(16,185,129,0.08)] border-r border-emerald-200/60`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-200/60">
          {sidebarOpen && <span className="text-xl font-bold truncate tracking-tight">Saxar ERP — Moliya</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-600 hover:text-slate-900 transition-colors">
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-500/10 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-emerald-200/60">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 hover:bg-emerald-500/10 hover:text-slate-900 w-full transition-colors text-left">
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Chiqish</span>}
          </button>
        </div>
      </aside>
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 bg-white/60 backdrop-blur-2xl border-b border-emerald-200/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_10px_40px_rgba(16,185,129,0.10)]">
          <h1 className="text-xl font-semibold text-slate-900">
            {navItems.find(i => i.path === location.pathname)?.label || 'Buxgalteriya'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-slate-900 relative transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm border border-emerald-500/20">
              {getInitials(userData?.name || '')}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
