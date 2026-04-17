# SaxarERP — saxar.uz va api.saxar.uz deploy

Bu yo‘riqnoma **mavjud nginx saytlariga tegmaydi**: faqat `sites-available` / `sites-enabled` ga **yangi** ikkita fayl qo‘shiladi va Docker stack **faqat** `127.0.0.1:18180` (frontend) va `127.0.0.1:18181` (API) da ishlaydi.

## 0) Xavfsizlik

- Chat orqali yuborilgan server parolini **darhol o‘zgartiring** va root uchun **SSH kalit** (`ssh-ed25519`) ishlating.
- GitHub push uchun **Personal Access Token** yoki SSH kalit ishlating; parolni repoga yozmang.

### 0a) Boshqa ishlab turgan dasturlar / saytlarga ta’sir qilmaslik

Saxar stack **boshqa loyihalarning** portlari va nginx virtual hostlari bilan **ajratilgan** bo‘lishi kerak:

- **Docker:** `docker-compose.saxar-prod.yml` faqat **`127.0.0.1:18180`** (web) va **`127.0.0.1:18181`** (API) ga bog‘lanadi — serverning `80`/`443` portlarini saxar konteynerlari **egallamaydi**. Boshqa dasturlar odatdagi portlarida qoladi.
- **Nginx:** faqat **yangi** fayllarni qo‘shing: `sites-available` / `sites-enabled` dagi `saxar.uz.conf` va `api.saxar.uz.conf` (yoki `*.http-only.conf`). Mavjud `cdcgroup`, `fjsti` va boshqa `*.conf` fayllarini **tahrirlamang** — ularning `upstream` nomlari bilan **takrorlanmasligi** uchun saxar upstreamlari repoda alohida nomlangan.
- **`default_server`:** saxar konfigiga **`listen 443 ssl default_server`** yoki `listen 80 default_server` **qo‘shmang**. Aks holda brauzer boshqa domen uchun ham saxar (yoki boshqa) sertifikatini ko‘rishi mumkin — **`NET::ERR_CERT_COMMON_NAME_INVALID`**.
- **SSL yo‘llari:** `saxar.uz` bloki faqat **`/etc/letsencrypt/live/saxar.uz/`** (yoki sizda saxar uchun haqiqiy sert papkasi) dan o‘qishi kerak; `api` uchun alohida papka bo‘lsa, **`api.saxar.uz.conf`** da `live/api.saxar.uz/` qolsin — papkalarni **aralashtirib yubormang**.

## 1) DNS

- `A` yozuv: `saxar.uz` → server IP  
- `A` yozuv: `www.saxar.uz` → server IP (ixtiyoriy)  
- `A` yozuv: `api.saxar.uz` → server IP (**yo‘q bo‘lsa**, frontend `.env.saxar` da `VITE_PUBLIC_API_URL=/api` qoling — API so‘rovlari `https://saxar.uz/api/...` orqali ishlaydi; `remote_bootstrap.sh` saxar uchun SSLni alohida qo‘llaydi)  

## 2) Serverda papka va kod

```bash
sudo mkdir -p /opt/saxar
sudo chown "$USER":"$USER" /opt/saxar
cd /opt/saxar
git clone https://github.com/aiziyrak-coder/saxar.git .
# yoki SSH: git clone git@github.com:aiziyrak-coder/saxar.git .
```

## 3) Muhit o‘zgaruvchilari

```bash
cd /opt/saxar
cp .env.saxar.example .env.saxar
nano .env.saxar   # POSTGRES_PASSWORD, DJANGO_SECRET_KEY, kerak bo'lsa domenlar
```

## 4) Docker stack

Serverda Docker va Docker Compose plugin o‘rnatilgan bo‘lishi kerak.

```bash
cd /opt/saxar
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build
```

Tekshiruv (server ichida):

```bash
curl -sS http://127.0.0.1:18180/ | head
curl -sS http://127.0.0.1:18181/api/health/
```

## 5) SSL sertifikatlar (Certbot)

### 5c) Boshqa dasturlarga tegmasin — **webroot** usuli (tavsiya)

Bitta serverda **boshqa saytlar** (cdcgroup, fjsti, …) ishlayotgan bo‘lsa, `certbot --nginx` ba’zan **tashqi nginx fayllarini** o‘zgartiradi yoki `default_server` bilan chalkashadi. Saxar uchun **xavfsiz** yo‘l:

1. `/.well-known/acme-challenge/` uchun `root /var/www/html;` saxar **HTTP** bloklarida bor (repodagi konflar).
2. Sert faqat fayl sifatida chiqadi — boshqa `server {}` larni certbot **tahrirlamaydi**:

```bash
sudo certbot certonly --webroot -w /var/www/html --cert-name saxar.uz \
  -d saxar.uz -d www.saxar.uz
# api kerak bo'lsa (SAN bitta sertda bo'lishi mumkin):
# sudo certbot certonly --webroot -w /var/www/html --cert-name saxar.uz --expand \
#   -d saxar.uz -d www.saxar.uz -d api.saxar.uz
# yoki alohida:
# sudo certbot certonly --webroot -w /var/www/html -d api.saxar.uz
```

3. Keyin faqat **saxar** nginx fayllarini repodan nusxalang (`§6`), `nginx -t` va `reload`.

Tekshiruv (hech narsani o‘zgartirmaydi):

```bash
bash deploy/verify_saxar_ssl.sh
```

**Qo‘lda tekshirish:** `openssl x509 -in /etc/letsencrypt/live/saxar.uz/fullchain.pem -noout -ext subjectAltName` — chiqishda `DNS:saxar.uz` bo‘lishi kerak.

`certbot --nginx` — faqat siz boshqa virtual hostlarga ishonchingiz komil bo‘lsa; aks holda **§5c** bilan qoling.

Agar `options-ssl-nginx.conf` yo‘q bo‘lsa, certbot o‘zi yaratadi yoki `ssl_dhparam` qatorlarini vaqtincha izohlab qo‘ying.

### 5a) `api.saxar.uz` — `NET::ERR_CERT_COMMON_NAME_INVALID` (HSTS)

Brauzer shuni bildiradi: **kelgan sertifikatda `api.saxar.uz` SAN/CN da yo‘q** — ko‘pincha nginx `api` uchun `saxar.uz` papkasidagi (faqat asosiy domenlar bilan chiqarilgan) faylni ulagan yoki aksincha.

Serverda tekshirish:

```bash
echo | openssl s_client -connect api.saxar.uz:443 -servername api.saxar.uz 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName
```

**Variant A — bitta sertifikat (tavsiya):** `api.saxar.uz` ni SAN ga qo‘shing (cert nomi odatda `saxar.uz`):

```bash
sudo certbot certonly --webroot -w /var/www/html --cert-name saxar.uz --expand \
  -d saxar.uz -d www.saxar.uz -d api.saxar.uz
```

Keyin nginx uchun:

```bash
sudo cp deploy/host-nginx/api.saxar.uz.shared-with-saxar-cert.conf /etc/nginx/sites-available/api.saxar.uz.conf
sudo nginx -t && sudo systemctl reload nginx
```

(`saxar.uz` va `api.saxar.uz` ikkalasi ham `/etc/letsencrypt/live/saxar.uz/` dan o‘sha sertni ishlatadi.)

**Variant B — alohida API sertifikati:** `live/api.saxar.uz/` bo‘lishi kerak:

```bash
sudo certbot certonly --webroot -w /var/www/html -d api.saxar.uz
```

Bu holda repodagi standart `deploy/host-nginx/api.saxar.uz.conf` (yo‘llar `.../live/api.saxar.uz/`) mos keladi.

**HSTS:** avval noto‘g‘ri sert bilan sayt ochilgan bo‘lsa, Chrome da `chrome://net-internals/#hsts` → *Delete domain security policies* → `api.saxar.uz` (sert serverda tuzatilgach).

### 5b) `saxar.uz` — `NET::ERR_CERT_COMMON_NAME_INVALID`

Brauzer `https://saxar.uz` uchun ham xuddi shu xatoni bersa — nginx shu `server_name` uchun **noto‘g‘ri** `ssl_certificate` bermoqda (masalan, boshqa sayt serti yoki `api` uchun fayl, yoki `default_server` boshqa blokda).

**Avvalo serverda diagnostika** (boshqa fayllarni o‘zgartirmaydi):

```bash
cd /opt/saxar && git pull && sudo bash deploy/diagnose_saxar_cert.sh
```

Boshqa joydagi konfigni ko‘rsatish uchun: `SAXAR_NGINX_CONF=/etc/nginx/sites-available/saxar.uz.conf sudo -E bash deploy/diagnose_saxar_cert.sh`

Tekshiruv (qisqa):

```bash
echo | openssl s_client -connect saxar.uz:443 -servername saxar.uz 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName
```

Chiqishda **Subject Alternative Name** ichida `saxar.uz` (va kerak bo‘lsa `www.saxar.uz`) bo‘lishi kerak. Yo‘q bo‘lsa:

```bash
sudo certbot certonly --webroot -w /var/www/html --cert-name saxar.uz --expand \
  -d saxar.uz -d www.saxar.uz
# api alohida sertda bo'lsa, alohida qator bilan api uchun §5a qiling
```

Keyin `deploy/host-nginx/saxar.uz.conf` dagi `ssl_certificate` / `ssl_certificate_key` yo‘llari **`/etc/letsencrypt/live/saxar.uz/`** bilan mos ekanini tekshiring (boshqa sayt papkasiga ulanmagan bo‘lsin), so‘ng:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Agar brauzer HSTS bilan “qotib” qolgan bo‘lsa: `chrome://net-internals/#hsts` → *Delete domain security policies* → `saxar.uz`.

### 5e) HTTPS ishlamayapti — **bitta skript** (`saxar.uz` + `www`)

`certbot --webroot` + repodagi `saxar.uz.conf` nusxalanadi; boshqa saytlarning `sites-enabled` matni o‘zgarmaydi.

```bash
cd /opt/saxar && git pull
export SAXAR_CERTBOT_EMAIL="sizning@email.uz"
sudo -E bash deploy/fix_saxar_https.sh
```

**Oldindan:** `saxar.uz` uchun **80** da `/.well-known/acme-challenge/` ochiq bo‘lsin (birinchi marta `saxar.uz.http-only.conf` ni `§6` bo‘yicha qo‘ygan bo‘lishingiz kerak). DNS `A` yozuvi server IP ga qarashi shart.

## 6) Host nginx (faqat yangi saytlar)

Loyiha ildizidan:

```bash
cd /opt/saxar
sudo cp deploy/host-nginx/saxar.uz.conf /etc/nginx/sites-available/saxar.uz.conf
sudo cp deploy/host-nginx/api.saxar.uz.conf /etc/nginx/sites-available/api.saxar.uz.conf
sudo ln -sf /etc/nginx/sites-available/saxar.uz.conf /etc/nginx/sites-enabled/saxar.uz.conf
sudo ln -sf /etc/nginx/sites-available/api.saxar.uz.conf /etc/nginx/sites-enabled/api.saxar.uz.conf
sudo nginx -t && sudo systemctl reload nginx
```

Sertifikat yo‘llari `saxar.uz` va `api.saxar.uz` uchun letsencrypt katalogiga mos kelishi kerak; boshqacha bo‘lsa, `ssl_certificate` qatorlarini tahrirlang.

## 7) Yangilash (pull + qayta build)

```bash
cd /opt/saxar
git pull
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build
```

Backend (API) ishlayotganini tekshirish:

```bash
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar ps
curl -sS http://127.0.0.1:18181/api/health/
```

`saxar.uz` uchun host nginx repoda yangilangan bo‘lsa (masalan `/api/` endi to‘g‘ridan-to‘g‘ri `18181` ga), faylni qayta nusxalab `nginx -t` va `reload` qiling — `remote_bootstrap.sh` buni avtomatik qiladi.

## GitHub — mahalliy mashinadan push

Loyiha ildizida:

```bash
git init
git remote add origin https://github.com/aiziyrak-coder/saxar.git
git add -A
git commit -m "Initial SaxarERP"
git branch -M main
git push -u origin main
```

Autentifikatsiya so‘ralsa — GitHub **PAT** yoki `gh auth login` / SSH kalit ishlating.

## 8) Mahalliy mashinadan Paramiko (avtomatik deploy)

Parolni repoga yozmang. Bir martalik PowerShell (parolni o‘zingiz qo‘ying):

```powershell
cd D:\SaharERP
pip install -r deploy/requirements-deploy.txt
$env:SAXAR_SSH_HOST = "167.71.53.238"
$env:SAXAR_SSH_USER = "root"
$env:SAXAR_SSH_PASSWORD = "BU_YERGA_PAROL"
# SSL uchun (ixtiyoriy; bo‘lmasa HTTP 80 qoladi):
$env:SAXAR_CERTBOT_EMAIL = "sizning@email.uz"
python deploy/deploy_remote.py
```

Parolni faylda saqlash (`.saxar_ssh` — `.gitignore` da):

```powershell
Set-Content -Path "$env:USERPROFILE\.saxar_ssh" -Value "PAROL" -NoNewline
$env:SAXAR_SSH_PASSWORD_FILE = "$env:USERPROFILE\.saxar_ssh"
python deploy/deploy_remote.py
```

Skript `deploy/remote_bootstrap.sh` ni serverga yuklab, `/opt/saxar` da `git pull`, Docker va nginx (faqat saxar) qadamini bajaradi.

## 9) `api.saxar.uz` ni to‘liq ishlatish (HTTPS + frontend)

1. DNS: `api.saxar.uz` uchun **A** yozuvi server IP ga qarab tursin (tekshiruv: `dig +short api.saxar.uz`).
2. `/opt/saxar/.env.saxar` da:
   - `VITE_PUBLIC_API_URL=https://api.saxar.uz/api`
   - `DJANGO_ALLOWED_HOSTS` qatorida `api.saxar.uz` bo‘lsin (`.env.saxar.example` dagidek).
   - `CORS_ALLOWED_ORIGINS` va `DJANGO_CSRF_TRUSTED_ORIGINS` da `https://saxar.uz` va `https://api.saxar.uz` bo‘lsin.
3. SSL: `export SAXAR_CERTBOT_EMAIL=...` va `bash deploy/remote_bootstrap.sh` yoki **§5a** dagi certbot. `NET::ERR_CERT_COMMON_NAME_INVALID` / HSTS bo‘lsa — sertda `api.saxar.uz` SAN bo‘lishi va nginx yo‘llari mos kelishi kerak; bitta sert uchun `deploy/host-nginx/api.saxar.uz.shared-with-saxar-cert.conf` dan nusxa oling.
4. Frontend qayta yig‘iladi: `docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build web`.

**Bitta domen (`saxar.uz` orqali `/api`)** ishlatilsa, DNS talab qilinmaydi; `VITE_PUBLIC_API_URL=/api` qoldiring.

## 10) Firebase (kirish xatolari `YOUR_WEB_API_KEY`)

Repoda maxfiy kalit yo‘q. Serverda `/opt/saxar/firebase-applet-config.json` faylini Firebase konsoldan olingan haqiqiy JSON bilan yarating (`.gitignore` da), keyin `docker compose ... up -d --build web` — Dockerfile bu fayl bor bo‘lsa, misol konfigni **nusxalamaydi**.
