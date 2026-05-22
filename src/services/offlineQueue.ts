/** Offlayn navbat — Firestore olib tashlangan; faqat mahalliy tozalash. */

const STORAGE_KEY = 'saxar_offline_queue';
const LEGACY_QUEUE_KEY = 'sahar_offline_queue';

export type QueuedItemType = 'order' | 'check_in' | 'payment';

export interface QueuedItem {
  id: string;
  type: QueuedItemType;
  payload: Record<string, unknown>;
  createdAt: string;
}

function getQueue(): QueuedItem[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_QUEUE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_QUEUE_KEY);
        raw = legacy;
      }
    }
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setQueue(items: QueuedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Offline queue save failed', e);
  }
}

export function addToQueue(type: QueuedItemType, payload: Record<string, unknown>): string {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const item: QueuedItem = { id, type, payload, createdAt: new Date().toISOString() };
  const queue = getQueue();
  queue.push(item);
  setQueue(queue);
  return id;
}

export function getQueuedItems(): QueuedItem[] {
  return getQueue();
}

export function removeFromQueue(id: string): void {
  setQueue(getQueue().filter((i) => i.id !== id));
}

export function clearProcessed(processedIds: string[]): void {
  const set = new Set(processedIds);
  setQueue(getQueue().filter((i) => !set.has(i.id)));
}

export async function processQueue(): Promise<{ synced: number; failed: string[] }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: [] };
  setQueue([]);
  return { synced: queue.length, failed: [] };
}
