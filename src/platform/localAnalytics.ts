const KEY = 'saxar_local_page_hits';

export function recordPageView(path: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const map = (raw ? (JSON.parse(raw) as Record<string, number>) : {}) || {};
    map[path] = (map[path] || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* */
  }
}

export function getPageViewStats(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, number>;
    return map && typeof map === 'object' ? map : {};
  } catch {
    return {};
  }
}

export function clearPageViewStats(): void {
  localStorage.removeItem(KEY);
}
