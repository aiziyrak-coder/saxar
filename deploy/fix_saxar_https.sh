#!/usr/bin/env bash
# saxar.uz + www uchun Let's Encrypt (webroot) va nginx SSL konfigini qo'llash.
# Boshqa virtual hostlarning matnini o'zgartirmaydi — faqat saxar fayllari.
#
# Ishlatish (server, root):
#   export SAXAR_CERTBOT_EMAIL="sizning@email.uz"
#   export INSTALL_ROOT=/opt/saxar   # ixtiyoriy
#   bash deploy/fix_saxar_https.sh
#
# yoki:
#   sudo SAXAR_CERTBOT_EMAIL="sizning@email.uz" bash deploy/fix_saxar_https.sh

set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/saxar}"
EMAIL="${SAXAR_CERTBOT_EMAIL:-${1:-}}"
WEBROOT="${SAXAR_ACME_WEBROOT:-/var/www/html}"

if [[ -z "$EMAIL" ]]; then
  echo "XATO: SAXAR_CERTBOT_EMAIL muhit o'zgaruvchisini yozing (Let's Encrypt email)." >&2
  echo "  misol:  export SAXAR_CERTBOT_EMAIL='admin@saxar.uz'" >&2
  echo "          cd $INSTALL_ROOT && sudo -E bash deploy/fix_saxar_https.sh" >&2
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "XATO: certbot topilmadi. O'rnating: apt install certbot python3-certbot-nginx" >&2
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

echo "=== Let's Encrypt (webroot, saxar.uz + www) ==="
set +e
certbot certonly --webroot -w "$WEBROOT" --non-interactive --agree-tos \
  --email "$EMAIL" --cert-name saxar.uz --expand \
  -d saxar.uz -d www.saxar.uz
CB=$?
set -e
if [[ "$CB" -ne 0 ]]; then
  echo "OGOH: certbot chiqishi $CB. Tekshiring: DNS A saxar.uz, 80-port ochiq, $WEBROOT da acme." >&2
  exit "$CB"
fi

FC="/etc/letsencrypt/live/saxar.uz/fullchain.pem"
if [[ ! -f "$FC" ]]; then
  echo "XATO: $FC yaratilmadi." >&2
  exit 1
fi

echo "=== SAN tekshiruvi (faylda saxar.uz bo'lishi kerak) ==="
openssl x509 -in "$FC" -noout -ext subjectAltName || openssl x509 -in "$FC" -noout -text | sed -n '/Subject Alternative Name/,+4p'

echo "=== nginx: faqat saxar.uz SSL konfigi ==="
cp "$INSTALL_ROOT/deploy/host-nginx/saxar.uz.conf" /etc/nginx/sites-available/saxar.uz.conf
ln -sf /etc/nginx/sites-available/saxar.uz.conf /etc/nginx/sites-enabled/saxar.uz.conf

nginx -t
if systemctl reload nginx 2>/dev/null; then
  echo "nginx reload (systemctl) OK"
elif service nginx reload 2>/dev/null; then
  echo "nginx reload (service) OK"
else
  nginx -s reload
  echo "nginx reload (nginx -s) OK"
fi

echo ""
echo "Tayyor. Tekshiruv: bash $INSTALL_ROOT/deploy/verify_saxar_ssl.sh"
echo "api.saxar.uz HTTPS alohida: DEPLOY.md §5a yoki DNS bo'lgach certbot -d api.saxar.uz"
