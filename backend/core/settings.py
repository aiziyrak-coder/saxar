from pathlib import Path
from urllib.parse import urlparse, unquote
import os

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

_DEFAULT_INSECURE_SECRET = "dev-secret-key-change-me"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", _DEFAULT_INSECURE_SECRET)

DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

if not DEBUG and (not SECRET_KEY or SECRET_KEY == _DEFAULT_INSECURE_SECRET):
    raise ImproperlyConfigured(
        "DJANGO_DEBUG=0 uchun DJANGO_SECRET_KEY ni kuchli, tasodifiy qiymat bilan o'rnating."
    )

ALLOWED_HOSTS: list[str] = [
    h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()
]

_csrf_origins = os.getenv(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(",") if o.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "corsheaders",
    "accounts",
    "inventory",
    "sales",
    "finance",
    "logistics",
    "production",
    "b2b",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


def _database_config() -> dict:
    """SQLite (dev) yoki DATABASE_URL orqali PostgreSQL (prod / Docker)."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        raw = database_url
        if raw.startswith("postgres://"):
            raw = "postgresql://" + raw[len("postgres://") :]
        parsed = urlparse(raw)
        if parsed.scheme not in ("postgresql", "postgres"):
            raise ImproperlyConfigured("DATABASE_URL postgres:// yoki postgresql:// bilan boshlanishi kerak.")
        db_name = (parsed.path or "").lstrip("/")
        if not db_name:
            raise ImproperlyConfigured("DATABASE_URL ichida ma'lumotlar bazasi nomi bo'lishi kerak.")
        cfg: dict = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": unquote(db_name),
            "USER": unquote(parsed.username or ""),
            "PASSWORD": unquote(parsed.password or ""),
            "HOST": parsed.hostname or "localhost",
            "PORT": str(parsed.port or 5432),
            "CONN_MAX_AGE": int(os.getenv("DJANGO_DB_CONN_MAX_AGE", "60")),
        }
        sslmode = os.getenv("DJANGO_DB_SSLMODE", "").strip()
        if sslmode:
            cfg["OPTIONS"] = {"sslmode": sslmode}
        return {"default": cfg}
    return {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


DATABASES = _database_config()

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

# CORS Configuration
_cors_allowed = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_allowed.split(",") if o.strip()]

if DEBUG and os.getenv("CORS_ALLOW_ALL_IN_DEBUG", "0") == "1":
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Production Security (enable in production)
SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL", "0") == "1"
SECURE_HSTS_SECONDS = 31536000 if os.getenv("DJANGO_SECURE_SSL", "0") == "1" else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("DJANGO_SECURE_SSL", "0") == "1"
SECURE_HSTS_PRELOAD = os.getenv("DJANGO_SECURE_SSL", "0") == "1"

# Reverse proxy (nginx / load balancer) orqali HTTPS
if os.getenv("DJANGO_BEHIND_PROXY", "0") == "1":
    USE_X_FORWARDED_HOST = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

