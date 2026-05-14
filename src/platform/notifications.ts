const KEY = 'saxar_in_app_notifications';
const MAX = 50;

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

function read(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InAppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: InAppNotification[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

export function listNotifications(): InAppNotification[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function unreadNotificationCount(): number {
  return read().filter((n) => !n.read).length;
}

export function addNotification(title: string, body: string): void {
  const n: InAppNotification = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  };
  write([n, ...read()]);
  window.dispatchEvent(new CustomEvent('saxar:notifications'));
}

export function markAllNotificationsRead(): void {
  write(read().map((n) => ({ ...n, read: true })));
  window.dispatchEvent(new CustomEvent('saxar:notifications'));
}

export function clearNotifications(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('saxar:notifications'));
}

/** Hali backendga ulanmagan tugmalar uchun bir xil foydalanuvchi xabari */
export function notifyPlannedFeature(title: string, detail?: string): void {
  addNotification(
    title,
    detail ?? 'Bu funksiya hozircha demo rejimida. Keyingi yangilanishda to‘liq ishlaydi.'
  );
}
