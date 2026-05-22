/**
 * Demo seed — faqat Django admin / API orqali ma’lumot kiritiladi.
 */
import type { Category, Brand, Product } from '../types';

export async function hasExistingData(): Promise<boolean> {
  return false;
}

export async function seedCategories(): Promise<Category[]> {
  return [];
}

export async function seedBrand(): Promise<Brand> {
  throw new Error('seedBrand o‘chirilgan: brendni tizimda qo‘lda yarating.');
}

export async function seedProducts(_categories: Category[], _brand: Brand): Promise<Product[]> {
  return [];
}

export async function seedAllDemoData(): Promise<null> {
  return null;
}
