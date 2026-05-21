# 20 ta katta kamchilik — tuzatildi (2026-05-20)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | API 401 Firebase sessiyasini ham o‘chirardi | JWT bo‘lmaganda `clearApiSession` chaqirilmaydi |
| 2 | Refresh token ishlatilmas edi | `api.ts` — 401 da `/accounts/auth/refresh/` |
| 3 | JWT 5 daqiqada tugardi | `SIMPLE_JWT` — 12 soat access, 7 kun refresh |
| 4 | Katalog API `AllowAny` — har kim yozardi | `IsCatalogReadOrStaffWrite` / `IsStaffRole` |
| 5 | To‘lovlar barcha mijozlarga ochiq edi | `PaymentViewSet` queryset rol bo‘yicha filtr |
| 6 | Xarajatlar hammaga ochiq | Faqat admin/accountant |
| 7 | `users/role/` admin emas, hamma ko‘ra olardi | `IsAdminRole` qo‘shildi |
| 8 | B2B ro‘yxatdan o‘tish Django ga yozilmas edi | `register-b2b` + `djangoUserId` Firestore da |
| 9 | Umumiy parol `SaxarERP123!` | Ro‘yxatdan o‘tishda o‘z paroli majburiy |
| 10 | `pending` mijoz to‘liq B2B ga kirdi | `ProtectedRoute` → `/b2b/profile` |
| 11 | Firestore `create(customId)` `updateDoc` xato | `setDoc(..., { merge: true })` |
| 12 | B2B buyurtmalar Firebase UID bilan API filter | Avval Firestore, keyin `djangoUserId` |
| 13 | Landing buyurtma noto‘g‘ri API payload | Django `client` + `items` formati |
| 14 | Narx/limit inputlari saqlanmas edi | `PlatformSettings` + AdminSettings saqlash |
| 15 | Sessiya vaqti sozlamadan olinmas edi | `platform/settings/public/` + `PlatformGlobal` |
| 16 | RBAC foydalanuvchi: avval FS, keyin Django | Django birinchi, keyin Firestore `djangoUserId` |
| 17 | Admin yaratilgan user uchun majburiy parol yo‘q | `AdminUserCreateSerializer` — parol majburiy |
| 18 | Telegram env Docker da yo‘q edi | `TELEGRAM_BOT_TOKEN` compose da |
| 19 | Profil yo‘q user `b2b` active deb kirardi | `minimalUserFromAuth` → `status: pending` |
| 20 | B2B buyurtma yaratishda `client` o‘rnatilmas edi | `perform_create` — `b2b` uchun `client=user` |

## Deploy

```bash
python manage.py migrate
python manage.py ensure_role_users
docker compose -f docker-compose.saxar-prod.yml --env-file .env.saxar up -d --build
```

`.env.saxar` ga qo‘shing: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`
