#!/usr/bin/env python3
"""
Production audit (SSH): nginx, Docker, env, HTTP endpoints.
Parol: SAXAR_SSH_PASSWORD yoki SAXAR_SSH_PASSWORD_FILE (deploy_remote.py bilan bir xil).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("pip install -r deploy/requirements-deploy.txt", file=sys.stderr)
    raise SystemExit(2) from None

# deploy_remote dan autentifikatsiya (bir papkada)
_deploy_dir = Path(__file__).resolve().parent
if str(_deploy_dir) not in sys.path:
    sys.path.insert(0, str(_deploy_dir))
import importlib.util

_spec = importlib.util.spec_from_file_location("deploy_remote", _deploy_dir / "deploy_remote.py")
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)
_resolve_auth = _mod._resolve_auth

HOST = os.environ.get("SAXAR_SSH_HOST", "167.71.53.238").strip()
USER = os.environ.get("SAXAR_SSH_USER", "root").strip()

CHECKS = r"""
set +e
echo "=== Docker ==="
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'saxar|NAMES' || true
echo ""
echo "=== API health ==="
curl -fsS --max-time 5 http://127.0.0.1:18181/api/health/ 2>&1 | head -c 200
echo ""
echo "=== ALLOWED_HOSTS (container) ==="
docker exec saxar-api-1 printenv DJANGO_ALLOWED_HOSTS 2>/dev/null || echo missing
echo ""
echo "=== SPA /admin/workspace (frontend port) ==="
curl -sI -H 'Host: saxar.uz' http://127.0.0.1:18180/admin/workspace | head -3
echo ""
echo "=== Public HTTPS ==="
curl -sI --max-time 8 https://saxar.uz/admin/workspace 2>&1 | head -6
curl -sI --max-time 8 https://saxar.uz/api/health/ 2>&1 | head -6
echo ""
echo "=== nginx -t ==="
nginx -t 2>&1 | tail -3
echo ""
echo "=== .env.saxar (hosts only) ==="
grep -E '^(DJANGO_ALLOWED_HOSTS|VITE_PUBLIC_API_URL|DJANGO_DEBUG)=' /opt/saxar/.env.saxar 2>/dev/null || true
echo ""
echo "=== API logs (last errors) ==="
docker logs saxar-api-1 --tail 15 2>&1 | tail -15
"""


def main() -> int:
    password, pkey = _resolve_auth()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kw: dict = {
        "hostname": HOST,
        "username": USER,
        "timeout": 45,
        "look_for_keys": False,
        "allow_agent": False,
    }
    if pkey:
        kw["pkey"] = pkey
    if password:
        kw["password"] = password
    client.connect(**kw)
    try:
        _, stdout, stderr = client.exec_command(CHECKS, timeout=120)
        out = stdout.read().decode(errors="replace")
        err = stderr.read().decode(errors="replace")
        sys.stdout.write(out)
        if err:
            sys.stderr.write(err)
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
