import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

ALLOWED_CONTENT_TYPES = frozenset(
    {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
)
ALLOWED_FOLDERS = frozenset({"catalog", "categories", "brands", "landing", "avatars"})
MAX_BYTES = 5 * 1024 * 1024
EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class ImageUploadView(APIView):
    """Rasm faylini serverga yuklash; javobda ochiq URL qaytariladi."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"detail": "Fayl tanlanmagan (file)."}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded.size > MAX_BYTES:
            return Response(
                {"detail": "Fayl hajmi 5 MB dan oshmasligi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = (uploaded.content_type or "").lower()
        if content_type not in ALLOWED_CONTENT_TYPES:
            return Response(
                {"detail": "Faqat JPEG, PNG, WebP yoki GIF ruxsat etilgan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        folder = (request.data.get("folder") or "catalog").strip().lower()
        if folder not in ALLOWED_FOLDERS:
            return Response({"detail": "Noto'g'ri folder."}, status=status.HTTP_400_BAD_REQUEST)

        ext = EXT_BY_TYPE.get(content_type) or Path(uploaded.name or "").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            ext = ".jpg"

        rel_path = f"uploads/{folder}/{uuid.uuid4().hex}{ext}"
        saved = default_storage.save(rel_path, uploaded)
        media_url = f"{settings.MEDIA_URL.rstrip('/')}/{saved}"
        if not media_url.startswith("/"):
            media_url = f"/{media_url}"

        absolute = request.build_absolute_uri(media_url)
        return Response({"url": absolute, "path": media_url}, status=status.HTTP_201_CREATED)
