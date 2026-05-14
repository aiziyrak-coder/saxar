/** Ichki SKU: lotin, raqam, tire — bo‘sh joylarni olib tashlash */
export function normalizeSku(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '-');
}

/** Yangi SKU taklifi (frontend yordamchi; server yakuniy tasdiqlaydi) */
export function suggestSkuFromName(name: string, categoryCode = 'GEN'): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
  const tail = Date.now().toString(36).toUpperCase().slice(-4);
  return `${categoryCode}-${slug || 'SKU'}-${tail}`;
}
