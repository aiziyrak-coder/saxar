/**
 * Data synchronization service between Frontend (Firestore) and Backend (Django API)
 * Ensures data consistency across both systems
 */

import { API_BASE_URL, coerceBrowserFetchUrl } from './api';
import { logger } from './logger';

interface SyncConfig {
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

const defaultConfig: SyncConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
};

class SyncService {
  private config: SyncConfig;
  private syncQueue: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    collection: string;
    data: unknown;
    timestamp: number;
    attempts: number;
  }> = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startSyncWorker();
  }

  private startSyncWorker(): void {
    // Process sync queue every 5 seconds
    setInterval(() => {
      this.processSyncQueue();
    }, 5000);
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const items = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of items) {
      try {
        await this.syncToBackend(item);
      } catch (error) {
        if (item.attempts < this.config.retryAttempts) {
          // Re-queue for retry
          this.syncQueue.push({
            ...item,
            attempts: item.attempts + 1,
          });
        } else {
          logger.error(`Sync failed after ${this.config.retryAttempts} attempts`, error as Error, {
            operation: item.operation,
            collection: item.collection,
            id: item.id,
          });
        }
      }
    }
  }

  private async syncToBackend(item: typeof this.syncQueue[0]): Promise<void> {
    const base = API_BASE_URL.replace(/\/+$/, '');
    const endpoint = coerceBrowserFetchUrl(`${base}/${item.collection}/${item.id}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      let response: Response;

      switch (item.operation) {
        case 'create':
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
            signal: controller.signal,
          });
          break;
        case 'update':
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
            signal: controller.signal,
          });
          break;
        case 'delete':
          response = await fetch(endpoint, {
            method: 'DELETE',
            signal: controller.signal,
          });
          break;
        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info(`Sync successful: ${item.operation} ${item.collection}/${item.id}`);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Queue an item for sync
  queueSync(
    operation: 'create' | 'update' | 'delete',
    collection: string,
    id: string,
    data?: unknown
  ): void {
    this.syncQueue.push({
      id,
      operation,
      collection,
      data: data || {},
      timestamp: Date.now(),
      attempts: 0,
    });
  }

  // Immediate sync with retry
  async syncImmediately(
    operation: 'create' | 'update' | 'delete',
    collection: string,
    id: string,
    data?: unknown
  ): Promise<boolean> {
    let attempts = 0;

    while (attempts < this.config.retryAttempts) {
      try {
        await this.syncToBackend({
          id,
          operation,
          collection,
          data: data || {},
          timestamp: Date.now(),
          attempts,
        });
        return true;
      } catch (error) {
        attempts++;
        if (attempts < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempts);
        }
      }
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check for backend connectivity
  async checkBackendHealth(): Promise<boolean> {
    const base = API_BASE_URL.replace(/\/+$/, '');

    try {
      const response = await fetch(coerceBrowserFetchUrl(`${base}/health/`), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get sync queue status
  getQueueStatus(): { pending: number; failed: number } {
    return {
      pending: this.syncQueue.filter(i => i.attempts === 0).length,
      failed: this.syncQueue.filter(i => i.attempts > 0).length,
    };
  }
}

export const syncService = new SyncService();

// Data validation utilities
export const validators = {
  isValidEmail: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const re = /^\+?[\d\s-]{9,20}$/;
    return re.test(phone);
  },

  isValidINN: (inn: string): boolean => {
    // Uzbekistan INN: 9 digits
    return /^\d{9}$/.test(inn);
  },

  sanitizeString: (str: string): string => {
    return str.replace(/[<>]/g, '').trim();
  },
};
