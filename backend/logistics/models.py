from django.db import models
from django.conf import settings
from sales.models import Order


class RouteSheet(models.Model):
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="route_sheets"
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)


class RouteItem(models.Model):
    route_sheet = models.ForeignKey(RouteSheet, on_delete=models.CASCADE, related_name="items")
    order = models.ForeignKey(Order, on_delete=models.PROTECT)
    sequence = models.PositiveIntegerField(default=0)

