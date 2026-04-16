from django.db import models
from inventory.models import Product


class ProductionBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    planned_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)

