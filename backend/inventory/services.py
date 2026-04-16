from django.db import transaction
from .models import Product, InventoryBatch, InventoryTransaction


@transaction.atomic
def fifo_deduct(product: Product, quantity: float, order_id: int | None = None) -> None:
    """FIFO bo‘yicha ombordan chiqim."""
    remaining = quantity
    batches = (
        InventoryBatch.objects.select_for_update()
        .filter(product=product, status="available")
        .order_by("expiry_date", "created_at")
    )
    for batch in batches:
        if remaining <= 0:
            break
        take = float(min(batch.quantity, remaining))
        if take <= 0:
            continue
        batch.quantity = batch.quantity - take
        if batch.quantity == 0:
            batch.status = "depleted"
        batch.save()
        InventoryTransaction.objects.create(
            type="out",
            product=product,
            batch=batch,
            quantity=take,
            order_id=order_id,
        )
        remaining -= take
    if remaining > 0:
        raise ValueError("Omborda yetarli qoldiq yo‘q")

