# Ertangi ishga tushirish — real biznes kun tartibi

Bu hujjat **ertaga saxar.uz** da dasturni birinchi marta real mijozlar va xodimlar bilan ishlatish uchun. Har qadam bajarilguncha keyingisiga o‘ting.

## Kechqurun (bugun) — server

```bash
cd /opt/saxar
git pull
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar exec -T api python manage.py migrate --noinput
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar exec -T api python manage.py ensure_role_users
bash deploy/post_deploy_verify.sh
```

`.env.saxar` tekshiruvi:

- `VITE_PUBLIC_API_URL=/api` (agar `api.saxar.uz` DNS yo‘q bo‘lsa)
- `DJANGO_ALLOWED_HOSTS` da `saxar.uz` bor
- `VITE_ALLOW_DEMO_LOGIN=false`
- `TELEGRAM_BOT_TOKEN` (ixtiyoriy, lekin buyurtma xabarlari uchun)

## Ertalab — admin (30 daqiqa)

1. **Kirish:** `https://saxar.uz/login` — admin telefon + parol (`ensure_role_users` yoki o‘zingiz yaratgan).
2. JWT: kirishdan keyin **Mahsulotlar** sahifasi ochilishi kerak (JWT yo‘q bo‘lsa — chiqib qayta kiring).
3. **Mahsulotlar → Kategoriya** (kamida 1 ta, masalan «Kolbasa»).
4. **Mahsulotlar → Yangi mahsulot** (narxlar, SKU, B2B faol).
5. **«Omborga sinxron»** tugmasi — barcha mahsulotlarni Firestore ga yozadi (ombor FIFO uchun **shart**).
6. **Mijozlar** — kutilayotgan B2B arizalarni **Tasdiqlash** (Django `is_active` ham yoqiladi).
7. **Buyurtmalar** — ro‘yxatda API buyurtmalar ko‘rinishi; holatni `confirmed` → `picking` → `packed` qiling.

## Ertalab — B2B mijoz

1. Ro‘yxatdan o‘tish → **pending** (katalog yopiq).
2. Admin tasdiqlagach → **chiqib qayta kirish** (JWT olish uchun).
3. Katalog → savat → buyurtma (faqat API; xato bo‘lsa admin bilan bog‘laning).
4. **Buyurtmalar / Moliya** — API orqali ko‘rinadi.

## Ertalab — ombor

1. Admin buyurtmani `confirmed` qiladi.
2. **Ombor → Chiqim** — buyurtma ro‘yxatda chiqishi kerak (Django + FS sinxron).
3. **Yuklab berish** — FIFO; mahsulot ID Django bilan mos (sinxron qilingan bo‘lishi kerak).

## Ertalab — agent (agar ishlatilsa)

1. JWT bilan kirish.
2. Mijoz **Django bilan bog‘langan** bo‘lishi kerak (`djangoUserId`).
3. Buyurtma — API orqali.

## Muammo chiqsa — tezkor diagnostika

| Belgilar | Tekshirish |
|----------|------------|
| 400 Bad Request | `DJANGO_ALLOWED_HOSTS`, nginx Host |
| Mahsulotlar/JWT yo‘q | Qayta login; `ensure_role_users` |
| Buyurtma yuborilmaydi | Mijoz `djangoUserId`; admin tasdiq; JWT |
| Omborda buyurtma yo‘q | `Omborga sinxron`; buyurtma API dan keyin FS sinxron |
| Ikki nusxa buyurtma | Faqat bitta manba — API (tuzatilgan) |

```bash
curl -sS http://127.0.0.1:18181/api/health/
docker compose -f docker-compose.saxar-prod.yml logs api --tail 80
```

## Muhim qoidalar

- **Bitta haqiqat manbasi:** buyurtma va narxlar — **Django API**; Firestore — ombor va eski ma’lumotlar uchun nusxa.
- **Tasdiqlanmagan B2B** buyurtma bera olmaydi (API ham, UI ham).
- **Prod da demo parol yo‘q** (`VITE_ALLOW_DEMO_LOGIN=false`).
