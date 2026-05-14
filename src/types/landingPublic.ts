import { BRAND } from '../constants/branding';

/** Sliderdagi bitta banner */
export interface LandingBannerSlide {
  id: number;
  title: string;
  subtitle: string;
  /** Tailwind gradient klasslari, masalan: from-emerald-100 via-teal-50 to-cyan-50 */
  bg: string;
  /** To‘liq rasm URL (https...) */
  image: string;
  badge: string;
}

/** Hero ostidagi 4 ta kartochkadan biri */
export interface LandingFeatureCard {
  title: string;
  body: string;
}

/** To‘rtta tezkor afzallik qatori */
export interface LandingQuickPoint {
  title: string;
  subtitle: string;
}

/** Hero matnlari — `{erp}` yozuvi avtomatik {BRAND.erpProductName} bilan almashtiriladi */
export interface LandingHeroCopy {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  lead: string;
  ctaCatalog: string;
  /** `{erp}` placeholder */
  ctaErp: string;
}

/** Banner ustidagi kichik stat kartochka */
export interface LandingStatCard {
  title: string;
  subtitle: string;
}

export interface LandingPublicCopy {
  version: 1;
  hero: LandingHeroCopy;
  /** Aynan 4 ta slayd */
  banners: LandingBannerSlide[];
  /** 4 ta: ishlab chiqarish, yetkazish, B2B, ERP (oxirgisi qora blok) */
  featureCards: LandingFeatureCard[];
  /** ERP qora kartochka tugmasi */
  erpCardCta: string;
  quickPoints: LandingQuickPoint[];
  statCard: LandingStatCard;
}

export function applyLandingErpPlaceholders(text: string): string {
  return text.replace(/\{erp\}/g, BRAND.erpProductName);
}

function defaultHeroLead(): string {
  return `${BRAND.description} B2B hamkorlar uchun ulgurji narxlar, sovuqda saqlab yetkazish va yagona {erp} orqali buyurtmadan hisobotgacha jarayonlarni bir joyda boshqaring.`;
}

/** Firestore / localStorage yo‘q bo‘lganda ishlatiladigan boshlang‘ich nusxa */
export function getDefaultLandingPublicCopy(): LandingPublicCopy {
  return {
    version: 1,
    hero: {
      eyebrow: `${BRAND.name} kompaniyasi`,
      headline: 'Tabiiylik, sifat va ',
      headlineAccent: 'ishonch',
      lead: defaultHeroLead(),
      ctaCatalog: 'Katalogni ko‘rish',
      ctaErp: '{erp} ga o‘tish',
    },
    banners: [
      {
        id: 1,
        title: "Saxar — sifatli go'sht mahsulotlari",
        subtitle: "Tabiiy va ekologik toza go'sht-kolbasa mahsulotlari",
        bg: 'from-emerald-100 via-teal-50 to-cyan-50',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200',
        badge: 'SAXAR',
      },
      {
        id: 2,
        title: 'B2B hamkorlar uchun',
        subtitle: 'Ulgurji narxlar va tezkor yetkazib berish',
        bg: 'from-amber-50 via-orange-50 to-stone-50',
        image: 'https://images.unsplash.com/photo-1614961909012-73b4ece2c51a?w=1200',
        badge: 'B2B',
      },
      {
        id: 3,
        title: 'Sifat kafolati',
        subtitle: 'ISO 22000 va HACCP sertifikatlari bilan',
        bg: 'from-sky-50 via-cyan-50 to-slate-50',
        image: 'https://images.unsplash.com/photo-1607058332818-32e5e4a60ffe?w=1200',
        badge: 'SIFAT',
      },
      {
        id: 4,
        title: "Yangi so'yilgan go'sht",
        subtitle: "Har kuni yangi va yangi so'yilgan go'sht",
        bg: 'from-violet-50 via-fuchsia-50 to-zinc-50',
        image: 'https://images.unsplash.com/photo-1588347818036-558601350947?w=1200',
        badge: 'YANGI',
      },
    ],
    featureCards: [
      {
        title: 'Zamonaviy ishlab chiqarish',
        body: "HACCP va ISO 22000 talablari asosida partiyalar bo'yicha nazorat, xavfsizlik va izchil sifat.",
      },
      {
        title: 'Sovuqda saqlash va yetkazish',
        body: "Mahsulot sizga yetguncha harorat tartibi buzilmaydi: -18°C gacha saqlash va xavfsiz transport.",
      },
      {
        title: 'B2B hamkorlik',
        body: "STIR va shartnoma asosida ulgurji narxlar, qarz limiti va akkaunt bo'yicha shaffof hisob-kitob.",
      },
      {
        title: '{erp}',
        body: "Admin, ombor, buxgalter, agent, haydovchi — rollar bo'yicha kirish. Ro'yxatdan o'tish va kirish.",
      },
    ],
    erpCardCta: "Kirish / ro'yxatdan o'tish",
    quickPoints: [
      { title: 'Tezkor yetkazish', subtitle: '24 soat ichida' },
      { title: 'Sifat kafolati', subtitle: '100% tabiiy' },
      { title: 'Sovuq saqlash', subtitle: '-18°C gacha' },
      { title: "24/7 qo'llab-quvvatlash", subtitle: 'Har doim yordam' },
    ],
    statCard: {
      title: "500+ Do'konlar",
      subtitle: 'Bizning hamkorlarimiz',
    },
  };
}

function mergeFour<T>(remote: T[] | undefined, fallback: T[]): T[] {
  if (!remote || remote.length !== 4) return [...fallback];
  return remote.map((item, i) => ({ ...fallback[i], ...item })) as T[];
}

/** Serverdan kelgan qisman ma’lumotni xavfsiz to‘ldirish */
export function mergeLandingPublicCopy(remote: Partial<LandingPublicCopy> | null | undefined): LandingPublicCopy {
  const d = getDefaultLandingPublicCopy();
  if (!remote || typeof remote !== 'object') return d;
  return {
    version: 1,
    hero: { ...d.hero, ...remote.hero },
    banners: mergeFour(remote.banners as LandingBannerSlide[] | undefined, d.banners),
    featureCards: mergeFour(remote.featureCards as LandingFeatureCard[] | undefined, d.featureCards),
    erpCardCta: remote.erpCardCta?.trim() || d.erpCardCta,
    quickPoints: mergeFour(remote.quickPoints as LandingQuickPoint[] | undefined, d.quickPoints),
    statCard: { ...d.statCard, ...remote.statCard },
  };
}
