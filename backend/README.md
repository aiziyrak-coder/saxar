# SaharERP Backend (Django REST)

Bu papka FoodERP / SaharERP loyihasi uchun **Django REST backend** ni o'z ichiga oladi. Frontend `D:\SaharERP` ichidagi React ilova, backend esa `D:\SaharERP\backend`.

## 1. O'rnatish

```bash
cd D:\SaharERP\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Ma'lumotlar bazasi: `DATABASE_URL` o'rnatilmasa — **SQLite** (dev). Docker / prod uchun **PostgreSQL**:

```env
DATABASE_URL=postgresql://USER:PASSWORD@host:5432/saxar
```

Butun stack (Postgres + API + frontend Nginx): loyiha ildizidan `docker compose up --build`.

## 2. Migratsiyalar va admin

```bash
cd D:\SaharERP\backend
venv\Scripts\activate

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## 3. Serverni ishga tushirish

```bash
python manage.py runserver 8000
```

API lar:

- JWT login: `POST /api/accounts/auth/login/`
- B2B ro'yxatdan o'tish: `POST /api/accounts/auth/register-b2b/`
- Joriy foydalanuvchi: `GET /api/accounts/auth/me/`
- Buyurtmalar: `GET/POST /api/orders/`
- Mahsulotlar: `GET/POST /api/products/`
- Ombor partiyalari: `GET/POST /api/inventory-batches/`
- To'lovlar: `GET/POST /api/payments/`
- Xarajatlar: `GET/POST /api/expenses/`

Frontenddan JWT bilan ishlash uchun `Authorization: Bearer <token>` headeri yuboriladi.

## 4. Sog'liq tekshiruvi

- `GET /api/health/` — DB bilan readiness (`DJANGO_HEALTH_CHECK_DB=0` bo'lsa faqat jarayon).

