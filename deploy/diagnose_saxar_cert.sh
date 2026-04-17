#!/usr/bin/env bash
# saxar.uz uchun NET::ERR_CERT_COMMON_NAME_INVALID sababini qidirish.
# Boshqa konfiglarni o'zgartirmaydi. Serverda: sudo bash deploy/diagnose_saxar_cert.sh

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
SKIP_CFG=0
if [[ ! -f "$CFG" ]]; then
  echo "XATO: $CFG YO'Q."
  echo "     Shuning uchun 443 da boshqa virtual host (masalan ailab) serti chiqishi NORMAL."
  echo "     Tuzatish: sudo bash deploy/fix_saxar_https.sh 'email@...'  (HTTP+SSL o'rnatadi)"
  SKIP_CFG=1
else
  grep -nE "^\s*server_name|^\s*listen|ssl_certificate\s|ssl_certificate_key\s" "$CFG" | head -50

  echo ""
  echo "=========================================="
  echo "3) fullchain.pem fayli va SAN (nginxda ko'rsatilgan fayl)"
  echo "=========================================="
  FC=$(grep -E "^\s*ssl_certificate\s+" "$CFG" | grep -v ssl_certificate_key | head -1 | awk '{print $2}' | tr -d ';')
  if [[ -z "$FC" ]]; then
    echo "XATO: ssl_certificate topilmadi (HTTP-only konfig bo'lishi mumkin)."
  elif [[ ! -f "$FC" ]]; then
    echo "XATO: $FC diskda YO'Q — certbot yoki yo'l."
  else
    echo "Yo'l: $FC"
    openssl x509 -in "$FC" -noout -subject -issuer -dates 2>/dev/null
    openssl x509 -in "$FC" -noout -ext subjectAltName 2>/dev/null || openssl x509 -in "$FC" -noout -text 2>/dev/null | sed -n '/Subject Alternative Name/,+3p'
  fi
fi

echo ""
echo "=========================================="
echo "4) Tashqi 443 (SNI=saxar.uz) — brauzer nimani ko'radi"
echo "=========================================="
echo | openssl s_client -connect saxar.uz:443 -servername saxar.uz 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName 2>/dev/null \
  || echo "(s_client xato — DNS yoki 443 blok)"

echo ""
echo "=========================================="
echo "Xulosa"
echo "=========================================="
if [[ "$SKIP_CFG" -eq 1 ]]; then
  echo "- (2) saxar.uz.conf yo'q edi — (4) dagi sert odatda BOSHQA sayt (default vhost)."
  echo "- Yechim: deploy/fix_saxar_https.sh email  (§5e DEPLOY.md)"
else
  echo "- (3) da DNS:saxar.uz yo'q, lekin (4) da boshqa domen — nginx boshqa blok yoki CDN."
  echo "- (3) va (4) bir xil, lekin SAN saxar.uz emas — certbot --expand (§5b, §5c)."
  echo "- (3) fayl yo'q — certbot, keyin saxar.uz.conf ssl yo'llari."
fi
