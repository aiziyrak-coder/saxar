import json

from rest_framework import permissions, status, views
from rest_framework.response import Response

from .models import PlatformSettings
from .permissions import IsAdminRole


def _load_landing_json() -> dict:
    solo = PlatformSettings.get_solo()
    raw = (solo.landing_public_json or "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _validate_landing_payload(data) -> dict:
    if not isinstance(data, dict):
        raise ValueError("JSON obyekt bo‘lishi kerak.")
    if len(json.dumps(data, ensure_ascii=False)) > 120_000:
        raise ValueError("Hajm juda katta (120 KB dan oshmasligi kerak).")
    hero = data.get("hero")
    if hero is not None and not isinstance(hero, dict):
        raise ValueError("hero obyekt bo‘lishi kerak.")
    for key in ("banners", "featureCards", "quickPoints"):
        val = data.get(key)
        if val is not None and (not isinstance(val, list) or len(val) != 4):
            raise ValueError(f"{key} ro‘yxati 4 ta elementdan iborat bo‘lishi kerak.")
    return data


class LandingPublicView(views.APIView):
    """Ochiq bosh sahifa — autentifikatsiyasiz."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(_load_landing_json())


class LandingAdminView(views.APIView):
    """Admin: landing o‘qish va saqlash."""

    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        solo = PlatformSettings.get_solo()
        return Response(
            {
                "content": _load_landing_json(),
                "updated_at": solo.updated_at.isoformat() if solo.updated_at else None,
            }
        )

    def put(self, request):
        try:
            payload = _validate_landing_payload(request.data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        solo = PlatformSettings.get_solo()
        solo.landing_public_json = json.dumps(payload, ensure_ascii=False)
        solo.save(update_fields=["landing_public_json", "updated_at"])
        return Response(
            {
                "ok": True,
                "content": payload,
                "updated_at": solo.updated_at.isoformat(),
            }
        )
