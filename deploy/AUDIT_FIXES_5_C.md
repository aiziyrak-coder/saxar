# Audit: 5 qo‘shimcha tuzatish (to‘plam C)

| # | Muammo | Tuzatish |
|---|--------|----------|
| 1 | Admin buyurtma yaratish faqat Firestore | `orderApi.create` + FS nusxa; `reloadApiOrders` |
| 2 | Admin mijoz yaratish Django siz | `djangoUsersApi.create` + FS `users`/`clients` + `djangoUserId` |
| 3 | Agent buyurtma faqat Firestore | `AgentOrder`: `orderApi.create` + `resolveDjangoClientId` |
| 4 | Ombor Django buyurtmalarni ko‘rmaydi | `loadWarehouseShipmentOrders`; status `orderApi.update` |
| 5 | Admin holat/to‘lov API ga ulanmagan | Buyurtma holati tugmalari; `paymentApi.create` + mijoz tanlash |

Qoʻshimcha: `Register` demo fallback `status: pending`.
