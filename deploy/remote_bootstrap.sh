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

# Eski .env: noto'g'ri VITE — brauzerda https://api/api/... yoki ERR_NAME_NOT_RESOLVED
if [[ -f .env.saxar ]]; then
  if grep -qE '^VITE_PUBLIC_API_URL=https://api\.saxar\.uz' .env.saxar 2>/dev/null && ! getent hosts api.saxar.uz >/dev/null 2>&1; then
    sed -i.bak 's|^VITE_PUBLIC_API_URL=https://api.saxar.uz/api|VITE_PUBLIC_API_URL=/api|' .env.saxar || true
    echo "Tuzatildi: VITE_PUBLIC_API_URL=/api (api.saxar.uz DNS yo'q)."
  fi
  if grep -qE '^VITE_PUBLIC_API_URL=https://api$' .env.saxar 2>/dev/null; then
    sed -i.bak2 's|^VITE_PUBLIC_API_URL=https://api$|VITE_PUBLIC_API_URL=/api|' .env.saxar || true
    echo "Tuzatildi: VITE_PUBLIC_API_URL=/api (noto'g'ri https://api)."
  fi
  if grep -qE '^VITE_PUBLIC_API_URL=api$' .env.saxar 2>/dev/null; then
    sed -i.bak3 's|^VITE_PUBLIC_API_URL=api$|VITE_PUBLIC_API_URL=/api|' .env.saxar || true
    echo "Tuzatildi: VITE_PUBLIC_API_URL=/api (faqat 'api' yozilgan edi)."
  fi
fi

echo "Docker build/up (bir necha daqiqa)..."
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar pull || true
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build

echo "API tayyor bo'lishini kutamiz (migratsiya + gunicorn)..."
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -fsS --max-time 3 "http://127.0.0.1:18181/api/health/" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Health (ichki):"
curl -fsS "http://127.0.0.1:18181/api/health/" | head -c 400 || echo "(API javob bermadi — docker compose logs api)"
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

  # Certbot faqat --webroot (boshqa saytlarning nginx konfiglarini o'zgartirmaydi).
  if command -v certbot >/dev/null 2>&1 && [[ -n "${SAXAR_CERTBOT_EMAIL:-}" ]]; then
    set +e
    certbot certonly --webroot -w /var/www/html --non-interactive --agree-tos \
      --email "$SAXAR_CERTBOT_EMAIL" -d saxar.uz -d www.saxar.uz
    C1=$?
    certbot certonly --webroot -w /var/www/html --non-interactive --agree-tos \
      --email "$SAXAR_CERTBOT_EMAIL" -d api.saxar.uz
    C2=$?
    set -e
    # Har bir domen alohida: saxar.uz SSL bo'lsa — asosiy sayt HTTPS; api DNS bo'lmasa — API HTTP 80 da qoladi
    if [[ $C1 -eq 0 ]]; then
      cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.conf" /etc/nginx/sites-available/saxar.uz.conf
      echo "saxar.uz uchun SSL nginx o'rnatildi."
    else
      echo "OGOH: saxar.uz uchun certbot muvaffaqiyatsiz — saxar HTTP 80."
    fi
    if [[ $C2 -eq 0 ]]; then
      cp "$INSTALL_ROOT/deploy/host-nginx/api.saxar.uz.conf" /etc/nginx/sites-available/api.saxar.uz.conf
      echo "api.saxar.uz uchun SSL nginx o'rnatildi."
    else
      cp "$INSTALL_ROOT/deploy/host-nginx/api.saxar.uz.http-only.conf" /etc/nginx/sites-available/api.saxar.uz.conf
      echo "OGOH: api.saxar.uz uchun certbot muvaffaqiyatsiz (odatda DNS A yozuvi yo'q). api HTTP 80. DNS qo'shgach qayta: bash deploy/remote_bootstrap.sh"
    fi
    nginx -t
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload
  fi

  echo "Nginx holati yangilandi."
else
  echo "OGOH: nginx topilmadi — faqat Docker portlari: 127.0.0.1:18180 va :18181"
fi

echo "Tayyor."
