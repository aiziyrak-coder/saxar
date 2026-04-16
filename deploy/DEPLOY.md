# SaxarERP — saxar.uz va api.saxar.uz deploy

Bu yo‘riqnoma **mavjud nginx saytlariga tegmaydi**: faqat `sites-available` / `sites-enabled` ga **yangi** ikkita fayl qo‘shiladi va Docker stack **faqat** `127.0.0.1:18180` (frontend) va `127.0.0.1:18181` (API) da ishlaydi.

## 0) Xavfsizlik

- Chat orqali yuborilgan server parolini **darhol o‘zgartiring** va root uchun **SSH kalit** (`ssh-ed25519`) ishlating.
- GitHub push uchun **Personal Access Token** yoki SSH kalit ishlating; parolni repoga yozmang.

## 1) DNS

- `A` yozuv: `saxar.uz` → server IP  
- `A` yozuv: `www.saxar.uz` → server IP (ixtiyoriy)  
- `A` yozuv: `api.saxar.uz` → server IP  

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

Misol (nginx plugin — mavjud nginx konfigni **o‘zgartirmasdan**, faqat sert olish uchun webroot ham ishlatiladi; sizda certbot odatiy bo‘lsa):

```bash
sudo certbot certonly --nginx -d saxar.uz -d www.saxar.uz
sudo certbot certonly --nginx -d api.saxar.uz
```

Agar `options-ssl-nginx.conf` yo‘q bo‘lsa, certbot o‘zi yaratadi yoki `ssl_dhparam` qatorlarini vaqtincha izohlab qo‘ying.

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
