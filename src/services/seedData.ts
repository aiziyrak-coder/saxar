import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { Category, Brand, Product } from '../types';

const CATEGORIES_COLLECTION = 'categories';
const BRANDS_COLLECTION = 'brands';
const PRODUCTS_COLLECTION = 'products';

// Demo Categories - 10 sausage and meat categories
const demoCategories: Omit<Category, 'id'>[] = [
  {
    name: "Doktorskaya kolbasa",
    description: "Doktor stili kolbasalari - yumshoq va nafis",
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Servelat",
    description: "Servelat kolbasalari - qattiqroq tuzilma",
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Salami",
    description: "Salami va quruq kolbasalar",
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Sosiska mol go'shtli",
    description: "Mol go'shtidan tayyorlangan sosiskalar",
    sortOrder: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Sosiska tovuq go'shtli",
    description: "Tovuq go'shtidan tayyorlangan sosiskalar",
    sortOrder: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Dudlangan kolbasa",
    description: "Dudlangan kolbasalar - alohida ta'm",
    sortOrder: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Qaynatma kolbasa",
    description: "Qaynatma kolbasalar - an'anaviy usulda",
    sortOrder: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Pishirilgan kolbasa",
    description: "Pishirilgan kolbasalar",
    sortOrder: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Qo'y go'shtli kolbasa",
    description: "Qo'y go'shtidan tayyorlangan kolbasalar",
    sortOrder: 9,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    name: "Mol go'shtli kolbasa",
    description: "Mol go'shtidan tayyorlangan kolbasalar",
    sortOrder: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Demo Brand - Saxar
const demoBrand: Omit<Brand, 'id'> = {
  name: "Saxar",
  description: "O'zbekistonda eng sifatli go'sht va kolbasa mahsulotlari ishlab chiqaruvchi",
  isActive: true,
  createdAt: new Date().toISOString(),
};

// Demo Products - 10 products under Saxar brand
const demoProducts: Omit<Product, 'id' | 'categoryId' | 'categoryName' | 'brandId' | 'brandName'>[] = [
  {
    name: "Saxar Doktorskaya",
    description: "Doktor stili kolbasa - yumshoq, nafis ta'm",
    sku: "SAH-DOK-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 85000,
    b2bPrice: 78000,
    costPrice: 55000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Servelat",
    description: "Servelat kolbasa - qattiqroq tuzilma, ajoyib ta'm",
    sku: "SAH-SRV-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 92000,
    b2bPrice: 85000,
    costPrice: 60000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Salami",
    description: "Salami kolbasa - quruq, mustahkam ta'm",
    sku: "SAH-SAL-001",
    unit: "kg",
    weight: 0.5,
    images: [],
    basePrice: 98000,
    b2bPrice: 90000,
    costPrice: 65000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Sosiska Mol",
    description: "Mol go'shtidan sosiska - bolalar sevadi",
    sku: "SAH-SSM-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 45000,
    b2bPrice: 40000,
    costPrice: 28000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Sosiska Tovuq",
    description: "Tovuq go'shtidan sosiska - yengil va foydali",
    sku: "SAH-SST-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 38000,
    b2bPrice: 34000,
    costPrice: 24000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Dudlangan",
    description: "Dudlangan kolbasa - alohida, boy ta'm",
    sku: "SAH-DUD-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 105000,
    b2bPrice: 96000,
    costPrice: 70000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Qaynatma",
    description: "Qaynatma kolbasa - an'anaviy usulda tayyorlangan",
    sku: "SAH-QAY-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 78000,
    b2bPrice: 72000,
    costPrice: 50000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Pishirilgan",
    description: "Pishirilgan kolbasa - tayyor iste'mol uchun",
    sku: "SAH-PIS-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 82000,
    b2bPrice: 75000,
    costPrice: 52000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Qo'y Go'shtli",
    description: "Qo'y go'shtidan kolbasa - o'ziga xos ta'm",
    sku: "SAH-QOY-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 110000,
    b2bPrice: 100000,
    costPrice: 72000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Saxar Mol Go'shtli",
    description: "Mol go'shtidan kolbasa - sifat kafolati",
    sku: "SAH-MOL-001",
    unit: "kg",
    weight: 1,
    images: [],
    basePrice: 95000,
    b2bPrice: 87000,
    costPrice: 62000,
    minStock: 10,
    maxStock: 1000,
    isActive: true,
    isB2BActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Check if data already exists in Firestore
 */
export async function hasExistingData(): Promise<boolean> {
  try {
    const categoriesQuery = query(collection(getFirebaseDb(), CATEGORIES_COLLECTION), limit(1));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    return !categoriesSnapshot.empty;
  } catch (error) {
    console.error('Error checking existing data:', error);
    return false;
  }
}

/**
 * Seed categories to Firestore
 */
export async function seedCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  
  for (const catData of demoCategories) {
    const docRef = doc(collection(getFirebaseDb(), CATEGORIES_COLLECTION));
    const category: Category = {
      ...catData,
      id: docRef.id,
    };
    await setDoc(docRef, category);
    categories.push(category);
    console.log(`Seeded category: ${category.name}`);
  }
  
  return categories;
}

/**
 * Seed brand to Firestore
 */
export async function seedBrand(): Promise<Brand> {
  const docRef = doc(collection(getFirebaseDb(), BRANDS_COLLECTION));
  const brand: Brand = {
    ...demoBrand,
    id: docRef.id,
  };
  await setDoc(docRef, brand);
  console.log(`Seeded brand: ${brand.name}`);
  return brand;
}

/**
 * Seed products to Firestore
 */
export async function seedProducts(categories: Category[], brand: Brand): Promise<Product[]> {
  const products: Product[] = [];
  
  for (let i = 0; i < demoProducts.length; i++) {
    const prodData = demoProducts[i];
    const category = categories[i % categories.length];
    
    const docRef = doc(collection(getFirebaseDb(), PRODUCTS_COLLECTION));
    const product: Product = {
      ...prodData,
      id: docRef.id,
      categoryId: category.id,
      categoryName: category.name,
      brandId: brand.id,
      brandName: brand.name,
    };
    await setDoc(docRef, product);
    products.push(product);
    console.log(`Seeded product: ${product.name}`);
  }
  
  return products;
}

/**
 * Seed all demo data to Firestore
 */
export async function seedAllDemoData(): Promise<{ categories: Category[]; brand: Brand; products: Product[] } | null> {
  try {
    // Check if data already exists
    const hasData = await hasExistingData();
    if (hasData) {
      console.log('Demo data already exists in Firestore. Skipping seed.');
      return null;
    }

    console.log('Starting demo data seeding...');
    
    // Seed categories
    const categories = await seedCategories();
    
    // Seed brand
    const brand = await seedBrand();
    
    // Seed products
    const products = await seedProducts(categories, brand);
    
    console.log('Demo data seeding completed!');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Brands: 1 (${brand.name})`);
    console.log(`- Products: ${products.length}`);
    
    return { categories, brand, products };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return null;
  }
}
