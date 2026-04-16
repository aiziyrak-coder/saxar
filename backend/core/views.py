import os

from django.conf import settings
from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET", "HEAD"])
def health_check(_request):
    """
    Sog‘liq tekshiruvi — load balancer / orchestrator uchun.
    DJANGO_HEALTH_CHECK_DB=0 bo‘lsa faqat jarayon (liveness); aks holda DB (readiness).
    """
    check_db = os.getenv("DJANGO_HEALTH_CHECK_DB", "1") == "1"
    payload: dict[str, str | int] = {"status": "ok", "service": "saxar-erp-api"}
    if not check_db:
        return JsonResponse(payload)

    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        if not row or row[0] != 1:
            payload["status"] = "degraded"
            payload["database"] = "error"
            return JsonResponse(payload, status=503)
        payload["database"] = "ok"
    except DatabaseError as exc:
        payload["status"] = "degraded"
        payload["database"] = "error"
        if settings.DEBUG:
            payload["database_detail"] = str(exc)
        return JsonResponse(payload, status=503)

    return JsonResponse(payload)
