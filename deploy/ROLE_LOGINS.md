# Saxar ERP — barcha rollar uchun login

Telefon formatida kiriladi: `+998 90 000 01 0X` (bo‘shliqlar ixtiyoriy).  
Django login: `99890000010X@saxar.local` + quyidagi parol.

Serverda akkauntlar: `docker compose exec api python manage.py ensure_role_users`

| Rol | Telefon | Parol | Kabinet |
|-----|---------|-------|---------|
| **Admin** | +998 90 000 01 01 | `DevRole_Admin!` | `/admin` |
| **Buxgalter** | +998 90 000 01 02 | `DevRole_Accountant!` | `/accountant` |
| **Ombor** | +998 90 000 01 03 | `DevRole_Warehouse!` | `/warehouse` |
| **Ishlab chiqarish** | +998 90 000 01 04 | `DevRole_Production!` | `/production` |
| **B2B mijoz** | +998 90 000 01 05 | `DevRole_B2B!` | `/b2b` |
| **Agent** | +998 90 000 01 06 | `DevRole_Agent!` | `/agent` |
| **Haydovchi** | +998 90 000 01 07 | `DevRole_Driver!` | `/driver` |

## Qanday kirish

1. https://saxar.uz/login (yoki lokal `/login`)
2. **Rol tugmasini** bosing (masalan «Admin / Direktor») — telefon va parol avtomatik to‘ldiriladi.
3. Yoki telefon va parolni **qo‘lda** kiriting → **Kirish**.

Firebase sozlanmagan bo‘lsa ham shu demo akkauntlar ishlaydi (localStorage + Django JWT).

## Qo‘lda standart parol (faqat `VITE_ALLOW_DEMO_LOGIN=true` bo‘lsa)

Bo‘sh parol bilan kirishda: `SaxarERP123!` (B2B demo, Firebase yo‘q rejim).

## Xavfsizlik (prod)

- Launchdan keyin parollarni almashtiring.
- Firebase to‘liq ulanganda `VITE_SHOW_DEMO_ROLE_LOGIN=false` qilish mumkin.
