"""
Tests for inventory module
"""
from django.test import TestCase
from decimal import Decimal
from .models import Category, Brand, Product, InventoryBatch


class CategoryModelTests(TestCase):
    """Test Category model"""

    def setUp(self):
        self.category = Category.objects.create(
            name='Test Category',
            description='Test description',
            sort_order=1
        )

    def test_category_creation(self):
        """Test category can be created"""
        self.assertEqual(self.category.name, 'Test Category')
        self.assertTrue(self.category.is_active)

    def test_category_str(self):
        """Test category string representation"""
        self.assertEqual(str(self.category), 'Test Category')

    def test_category_ordering(self):
        """Test categories are ordered by sort_order"""
        cat2 = Category.objects.create(name='Category 2', sort_order=0)
        categories = list(Category.objects.all())
        self.assertEqual(categories[0], cat2)
        self.assertEqual(categories[1], self.category)


class BrandModelTests(TestCase):
    """Test Brand model"""

    def setUp(self):
        self.brand = Brand.objects.create(
            name='Test Brand',
            description='Test brand description'
        )

    def test_brand_creation(self):
        """Test brand can be created"""
        self.assertEqual(self.brand.name, 'Test Brand')
        self.assertTrue(self.brand.is_active)


class ProductModelTests(TestCase):
    """Test Product model"""

    def setUp(self):
        self.category = Category.objects.create(name='Test Category')
        self.brand = Brand.objects.create(name='Test Brand')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            description='Test product description',
            category=self.category,
            brand=self.brand,
            base_price=Decimal('100.00'),
            b2b_price=Decimal('80.00'),
            cost_price=Decimal('50.00'),
            unit='kg',
            weight=Decimal('1.5'),
            min_stock=10,
            max_stock=1000,
        )

    def test_product_creation(self):
        """Test product can be created with all fields"""
        self.assertEqual(self.product.name, 'Test Product')
        self.assertEqual(self.product.sku, 'TEST-001')
        self.assertEqual(self.product.base_price, Decimal('100.00'))
        self.assertEqual(self.product.b2b_price, Decimal('80.00'))
        self.assertEqual(self.product.category, self.category)
        self.assertEqual(self.product.brand, self.brand)

    def test_product_str(self):
        """Test product string representation"""
        self.assertEqual(str(self.product), 'Test Product')

    def test_sku_uniqueness(self):
        """Test SKU must be unique"""
        with self.assertRaises(Exception):
            Product.objects.create(
                name='Another Product',
                sku='TEST-001',  # Same SKU
                category=self.category,
            )

    def test_product_is_active_default(self):
        """Test product is active by default"""
        self.assertTrue(self.product.is_active)
        self.assertTrue(self.product.is_b2b_active)


class InventoryBatchModelTests(TestCase):
    """Test InventoryBatch model"""

    def setUp(self):
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            category=self.category,
        )
        self.batch = InventoryBatch.objects.create(
            product=self.product,
            batch_number='BCH-001',
            quantity=Decimal('100.00'),
            expiry_date='2025-12-31',
            manufacture_date='2024-01-01',
            location='Warehouse A',
        )

    def test_batch_creation(self):
        """Test inventory batch can be created"""
        self.assertEqual(self.batch.product, self.product)
        self.assertEqual(self.batch.batch_number, 'BCH-001')
        self.assertEqual(self.batch.quantity, Decimal('100.00'))
