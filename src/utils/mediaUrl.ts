import { coerceBrowserFetchUrl } from '../services/api';

/**
 * DB/API dagi rasm manzilini saqlash uchun — har doim `/media/...` ko‘rinishi.
 * `https://api/media/...` (nginx ichki Host) va `uploads/...` ni ham tuzatadi.
 */
export function normalizeMediaPath(url: string | undefined | null): string {
  if (!url) return '';
  let t = url.trim();
  if (!t) return '';

  if (/^https?:\/\//i.test(t)) {
    t = coerceBrowserFetchUrl(t);
    try {
      const u = new URL(t);
      t = `${u.pathname}${u.search}`;
    } catch {
      return '';
    }
  }

  if (t.startsWith('media/')) {
    t = `/${t}`;
  } else if (t.startsWith('uploads/')) {
    t = `/media/${t}`;
  } else if (!t.startsWith('/')) {
    t = `/media/${t.replace(/^\/+/, '')}`;
  }

  return t;
}

/** DB yoki API dan kelgan rasm yo‘lini brauzerda ochish uchun */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const raw = url.trim();
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }

  const path = normalizeMediaPath(raw);
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    return coerceBrowserFetchUrl(path);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  return path;
}
