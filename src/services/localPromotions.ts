import type { Promotion } from '../types';

const KEY = 'saxar_promotions_v1';

function read(): Promotion[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Promotion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Promotion[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function listPromotions(): Promotion[] {
  return read().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function createPromotion(data: Omit<Promotion, 'id'>): Promise<Promotion> {
  const item: Promotion = { ...data, id: `promo_${Date.now()}` };
  write([item, ...read()]);
  return item;
}

export async function updatePromotion(id: string, data: Partial<Promotion>): Promise<boolean> {
  const list = read();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
  write(list);
  return true;
}

export async function deletePromotion(id: string): Promise<boolean> {
  const next = read().filter((p) => p.id !== id);
  if (next.length === read().length) return false;
  write(next);
  return true;
}
