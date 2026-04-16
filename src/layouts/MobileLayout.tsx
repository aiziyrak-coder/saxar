import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Wallet, User, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { processQueue } from '../services/offlineQueue';
import { logger } from '../services/logger';

export default function MobileLayout({ role }: { role: 'agent' | 'driver' }) {
  const location = useLocation();
  const { userData } = useAuth();

  useEffect(() => {
    const sync = () =>
      processQueue().then(({ synced }) => {
        if (synced > 0) logger.info('Offline navbat sinxronlandi', { synced });
      });
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
  
  const navItems = role === 'agent' ? [
    { path: '/agent/dashboard', icon: Home, label: 'Asosiy' },
    { path: '/agent/shops', icon: MapPin, label: 'Do\'konlar' },
    { path: '/agent/finance', icon: Wallet, label: 'Kassa' },
    { path: '/agent/profile', icon: User, label: 'Profil' },
  ] : [
    { path: '/driver/dashboard', icon: Home, label: 'Marshrut' },
    { path: '/driver/inventory', icon: Package, label: 'Yuklar' },
    { path: '/driver/finance', icon: Wallet, label: 'Pul yig\'ish' },
    { path: '/driver/profile', icon: User, label: 'Profil' },
  ];

  const getInitials = (name: string, role: string) => {
    if (!name) return role === 'agent' ? 'AG' : 'DR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900">
      {/* Mobile App Container */}
      <div className="w-full min-h-screen bg-white/75 shadow-[0_20px_80px_rgba(16,185,129,0.16)] border border-emerald-200/60 rounded-none relative flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <header className="bg-white/70 text-slate-900 p-4 sticky top-0 z-50 border-b border-emerald-200/60 backdrop-blur-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">
              {role === 'agent' ? 'Saxar Agent (distributor)' : 'Saxar Logistika (dastavkachi)'}
            </h1>
            <div className="h-8 w-8 bg-emerald-500/15 rounded-full flex items-center justify-center font-bold text-sm border border-emerald-200/60">
              {getInitials(userData?.name || '', role)}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 px-4 pt-0">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white/70 border-t border-emerald-200/60 fixed bottom-0 left-0 w-full flex justify-around items-center h-16 pb-safe z-50 backdrop-blur-2xl rounded-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-6 w-6 ${isActive ? 'fill-emerald-600/10' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
