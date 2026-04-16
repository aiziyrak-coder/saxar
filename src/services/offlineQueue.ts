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
  const queue = getQueue().filter(i => i.id !== id);
  setQueue(queue);
}

export function clearProcessed(processedIds: string[]): void {
  const set = new Set(processedIds);
  const queue = getQueue().filter(i => !set.has(i.id));
  setQueue(queue);
}

/** Sync queued items to Firestore when online. Call from app when online. */
export async function processQueue(): Promise<{ synced: number; failed: string[] }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, failed: [] };
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: [] };

  const { orderService, agentCheckInService, paymentService } = await import('./firestore');
  const processed: string[] = [];
  const failed: string[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'order') {
        await orderService.create(item.payload as any);
        processed.push(item.id);
      } else if (item.type === 'check_in') {
        await agentCheckInService.create(item.payload as any);
        processed.push(item.id);
      } else if (item.type === 'payment') {
        await paymentService.create(item.payload as any);
        processed.push(item.id);
      }
    } catch (e) {
      console.error('Offline queue item failed', item.id, e);
      failed.push(item.id);
    }
  }

  clearProcessed(processed);
  return { synced: processed.length, failed };
}
