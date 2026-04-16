from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['sort_order', 'name']

    def __str__(self) -> str:
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=255)
    logo = models.URLField(blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, unique=True)
    barcode = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=16, default="kg")
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='products', null=True, blank=True)
    # Pricing
    base_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    b2b_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cost_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    # Inventory
    min_stock = models.PositiveIntegerField(default=0)
    max_stock = models.PositiveIntegerField(default=1000)
    # Flags
    is_active = models.BooleanField(default=True)
    is_b2b_active = models.BooleanField(default=True)
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class InventoryBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="batches")
    batch_number = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    expiry_date = models.DateField()
    manufacture_date = models.DateField()
    location = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default="available")  # available/depleted/expired
    created_at = models.DateTimeField(auto_now_add=True)


class InventoryTransaction(models.Model):
    TYPE_CHOICES = [
        ("in", "Kirim"),
        ("out", "Chiqim"),
        ("adjustment", "Inventarizatsiya"),
        ("transfer", "O‘tkazma"),
        ("return", "Vozvrat"),
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    batch = models.ForeignKey(InventoryBatch, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    order_id = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

