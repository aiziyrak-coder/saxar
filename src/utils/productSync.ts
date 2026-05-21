import type { ApiProduct } from '../services/api';
import { productService } from '../services/firestore';
import { isFirebaseConfigured } from '../firebase';
import type { Product } from '../types';

export function mapApiProductToFirestore(p: ApiProduct): Product {
  const now = new Date().toISOString();
  return {
    id: String(p.id),
    name: p.name,
    description: p.description || '',
    categoryId: String(p.category),
    categoryName: p.category_name,
    brandId: p.brand != null && p.brand !== '' ? String(p.brand) : undefined,
    brandName: p.brand_name,
    sku: p.sku,
    barcode: p.barcode,
    unit: (p.unit || 'kg') as Product['unit'],
    weight: p.weight != null ? Number(p.weight) : undefined,
    images: p.image ? [p.image] : [],
    basePrice: Number(p.base_price),
    b2bPrice: Number(p.b2b_price),
    costPrice: Number(p.cost_price),
    minStock: Number(p.min_stock ?? 0),
    maxStock: Number(p.max_stock ?? 0),
    isActive: p.is_active,
    isB2BActive: p.is_b2b_active,
    createdAt: p.created_at || now,
    updatedAt: p.updated_at || now,
  };
}

/** Django mahsulotini WMS/ishlab chiqarish uchun Firestore ga sinxronlash. */
export async function syncProductToFirestore(p: ApiProduct): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const mapped = mapApiProductToFirestore(p);
  const { id, ...rest } = mapped;
  await productService.create(rest as Omit<Product, 'id'>, id);
}

export async function removeProductFromFirestore(id: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await productService.delete(id);
}
