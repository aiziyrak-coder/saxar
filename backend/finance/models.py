from django.db import models
from django.conf import settings
from sales.models import Order


class Payment(models.Model):
  TYPE_CHOICES = [
      ("cash", "Naqd"),
      ("card", "Karta/Terminal"),
      ("transfer", "O‘tkazma"),
  ]
  type = models.CharField(max_length=20, choices=TYPE_CHOICES)
  amount = models.DecimalField(max_digits=14, decimal_places=2)
  currency = models.CharField(max_length=8, default="UZS")
  order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments", null=True, blank=True)
  client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments")
  description = models.CharField(max_length=255, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)


class Expense(models.Model):
  category = models.CharField(max_length=100)
  amount = models.DecimalField(max_digits=14, decimal_places=2)
  description = models.CharField(max_length=255, blank=True)
  date = models.DateField()
  created_at = models.DateTimeField(auto_now_add=True)

