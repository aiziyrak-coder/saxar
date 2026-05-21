# SaxarERP — DevOps audit (2026-05-20)

## Mahalliy tekshiruvlar

| Tekshiruv | Natija |
|-----------|--------|
| `tsc --noEmit` | OK |
| `eslint src/` | OK |
| `npm run build` | OK |
| Django `HealthCheckTests` | OK |

## Tuzatilgan kamchiliklar (repo)

1. **API health + `DJANGO_SECURE_SSL=1`** — ichki `/api/health/` 301/400 bermasligi uchun `core.middleware.HealthCheckInternalMiddleware`.
2. **`DJANGO_ALLOWED_HOSTS`** — `.env.saxar.example` va `docker-compose.saxar-prod.yml` da `saxar.uz`, `web` qo'shildi; `remote_bootstrap.sh` eski `.env` ni avtomatik yangilaydi.
3. **Nginx deploy** — `api.saxar.uz` alohida cert bo'lmasa `api.saxar.uz.shared-with-saxar-cert.conf` (oldingi 400/nginx reload muammosi).
4. **Docker healthcheck** — `api` va `web` xizmatlari uchun; `web` `api` healthy bo'lgach ishga tushadi.
5. **Prod xavfsizlik** — `VITE_SHOW_DEMO_ROLE_LOGIN=false` (default).
6. **Post-deploy** — `deploy/post_deploy_verify.sh`, `deploy/audit_production.py`, `deploy/validate_local.ps1`.

## Production (oldingi sessiya)

- `https://saxar.uz/admin/workspace` → 200 (SPA).
- Server `.env` da `saxar.uz` ALLOWED_HOSTS ga qo'shilgan.
- Nginx `api.saxar.uz` shared SSL bilan reload qilingan.

## Deploy qilish (yangilanishlarni serverga)

```powershell
$env:SAXAR_SSH_PASSWORD = "PAROL"
python deploy/deploy_remote.py
python deploy/audit_production.py
```

## Ma'lum cheklovlar (biznes-reja)

Quyidagilar **integratsiya rejasi** (toast «rejada») — bu deploy nuqsoni emas:

- 1C / Didox / E-Aktiv / Payme
- GPS jonli xarita, shtrix skaner
- Ba'zi agent/driver sozlamalar tugmalari

Firebase: serverda `/opt/saxar/firebase-applet-config.json` haqiqiy kalit bilan bo'lishi kerak (`DEPLOY.md` §11).
