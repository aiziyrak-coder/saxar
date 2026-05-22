import type { ApiInventoryBatchRow } from '../services/api';
import type { InventoryItem, Product } from '../types';

export function mapApiBatchToInventoryItem(
  row: ApiInventoryBatchRow,
  productById?: Map<string, Product>
): InventoryItem {
  const productId = String(row.product);
  const product = productById?.get(productId);
  const status = String(row.status || 'available').toLowerCase();
  const allowed: InventoryItem['status'][] = ['available', 'reserved', 'expired', 'damaged'];
  return {
    id: String(row.id),
    productId,
    productName: row.product_name || product?.name || '',
    sku: product?.sku || '',
    batchNumber: String(row.batch_number ?? ''),
    quantity: Number(row.quantity ?? 0),
    unit: product?.unit || 'kg',
    expiryDate: String(row.expiry_date ?? ''),
    manufactureDate: String(row.manufacture_date ?? ''),
    location: String(row.location ?? ''),
    status: (allowed.includes(status as InventoryItem['status'])
      ? status
      : 'available') as InventoryItem['status'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function generateBatchNumber(productId: string): string {
  const tail = Date.now().toString(36).slice(-6).toUpperCase();
  return `B-${productId}-${tail}`;
}
