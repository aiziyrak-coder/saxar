#!/usr/bin/env bash
# Serverda ishga tushadi: /opt/saxar ni tayyorlaydi, Docker stack, nginx (faqat saxar saytlari).
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/saxar}"
REPO_URL="${REPO_URL:-https://github.com/aiziyrak-coder/saxar.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"

mkdir -p /var/www/html
mkdir -p "$INSTALL_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "XATO: docker topilmadi. Serverda docker o'rnating." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "XATO: docker compose plugin topilmadi." >&2
  exit 1
fi

cd "$INSTALL_ROOT"
export GIT_TERMINAL_PROMPT=0
if [[ -d .git ]]; then
  git remote set-url origin "$REPO_URL" 2>/dev/null || true
  git fetch origin "$REPO_BRANCH"
  git checkout "$REPO_BRANCH"
  git reset --hard "origin/$REPO_BRANCH"
else
  if [[ -n "$(ls -A 2>/dev/null)" ]]; then
    echo "XATO: $INSTALL_ROOT bo'sh emas va git repozitoriy emas — qo'lda tekshiring." >&2
    exit 1
  fi
  git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" .
fi

if [[ ! -f .env.saxar ]]; then
  python3 <<'PY'
import secrets
from pathlib import Path
root = Path("/opt/saxar")
ex = (root / ".env.saxar.example").read_text(encoding="utf-8")
pw = secrets.token_urlsafe(24)
sk = secrets.token_urlsafe(48)
text = ex.replace("REPLACE_WITH_STRONG_PASSWORD", pw).replace("REPLACE_WITH_LONG_RANDOM_SECRET", sk)
(root / ".env.saxar").write_text(text, encoding="utf-8")
print("Yaratildi: .env.saxar (tasodifiy parollar)")
PY
fi

echo "Docker build/up (bir necha daqiqa)..."
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar pull || true
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build

echo "Health (ichki):"
curl -fsS "http://127.0.0.1:18181/api/health/" | head -c 400 || true
echo ""

NGINX_AVAILABLE=0
if command -v nginx >/dev/null 2>&1; then
  NGINX_AVAILABLE=1
fi

if [[ "$NGINX_AVAILABLE" -eq 1 ]]; then
  # Faqat yangi saxar fayllari (boshqa virtual hostlarga tegmaymiz)
  cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.http-only.conf" /etc/nginx/sites-available/saxar.uz.conf
  cp "$INSTALL_ROOT/deploy/host-nginx/api.saxar.uz.http-only.conf" /etc/nginx/sites-available/api.saxar.uz.conf
  ln -sf /etc/nginx/sites-available/saxar.uz.conf /etc/nginx/sites-enabled/saxar.uz.conf
  ln -sf /etc/nginx/sites-available/api.saxar.uz.conf /etc/nginx/sites-enabled/api.saxar.uz.conf

  nginx -t
  systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload

  if command -v certbot >/dev/null 2>&1 && [[ -n "${SAXAR_CERTBOT_EMAIL:-}" ]]; then
    set +e
    certbot certonly --webroot -w /var/www/html --non-interactive --agree-tos \
      --email "$SAXAR_CERTBOT_EMAIL" -d saxar.uz -d www.saxar.uz
    C1=$?
    certbot certonly --webroot -w /var/www/html --non-interactive --agree-tos \
      --email "$SAXAR_CERTBOT_EMAIL" -d api.saxar.uz
    C2=$?
    set -e
    if [[ $C1 -eq 0 && $C2 -eq 0 ]]; then
      cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.conf" /etc/nginx/sites-available/saxar.uz.conf
      cp "$INSTALL_ROOT/deploy/host-nginx/api.saxar.uz.conf" /etc/nginx/sites-available/api.saxar.uz.conf
      echo "SSL nginx konfiglari o'rnatildi."
      nginx -t
      systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload
    else
      echo "OGOH: certbot muvaffaqiyatsiz (DNS yoki limit). HTTP (80) saxar konfiglari qoldi."
    fi
  fi

  echo "Nginx holati yangilandi."
else
  echo "OGOH: nginx topilmadi — faqat Docker portlari: 127.0.0.1:18180 va :18181"
fi

echo "Tayyor."
