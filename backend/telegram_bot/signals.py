import logging

from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from finance.models import Expense, Payment
from sales.models import Order

from . import notify

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Order)
def _order_cache_status(sender, instance: Order, **kwargs):
    if instance.pk:
        try:
            old = Order.objects.only("status").get(pk=instance.pk).status
            instance._tg_prev_status = old
        except Order.DoesNotExist:
            instance._tg_prev_status = None
    else:
        instance._tg_prev_status = None


@receiver(post_save, sender=Order)
def _order_post_save(sender, instance: Order, created: bool, **kwargs):
    if getattr(instance, "_skip_telegram_status_broadcast", False):
        return
    try:
        if created:
            oid = instance.pk

            def _push() -> None:
                notify.notify_new_order_by_id(oid)

            transaction.on_commit(_push)
        else:
            prev = getattr(instance, "_tg_prev_status", None)
            if prev is not None and prev != instance.status:
                notify.notify_order_status_change(instance, prev)
    except Exception:
        logger.exception("telegram order signal")


@receiver(post_save, sender=Payment)
def _payment_post_save(sender, instance: Payment, created: bool, **kwargs):
    if not created:
        return
    try:
        notify.notify_payment(instance)
    except Exception:
        logger.exception("telegram payment signal")


@receiver(post_save, sender=Expense)
def _expense_post_save(sender, instance: Expense, created: bool, **kwargs):
    if not created:
        return
    try:
        notify.notify_expense(instance)
    except Exception:
        logger.exception("telegram expense signal")
