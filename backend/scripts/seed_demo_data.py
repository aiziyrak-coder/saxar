#!/usr/bin/env python
"""
Demo data seeding script for Sahar ERP.
Creates 10 categories, 1 brand (Sahar), and 10 products related to sausages and smoked meats.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from inventory.models import Category, Brand, Product


def seed_categories():
    """Create 10 categories for sausage and meat products."""
    categories_data = [
        {"name": "Doktorskaya kolbasa", "description": "Doktor stili kolbasalari - yumshoq va nafis", "sort_order": 1},
        {"name": "Servelat", "description": "Servelat kolbasalari - qattiqroq tuzilma", "sort_order": 2},
        {"name": "Salami", "description": "Salami va quruq kolbasalar", "sort_order": 3},
        {"name": "Sosiska mol go'shtli", "description": "Mol go'shtidan tayyorlangan sosiskalar", "sort_order": 4},
        {"name": "Sosiska tovuq go'shtli", "description": "Tovuq go'shtidan tayyorlangan sosiskalar", "sort_order": 5},
        {"name": "Dudlangan kolbasa", "description": "Dudlangan kolbasalar - alohida ta'm", "sort_order": 6},
        {"name": "Qaynatma kolbasa", "description": "Qaynatma kolbasalar - an'anaviy usulda", "sort_order": 7},
        {"name": "Pishirilgan kolbasa", "description": "Pishirilgan kolbasalar", "sort_order": 8},
        {"name": "Qo'y go'shtli kolbasa", "description": "Qo'y go'shtidan tayyorlangan kolbasalar", "sort_order": 9},
        {"name": "Mol go'shtli kolbasa", "description": "Mol go'shtidan tayyorlangan kolbasalar", "sort_order": 10},
    ]
    
    categories = []
    for data in categories_data:
        cat, created = Category.objects.get_or_create(
            name=data["name"],
            defaults={
                "description": data["description"],
                "sort_order": data["sort_order"],
                "is_active": True
            }
        )
        categories.append(cat)
        if created:
            print(f"Created category: {cat.name}")
        else:
            print(f"Category already exists: {cat.name}")
    
    return categories


def seed_brand():
    """Create the main Sahar brand."""
    brand, created = Brand.objects.get_or_create(
        name="Sahar",
        defaults={
            "description": "O'zbekistonda eng sifatli go'sht va kolbasa mahsulotlari ishlab chiqaruvchi",
            "is_active": True
        }
    )
    
    if created:
        print(f"Created brand: {brand.name}")
    else:
        print(f"Brand already exists: {brand.name}")
    
    return brand


def seed_products(categories, brand):
    """Create 10 products under Sahar brand."""
    products_data = [
        {
            "name": "Sahar Doktorskaya",
            "sku": "SAH-DOK-001",
            "description": "Doktor stili kolbasa - yumshoq, nafis ta'm",
            "category": categories[0],
            "base_price": 85000,
            "b2b_price": 78000,
            "cost_price": 55000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Servelat",
            "sku": "SAH-SRV-001",
            "description": "Servelat kolbasa - qattiqroq tuzilma, ajoyib ta'm",
            "category": categories[1],
            "base_price": 92000,
            "b2b_price": 85000,
            "cost_price": 60000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Salami",
            "sku": "SAH-SAL-001",
            "description": "Salami kolbasa - quruq, mustahkam ta'm",
            "category": categories[2],
            "base_price": 98000,
            "b2b_price": 90000,
            "cost_price": 65000,
            "weight": 0.5,
        },
        {
            "name": "Sahar Sosiska Mol",
            "sku": "SAH-SSM-001",
            "description": "Mol go'shtidan sosiska - bolalar sevadi",
            "category": categories[3],
            "base_price": 45000,
            "b2b_price": 40000,
            "cost_price": 28000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Sosiska Tovuq",
            "sku": "SAH-SST-001",
            "description": "Tovuq go'shtidan sosiska - yengil va foydali",
            "category": categories[4],
            "base_price": 38000,
            "b2b_price": 34000,
            "cost_price": 24000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Dudlangan",
            "sku": "SAH-DUD-001",
            "description": "Dudlangan kolbasa - alohida, boy ta'm",
            "category": categories[5],
            "base_price": 105000,
            "b2b_price": 96000,
            "cost_price": 70000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Qaynatma",
            "sku": "SAH-QAY-001",
            "description": "Qaynatma kolbasa - an'anaviy usulda tayyorlangan",
            "category": categories[6],
            "base_price": 78000,
            "b2b_price": 72000,
            "cost_price": 50000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Pishirilgan",
            "sku": "SAH-PIS-001",
            "description": "Pishirilgan kolbasa - tayyor iste'mol uchun",
            "category": categories[7],
            "base_price": 82000,
            "b2b_price": 75000,
            "cost_price": 52000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Qo'y Go'shtli",
            "sku": "SAH-QOY-001",
            "description": "Qo'y go'shtidan kolbasa - o'ziga xos ta'm",
            "category": categories[8],
            "base_price": 110000,
            "b2b_price": 100000,
            "cost_price": 72000,
            "weight": 1.0,
        },
        {
            "name": "Sahar Mol Go'shtli",
            "sku": "SAH-MOL-001",
            "description": "Mol go'shtidan kolbasa - sifat kafolati",
            "category": categories[9],
            "base_price": 95000,
            "b2b_price": 87000,
            "cost_price": 62000,
            "weight": 1.0,
        },
    ]
    
    products = []
    for data in products_data:
        product, created = Product.objects.get_or_create(
            sku=data["sku"],
            defaults={
                "name": data["name"],
                "description": data["description"],
                "category": data["category"],
                "brand": brand,
                "base_price": data["base_price"],
                "b2b_price": data["b2b_price"],
                "cost_price": data["cost_price"],
                "weight": data["weight"],
                "unit": "kg",
                "min_stock": 10,
                "max_stock": 1000,
                "is_active": True,
                "is_b2b_active": True,
            }
        )
        products.append(product)
        if created:
            print(f"Created product: {product.name}")
        else:
            print(f"Product already exists: {product.name}")
    
    return products


def main():
    print("=" * 60)
    print("Seeding demo data for Sahar ERP")
    print("=" * 60)
    
    # Seed categories
    print("\n--- Seeding Categories ---")
    categories = seed_categories()
    
    # Seed brand
    print("\n--- Seeding Brand ---")
    brand = seed_brand()
    
    # Seed products
    print("\n--- Seeding Products ---")
    products = seed_products(categories, brand)
    
    print("\n" + "=" * 60)
    print("Demo data seeding completed!")
    print(f"- Categories: {len(categories)}")
    print(f"- Brands: 1 ({brand.name})")
    print(f"- Products: {len(products)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
