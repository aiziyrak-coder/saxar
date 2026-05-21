# Audit: 5 qo‘shimcha tuzatishlar

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | B2B `PATCH` buyurtma `status` / `paid_amount` | `OrderViewSet`: update/destroy B2B uchun `PermissionDenied`; serializer maydonlari `read_only` |
| 2 | Ombor/ishlab chiqarish barcha to‘lovlarni ko‘radi | `PaymentViewSet`: faqat `admin`, `accountant`, `agent`, `driver` |
| 3 | Firestore tasdiq, Django `is_active=False` | `AdminClients`: tasdiq/rad etishda `djangoUsersApi.patch(is_active)` |
| 4 | `status` yo‘q profil → `active` | `AuthContext.parseUserStatus`: default `pending` |
| 5 | B2B buyurtmada client narxi | `enforce_catalog_line_pricing`: server `b2b_price` / `base_price` |
