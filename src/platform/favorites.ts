const KEY = 'saxar_favorite_routes';

export function getFavoritePaths(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleFavoritePath(path: string): boolean {
  const cur = getFavoritePaths();
  const has = cur.includes(path);
  const next = has ? cur.filter((p) => p !== path) : [...cur, path];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* */
  }
  window.dispatchEvent(new CustomEvent('saxar:favorites'));
  return !has;
}

export function isFavoritePath(path: string): boolean {
  return getFavoritePaths().includes(path);
}
