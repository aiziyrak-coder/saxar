/** DB yoki API dan kelgan rasm yo‘lini brauzerda ochish uchun */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const t = url.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t) || t.startsWith('data:') || t.startsWith('blob:')) {
    return t;
  }
  if (t.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${t}`;
    }
    return t;
  }
  return t;
}
