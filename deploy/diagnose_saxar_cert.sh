#!/usr/bin/env bash
# saxar.uz uchun NET::ERR_CERT_COMMON_NAME_INVALID sababini qidirish.
# Boshqa konfiglarni o'zgartirmaydi. Serverda root: bash deploy/diagnose_saxar_cert.sh

set -u

echo "=========================================="
echo "1) 443 da default_server (boshqa sayt serti)"
echo "=========================================="
if grep -Ri "default_server" /etc/nginx/sites-enabled/ 2>/dev/null | grep -E "443|ssl"; then
  echo "^^^ Agar bu saxar emas bo'lsa, brauzer ba'zan noto'g'ri sert ko'rishi mumkin."
else
  echo "(443 uchun default_server qatori topilmadi — yaxshi belgi)"
fi

echo ""
echo "=========================================="
echo "2) saxar.uz nginx: ssl_certificate va server_name"
echo "=========================================="
CFG="${SAXAR_NGINX_CONF:-/etc/nginx/sites-enabled/saxar.uz.conf}"
if [[ ! -f "$CFG" ]]; then
  echo "XATO: $CFG yo'q. Tekshiring: ls -la /etc/nginx/sites-enabled/ | grep -i saxar"
  echo "      Hujjat: deploy/DEPLOY.md §6 — saxar.uz.conf ni nusxalang va sites-enabled ga symlink."
  exit 1
fi

grep -nE "^\s*server_name|^\s*listen|ssl_certificate\s|ssl_certificate_key\s" "$CFG" | head -50

echo ""
echo "=========================================="
echo "3) fullchain.pem fayli va SAN (faylda nima yozilgan)"
echo "=========================================="
FC=$(grep -E "^\s*ssl_certificate\s+" "$CFG" | grep -v ssl_certificate_key | head -1 | awk '{print $2}' | tr -d ';')
if [[ -z "$FC" ]]; then
  echo "XATO: ssl_certificate topilmadi."
  exit 1
fi
echo "Yo'l: $FC"
if [[ ! -f "$FC" ]]; then
  echo "XATO: bu fayl diskda YO'Q — certbot sert chiqarmagan yoki yo'l noto'g'ri."
  echo "      Tuzatish: §5c DEPLOY.md — certbot --webroot, keyin ssl yo'llarni tekshiring."
  exit 1
fi
openssl x509 -in "$FC" -noout -subject -issuer -dates 2>/dev/null
openssl x509 -in "$FC" -noout -ext subjectAltName 2>/dev/null || openssl x509 -in "$FC" -noout -text 2>/dev/null | sed -n '/Subject Alternative Name/,+3p'

echo ""
echo "=========================================="
echo "4) Internetdan keladigan sert (SNI=saxar.uz)"
echo "=========================================="
echo | openssl s_client -connect saxar.uz:443 -servername saxar.uz 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName 2>/dev/null \
  || echo "(s_client xato — DNS yoki 443 blok)"

echo ""
echo "=========================================="
echo "Xulosa"
echo "=========================================="
echo "- (3) da DNS:saxar.uz yo'q, lekin (4) da boshqa domen bo'lsa — nginx boshqa blok yoki CDN."
echo "- (3) va (4) bir xil, lekin SAN saxar.uz emas — certbot --expand yoki to'g'ri --cert-name (§5b, §5c)."
echo "- (3) fayl yo'q — avval certbot, keyin saxar.uz.conf yo'llari."
