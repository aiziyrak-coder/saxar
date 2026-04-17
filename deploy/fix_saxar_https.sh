#!/usr/bin/env bash
# saxar.uz + www uchun Let's Encrypt (webroot) va nginx SSL konfigini qo'llash.
# Boshqa virtual hostlarning matnini o'zgartirmaydi — faqat saxar fayllari.
#
# Email: ba'zi sudo muhitda -E ishlamaydi — shuning uchun EMAIL birinchi argument sifatida:
#   cd /opt/saxar && sudo bash deploy/fix_saxar_https.sh 'aiziyrak@gmail.com'
#
# yoki muhit (ishlasa):
#   export SAXAR_CERTBOT_EMAIL='aiziyrak@gmail.com'
#   sudo -E bash deploy/fix_saxar_https.sh

set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/saxar}"
WEBROOT="${SAXAR_ACME_WEBROOT:-/var/www/html}"

EMAIL="${SAXAR_CERTBOT_EMAIL:-}"
if [[ -n "${1:-}" ]]; then
  EMAIL="$1"
fi

if [[ -z "$EMAIL" ]]; then
  echo "XATO: Let's Encrypt email kerak." >&2
  echo "  sudo bash deploy/fix_saxar_https.sh 'sizning@gmail.com'" >&2
  echo "  yoki: export SAXAR_CERTBOT_EMAIL='...' (keyin sudo -E yoki to'g'ridan-to'g'ri root shell)" >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "XATO: certbot topilmadi. O'rnating: apt install certbot" >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "XATO: nginx topilmadi." >&2
  exit 1
fi

mkdir -p "$WEBROOT"
if [[ ! -d "$INSTALL_ROOT" ]]; then
  echo "XATO: INSTALL_ROOT=$INSTALL_ROOT papkasi yo'q." >&2
  exit 1
fi

cd "$INSTALL_ROOT"
if [[ -d .git ]]; then
  git pull || true
fi

reload_nginx() {
  nginx -t
  if systemctl reload nginx 2>/dev/null; then
    echo "nginx reload (systemctl) OK"
  elif service nginx reload 2>/dev/null; then
    echo "nginx reload (service) OK"
  else
    nginx -s reload
    echo "nginx reload (nginx -s) OK"
  fi
}

SAXAR_ENABLED="/etc/nginx/sites-enabled/saxar.uz.conf"
if [[ ! -f "$SAXAR_ENABLED" ]]; then
  echo "=== saxar nginx yo'q — avval HTTP (acme-challenge uchun) qo'yamiz ==="
  cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.http-only.conf" /etc/nginx/sites-available/saxar.uz.conf
  ln -sf /etc/nginx/sites-available/saxar.uz.conf /etc/nginx/sites-enabled/saxar.uz.conf
  reload_nginx
  echo "HTTP saxar.uz yoqildi. Certbot uchun 80-port va DNS tekshiring."
fi

echo "=== Let's Encrypt (webroot, saxar.uz + www) ==="
set +e
certbot certonly --webroot -w "$WEBROOT" --non-interactive --agree-tos \
  --email "$EMAIL" --cert-name saxar.uz --expand \
  -d saxar.uz -d www.saxar.uz
CB=$?
set -e
if [[ "$CB" -ne 0 ]]; then
  echo "OGOH: certbot chiqishi $CB. Tekshiring: DNS A saxar.uz, 80 ochiq, $WEBROOT/.well-known" >&2
  exit "$CB"
fi

FC="/etc/letsencrypt/live/saxar.uz/fullchain.pem"
if [[ ! -f "$FC" ]]; then
  echo "XATO: $FC yaratilmadi." >&2
  exit 1
fi

echo "=== SAN tekshiruvi (faylda saxar.uz bo'lishi kerak) ==="
openssl x509 -in "$FC" -noout -ext subjectAltName || openssl x509 -in "$FC" -noout -text | sed -n '/Subject Alternative Name/,+4p'

echo "=== nginx: saxar.uz HTTPS konfigi (SSL) ==="
cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.conf" /etc/nginx/sites-available/saxar.uz.conf
ln -sf /etc/nginx/sites-available/saxar.uz.conf /etc/nginx/sites-enabled/saxar.uz.conf
reload_nginx

echo ""
echo "Tayyor. Tekshiruv: bash $INSTALL_ROOT/deploy/verify_saxar_ssl.sh"
echo "api.saxar.uz: DEPLOY.md §5a"
