#!/usr/bin/env bash
# Serverda deploy dan keyin: nginx, Docker, API/SPA yo'llari.
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/saxar}"
FAIL=0

fail() {
  echo "FAIL: $*" >&2
  FAIL=1
}

ok() {
  echo "OK: $*"
}

echo "=== Saxar post-deploy verify ==="

if command -v nginx >/dev/null 2>&1; then
  if nginx -t >/dev/null 2>&1; then
    ok "nginx -t"
  else
    fail "nginx -t"
    nginx -t 2>&1 | tail -5 >&2 || true
  fi
else
  echo "SKIP: nginx yo'q"
fi

for port in 18180 18181; do
  if curl -fsS --max-time 3 "http://127.0.0.1:${port}/" -o /dev/null 2>/dev/null || \
     curl -fsS --max-time 3 "http://127.0.0.1:${port}/api/health/" -o /dev/null 2>/dev/null; then
    ok "port ${port} javob berdi"
  else
    fail "port ${port} javob bermadi"
  fi
done

HC=$(curl -fsS --max-time 5 "http://127.0.0.1:18181/api/health/" 2>/dev/null || true)
if echo "$HC" | grep -q '"status"'; then
  ok "API health JSON"
else
  fail "API health: ${HC:-empty}"
fi

FE=$(curl -fsS --max-time 5 -H "Host: saxar.uz" "http://127.0.0.1:18180/admin/dashboard" 2>/dev/null | head -c 40 || true)
if echo "$FE" | grep -qi 'doctype'; then
  ok "SPA /admin/dashboard (18180)"
else
  fail "SPA /admin/dashboard — HTML emas"
fi

API_ADMIN=$(curl -sI --max-time 5 -H "Host: saxar.uz" "http://127.0.0.1:18181/admin/dashboard" 2>/dev/null | head -1 || true)
if echo "$API_ADMIN" | grep -q '400'; then
  echo "INFO: API to'g'ridan-to'g'ri /admin/dashboard ga 400 — nginx SPA ga yo'naltirishi kerak"
fi

if [[ -f "${INSTALL_ROOT}/.env.saxar" ]]; then
  if grep -q 'saxar.uz' "${INSTALL_ROOT}/.env.saxar"; then
    ok "DJANGO_ALLOWED_HOSTS saxar.uz bor"
  else
    fail "DJANGO_ALLOWED_HOSTS da saxar.uz yo'q"
  fi
fi

if curl -fsS --max-time 8 -k "https://saxar.uz/admin/dashboard" -o /dev/null 2>/dev/null; then
  ok "https://saxar.uz/admin/dashboard"
elif curl -fsS --max-time 8 "http://saxar.uz/admin/dashboard" -o /dev/null 2>/dev/null; then
  ok "http://saxar.uz/admin/dashboard"
else
  fail "tashqi https://saxar.uz/admin/dashboard"
fi

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi
echo "=== Barcha tekshiruvlar o'tdi ==="
