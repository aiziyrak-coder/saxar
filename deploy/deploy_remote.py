#!/usr/bin/env python3
"""
Masofadan SaxarERP deploy: SSH orqali `remote_bootstrap.sh` ni serverga yuklaydi va ishga tushiradi.

Parolni repoga yozmang. Quyidagilardan biri:
  - SAXAR_SSH_PASSWORD muhit o'zgaruvchisi
  - SAXAR_SSH_PASSWORD_FILE — bir qatorli parol fayli (masalan ~/.saxar_ssh, 600 huquq)

Ixtiyoriy:
  - SAXAR_SSH_HOST (default: 167.71.53.238)
  - SAXAR_SSH_USER (default: root)
  - SAXAR_CERTBOT_EMAIL — bo'lsa, certbot webroot bilan SSL olishga urinadi
  - SAXAR_REPO_URL, SAXAR_BRANCH
"""

from __future__ import annotations

import os
import shlex
import sys
import time
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("paramiko yo'q. O'rnating: pip install -r deploy/requirements-deploy.txt", file=sys.stderr)
    raise SystemExit(2) from None


def _read_password() -> str:
    pw = (os.environ.get("SAXAR_SSH_PASSWORD") or "").strip()
    if pw:
        return pw
    path = (os.environ.get("SAXAR_SSH_PASSWORD_FILE") or "").strip()
    if path:
        p = Path(path).expanduser()
        if p.is_file():
            return p.read_text(encoding="utf-8").strip()
    print(
        "SSH paroli topilmadi. PowerShell misol:\n"
        "  $env:SAXAR_SSH_PASSWORD='...'\n"
        "  python deploy/deploy_remote.py\n"
        "Yoki fayl: SAXAR_SSH_PASSWORD_FILE=C:\\Users\\You\\.saxar_ssh",
        file=sys.stderr,
    )
    raise SystemExit(2)


def _stream_exec(client: paramiko.SSHClient, command: str, timeout_sec: int = 3600) -> int:
    transport = client.get_transport()
    if transport is None:
        raise RuntimeError("SSH transport yo'q")
    transport.set_keepalive(30)

    chan = transport.open_session()
    chan.get_pty()
    chan.exec_command(command)

    start = time.monotonic()
    while True:
        if chan.recv_ready():
            chunk = chan.recv(4096)
            sys.stdout.buffer.write(chunk)
            sys.stdout.buffer.flush()
        if chan.recv_stderr_ready():
            chunk = chan.recv_stderr(4096)
            sys.stderr.buffer.write(chunk)
            sys.stderr.buffer.flush()
        if chan.exit_status_ready():
            while chan.recv_ready():
                chunk = chan.recv(4096)
                sys.stdout.buffer.write(chunk)
                sys.stdout.buffer.flush()
            while chan.recv_stderr_ready():
                chunk = chan.recv_stderr(4096)
                sys.stderr.buffer.write(chunk)
                sys.stderr.buffer.flush()
            break
        if time.monotonic() - start > timeout_sec:
            chan.close()
            raise TimeoutError(f"Buyruq {timeout_sec}s dan oshdi")
        time.sleep(0.2)

    return int(chan.recv_exit_status())


def main() -> int:
    host = os.environ.get("SAXAR_SSH_HOST", "167.71.53.238").strip()
    user = os.environ.get("SAXAR_SSH_USER", "root").strip()
    password = _read_password()
    cert_email = (os.environ.get("SAXAR_CERTBOT_EMAIL") or "").strip()
    repo_url = os.environ.get("SAXAR_REPO_URL", "https://github.com/aiziyrak-coder/saxar.git").strip()
    branch = os.environ.get("SAXAR_BRANCH", "main").strip()

    script_local = Path(__file__).resolve().parent / "remote_bootstrap.sh"
    if not script_local.is_file():
        print(f"Topilmadi: {script_local}", file=sys.stderr)
        return 2

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        username=user,
        password=password,
        timeout=45,
        look_for_keys=False,
        allow_agent=False,
    )

    try:
        remote_path = "/tmp/saxar_bootstrap.sh"
        sftp = client.open_sftp()
        sftp.put(str(script_local), remote_path)
        sftp.chmod(remote_path, 0o755)
        sftp.close()

        exports = [
            f"export REPO_URL={shlex.quote(repo_url)}",
            f"export REPO_BRANCH={shlex.quote(branch)}",
            f"export INSTALL_ROOT={shlex.quote('/opt/saxar')}",
        ]
        if cert_email:
            exports.append(f"export SAXAR_CERTBOT_EMAIL={shlex.quote(cert_email)}")

        remote_cmd = (
            "set -e; " + "; ".join(exports) + f"; chmod +x {shlex.quote(remote_path)}; bash {shlex.quote(remote_path)}"
        )
        code = _stream_exec(client, remote_cmd, timeout_sec=3600)
        return code
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
