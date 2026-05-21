# Audit: yana 10 ta tuzatish (to‘plam B)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | Katalog listda `cost_price` ochiq | `ProductListSerializer.to_representation` — staffdan tashqari yashirish |
| 2 | Ombor/ishlab chiqarish buyurtmani PATCH qiladi | `IsOrderWriteRole`; warehouse/production queryset `none` |
| 3 | Admin buyurtmalar faqat Firestore | `AdminOrders`: Django API + FS birlashtirish |
| 4 | Firestore rules: hammaga yozish | `products`/`clients`/`categories`/`brands`/`inventory` qoidalari qattiqroq |
| 5 | Django `is_active` e’tiborsiz | `fetchDjangoMe` + `AuthContext`; `ProtectedRoute` inactive |
| 6 | Agent/admin buyurtmada client narxi | `enforce_catalog_line_pricing` barcha yaratishlarda |
| 7 | JWT olinmasa ham login OK | `Login`: staff uchun JWT majburiy, xato + signOut |
| 8 | B2B FS fallback — client narx | `submitB2BOrder` faqat API, FS fallback olib tashlandi |
| 9 | Landing checkout FS fallback | `submitB2BOrder` ishlatiladi |
| 10 | UI `costPrice` leak | Landing/B2B katalogda `costPrice: 0` |
