from django.db import models
from django.conf import settings


class B2BClient(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="b2b_client")
    registration_status = models.CharField(max_length=20, default="pending")  # pending/approved/rejected
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)

