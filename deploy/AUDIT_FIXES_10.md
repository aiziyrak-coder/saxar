# Audit: 10 qo‘shimcha tuzatishlar

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | B2B savatcha faqat Firestore | `submitB2BOrder` — API + Firestore fallback (`B2BCart.tsx`) |
| 2 | B2B finans API `uid` bilan filtrlash | `djangoUserId` bo‘yicha filter; akt sverka balansi eski→yangi |
| 3 | B2B buyurtmalar FS ustun | API + Firestore birlashtirish, dublikat yo‘q |
| 4 | Katalog `clientApproved=true` | `userData.status === 'active'` |
| 5 | B2B ro‘yxat `is_active=True` | `RegisterB2BSerializer`: `is_active=False` |
| 6 | B2B buyurtmada `status` manipulyatsiya | `perform_create` + serializer: majburiy `pending` |
| 7 | To‘lov API — B2B boshqa mijozga yozish | `PaymentSerializer` maydon cheklovi; create faqat staff |
| 8 | Ombor chiqim qisman FIFO | Oldindan `checkFifoAvailability`; keyin `deductFIFO` |
| 9 | `deductFIFO` race | Firestore `runTransaction` |
| 10 | Demo login xavfsizligi | `docker-compose.yml` demo default `false`; demo B2B `pending` |

Qoʻshimcha: mahsulot `retrieve` da `cost_price` yashirish (staffdan tashqari).
