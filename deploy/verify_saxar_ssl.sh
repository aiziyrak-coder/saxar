#!/usr/bin/env bash
# Boshqa nginx konfiglarni o'zgartirmaydi — faqat brauzerga keladigan sertni ko'rsatadi.
# Ishlatish (server yoki mahalliy): bash deploy/verify_saxar_ssl.sh

set -u

check_host() {
  local h="$1"
  echo "=== ${h}:443 (SNI=${h}) ==="
  if ! echo | openssl s_client -connect "${h}:443" -servername "$h" 2>/dev/null |
    openssl x509 -noout -subject -dates -ext subjectAltName 2>/dev/null; then
    echo "(xato: ulanish yoki sert o'qilmadi — DNS yoki 443 tekshiring)"
  fi
  echo ""
}

for h in saxar.uz www.saxar.uz; do
  check_host "$h"
done

echo "=== api.saxar.uz (DNS bo'lmasa xato — normal) ==="
check_host api.saxar.uz || true

echo "Kutiladi: Subject Alternative Name ichida tegishli domen(lar) ko'rinsin."
echo "COMMON_NAME_INVALID bo'lsa: certbot --webroot (§5c DEPLOY.md) va saxar.uz.conf ssl yo'llari."
