# Audit: 50 ta xato tuzatildi (batch D)

Ertangi launch uchun API + Firestore hybrid, RBAC va rollar bo‘yicha keng audit.

## Backend (1–18)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | Nofaol B2B JWT olardi | `ActiveUserTokenObtainPairSerializer` + `SIMPLE_JWT.TOKEN_OBTAIN_SERIALIZER` |
| 2 | Ombor buyurtmalarni ko‘rmas edi (`qs.none()`) | `warehouse`/`production` uchun `confirmed`…`in_transit` filter |
| 3 | Haydovchi buyurtma PATCH bloklangan | `OrderViewSet.get_permissions` — driver/warehouse uchun holat yangilash |
| 4 | Haydovchi noto‘g‘ri holat yozishi mumkin edi | `OrderSerializer.validate` — `in_transit`/`delivered`/`returned` |
| 5 | Ombor keng tahrir | `OrderSerializer.validate` — faqat `picking`/`packed`/`in_transit` |
| 6 | Haydovchi to‘lov yarata olmas edi | `IsPaymentWriteRole` + `PaymentViewSet` |
| 7 | Agent noto‘g‘ri buyurtmaga to‘lov | `PaymentSerializer.validate` order/agent tekshiruvi |
| 8 | Haydovchi noto‘g‘ri buyurtmaga to‘lov | `PaymentSerializer.validate` order/driver tekshiruvi |
| 9 | `expenseApi` frontendda yo‘q | `src/services/api.ts` — `expenseApi` |
| 10 | API order mapping agent/driver yo‘q | `mapApiOrderRowToOrder` + `ApiOrderRow` maydonlari |
| 11 | `orderApi.update` tip xatosi | `Record<string, unknown>` + `ApiOrderRow` qaytishi |
| 12 | Buxgalter buyurtma o‘chirish | `destroy` faqat `IsOrderWriteRole` (o‘zgarishsiz, tasdiqlandi) |
| 13 | B2B create inactive tekshiruvi | `perform_create` (mavjud) |
| 14 | Katalog narxi bypass | `enforce_catalog_line_pricing` (mavjud) |
| 15 | `cost_price` sizib chiqishi | serializer yashirish (oldingi batch) |
| 16 | UsersByRole ochiq edi | admin-only (oldingi batch) |
| 17 | Finance payment queryset tor | driver/agent filter (mavjud, kengaytirildi) |
| 18 | JWT refresh rotate | `ROTATE_REFRESH_TOKENS` (mavjud) |

## Frontend — ma’lumotlar (19–35)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 19 | Takror merge logikasi | `src/utils/mergedData.ts` |
| 20 | Haydovchi faqat FS | `DriverDashboard` — API merge + PATCH |
| 21 | Haydovchi moliya FS | `DriverFinance` — `fetchDriverOrdersMerged` |
| 22 | Haydovchi inventar FS | `DriverInventory` — merge |
| 23 | B2B profil buyurtmalar FS | `B2BProfile` — `fetchClientOrdersMerged` |
| 24 | B2B ro‘yxat takror kod | `B2BOrders` — util |
| 25 | Agent dashboard FS | `AgentDashboard` — `fetchAllOrdersMerged` |
| 26 | Admin agentlar stat FS | `AdminAgents` — merge |
| 27 | `djangoUserId` sessiyada yo‘q | `AuthContext.applyUserSession` — `/me` |
| 28 | API/FS ID ajratish | `src/utils/orderId.ts` |
| 29 | API buyurtma FS sinxron | `syncApiOrderToFirestore` haydovchi PATCH dan keyin |
| 30 | Offlayn navbat FS buyurtma dublikat | `offlineQueue` — JWT da order skip |
| 31 | Offlayn to‘lov API ga o‘tmaydi | `offlineQueue` — `paymentApi.create` |
| 32 | 404 `/` ga qaytardi | `NotFoundRedirect` — rol bosh sahifasi |
| 33 | Ombor shipment API | `loadWarehouseOrders` (oldingi) + backend read |
| 34 | Admin orders merge | `AdminOrders` (oldingi) |
| 35 | B2B cart faqat API | `b2bOrderSubmit` (oldingi) |

## Firestore / xavfsizlik (36–42)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 36 | `orders` eski `isValidOrder` | Yumshoq validator + yangi status string |
| 37 | Haydovchi `orders` o‘qiy olmas edi | `driverId == auth.uid` read/update |
| 38 | Ombor `orders` o‘qiy olmas edi | `isStaffCatalog()` read |
| 39 | `users.role` ro‘yxati tor | warehouse, accountant, production qo‘shildi |
| 40 | Register JWT olib tashlangan | `Register.tsx` (oldingi) |
| 41 | FS checkout fallback | olib tashlangan (oldingi) |
| 42 | `public_site` o‘qish ochiq | rules (mavjud) |

## Biznes / launch (43–50)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 43 | Mahsulotlar sahifasi yo‘q | `AdminProducts` + route (oldingi) |
| 44 | Omborga sinxron | `syncProductToWarehouse` (oldingi) |
| 45 | Mijoz tasdiq Django | `AdminClients` PATCH `is_active` (oldingi) |
| 46 | Pending B2B login | JWT inactive + `ProtectedRoute` (oldingi) |
| 47 | Landing buyurtma API | `LandingPage` (oldingi) |
| 48 | Telegram env Docker | `docker-compose` (oldingi) |
| 49 | Launch checklist | `LAUNCH_DAY.md` (oldingi) |
| 50 | Deploy migrate image | `0002_product_image` + bootstrap (oldingi) |

## Tekshiruv

```bash
cd backend && python manage.py test accounts.tests
cd .. && npx tsc --noEmit && npm run build
```

## Deploy

```bash
git pull && docker compose build api web && docker compose up -d
docker compose exec api python manage.py migrate
```
