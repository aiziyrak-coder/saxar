import { useEffect, useState } from 'react';
import {
  listNotifications,
  markAllNotificationsRead,
  clearNotifications,
  unreadNotificationCount,
  type InAppNotification,
} from '../../platform/notifications';
import { Button } from '../ui/Button';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [items, setItems] = useState<InAppNotification[]>([]);

  const refresh = () => setItems(listNotifications());

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener('saxar:notifications', on);
    return () => window.removeEventListener('saxar:notifications', on);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end" role="dialog" aria-label="Bildirishnomalar">
      <button type="button" className="absolute inset-0 bg-black/20" aria-label="Yopish" onClick={onClose} />
      <div className="relative m-4 w-full max-w-md rounded-2xl border border-emerald-200/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bildirishnomalar</h2>
          <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={onClose}>
            Yopish
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <Button type="button" variant="outline" size="sm" onClick={() => { markAllNotificationsRead(); refresh(); }}>
            Hammasini o‘qilgan
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { clearNotifications(); refresh(); }}>
            Tozalash
          </Button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto space-y-2">
          {items.length === 0 && <li className="text-sm text-slate-500 py-6 text-center">Hozircha yozuv yo‘q</li>}
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                n.read ? 'border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50' : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/30'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
              <div className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">{n.body}</div>
              <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function useUnreadNotificationCount(): number {
  const [n, setN] = useState(() => unreadNotificationCount());
  useEffect(() => {
    const on = () => setN(unreadNotificationCount());
    window.addEventListener('saxar:notifications', on);
    return () => window.removeEventListener('saxar:notifications', on);
  }, []);
  return n;
}
