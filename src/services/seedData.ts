/**
 * Demo mahsulotlar va namuna Firestore yuklari olib tashlangan.
 * Ma’lumotlar faqat admin / integratsiya orqali kiritiladi.
 */
import type { Category, Brand, Product } from '../types';
import { tryGetFirebaseDb } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export async function hasExistingData(): Promise<boolean> {
  const db = tryGetFirebaseDb();
  if (!db) return false;
  try {
    const q = query(collection(db, 'categories'), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
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
