const KEY = 'saxar_recent_routes';
const MAX = 8;

export interface RecentRoute {
  path: string;
  title: string;
  at: string;
}

function read(): RecentRoute[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentRoute[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: RecentRoute[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* */
  }
}

import { ROLE_HOME_PATHS } from '../constants/roles';

export function pushRecentRoute(path: string, title: string): void {
  if (!path.startsWith(ROLE_HOME_PATHS.admin)) return;
  const list = read().filter((r) => r.path !== path);
  write([{ path, title, at: new Date().toISOString() }, ...list].slice(0, MAX));
}

export function getRecentRoutes(): RecentRoute[] {
  return read();
}

export function clearRecentRoutes(): void {
  localStorage.removeItem(KEY);
}
