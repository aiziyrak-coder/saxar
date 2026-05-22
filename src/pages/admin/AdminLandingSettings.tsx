import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader2, Image as ImageIcon, RotateCcw, Save, ExternalLink, Info } from 'lucide-react';
import {
  fetchLandingPublicCopy,
  notifyLandingPublicUpdated,
  saveLandingPublicCopy,
} from '../../services/landingSettings';
import {
  applyLandingErpPlaceholders,
  getDefaultLandingPublicCopy,
  type LandingPublicCopy,
} from '../../types/landingPublic';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const BANNER_LABELS = ['1-slayd', '2-slayd', '3-slayd', '4-slayd'] as const;
const FEATURE_LABELS = ['Ishlab chiqarish', 'Yetkazish', 'B2B', 'ERP kartochka'] as const;
const QUICK_LABELS = ['1-qator', '2-qator', '3-qator', '4-qator'] as const;

export default function AdminLandingSettings() {
  const [draft, setDraft] = useState<LandingPublicCopy>(() => getDefaultLandingPublicCopy());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetchLandingPublicCopy()
      .then(setDraft)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setHero = (key: keyof LandingPublicCopy['hero'], value: string) => {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: value } }));
  };

  const setBannerField = (index: number, key: keyof LandingPublicCopy['banners'][0], value: string | number) => {
    setDraft((d) => {
      const banners = d.banners.map((b, i) => (i === index ? { ...b, [key]: value } : b));
      return { ...d, banners };
    });
  };

  const setFeature = (index: number, key: 'title' | 'body', value: string) => {
    setDraft((d) => {
      const featureCards = d.featureCards.map((c, i) => (i === index ? { ...c, [key]: value } : c));
      return { ...d, featureCards };
    });
  };

  const setQuick = (index: number, key: 'title' | 'subtitle', value: string) => {
    setDraft((d) => {
      const quickPoints = d.quickPoints.map((q, i) => (i === index ? { ...q, [key]: value } : q));
      return { ...d, quickPoints };
    });
  };

  const setStat = (key: keyof LandingPublicCopy['statCard'], value: string) => {
    setDraft((d) => ({ ...d, statCard: { ...d.statCard, [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setBanner(null);
    const res = await saveLandingPublicCopy(draft);
    setSaving(false);
    setBanner({ kind: res.ok ? 'ok' : 'err', text: res.message });
    if (res.ok) notifyLandingPublicUpdated();
  };

  const handleResetForm = () => {
    setDraft(getDefaultLandingPublicCopy());
    setBanner({ kind: 'ok', text: 'Standart matnlar forma ga yuklandi. Saqlashni unutmang.' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Bosh sahifa (landing)</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Sayt boshidagi hero, slayd rasmlari, qisqa afzalliklar va ERP blok matnlari shu yerdan boshqariladi.
            Matnda <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{'{erp}'}</code> yozsangiz,
            ochiq sahifada u avtomatik ERP mahsulot nomiga almashtiriladi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={reload} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Yangilash
          </Button>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            Saytni ko‘rish
          </Link>
        </div>
      </div>

      <div
        className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          banner?.kind === 'ok'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
            : banner?.kind === 'err'
              ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100'
              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
        }`}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          {banner ? (
            <p>{banner.text}</p>
          ) : (
            <p>
              Ma’lumotlar odatda Firestore <code className="text-xs">public_site / landing_v1</code> da saqlanadi.
              Firebase yo‘q bo‘lsa, faqat dastlabki matnlar ishlatiladi (yoki faqat DEV rejimida brauzer xotirasi).
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hero (yuqori blok)</h2>
            <Input label="Yuqori yorliq (eyebrow)" value={draft.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} />
            <Input label="Sarlavha — asosiy qism" value={draft.hero.headline} onChange={(e) => setHero('headline', e.target.value)} />
            <Input label="Sarlavha — rangli qism" value={draft.hero.headlineAccent} onChange={(e) => setHero('headlineAccent', e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tavsif (lead)</label>
              <textarea
                value={draft.hero.lead}
                onChange={(e) => setHero('lead', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Katalog tugmasi" value={draft.hero.ctaCatalog} onChange={(e) => setHero('ctaCatalog', e.target.value)} />
              <Input
                label="ERP tugmasi (masalan: {erp} ga o‘tish)"
                value={draft.hero.ctaErp}
                onChange={(e) => setHero('ctaErp', e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ko‘rinish namunasi: {applyLandingErpPlaceholders(draft.hero.ctaErp)}
            </p>
          </Card>

          <Card className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Slayd bannerlar (4 ta)</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Fon: Tailwind gradient klasslari, masalan{' '}
              <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">from-emerald-100 via-teal-50 to-cyan-50</code>.
              Rasm: to‘liq HTTPS havola.
            </p>
            {draft.banners.map((b, i) => (
              <div key={b.id} className="space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{BANNER_LABELS[i]}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Sarlavha" value={b.title} onChange={(e) => setBannerField(i, 'title', e.target.value)} />
                  <Input label="Podzagolovok" value={b.subtitle} onChange={(e) => setBannerField(i, 'subtitle', e.target.value)} />
                  <Input label="Badge (kichik yorliq)" value={b.badge} onChange={(e) => setBannerField(i, 'badge', e.target.value)} />
                  <Input label="Gradient (bg klasslari)" value={b.bg} onChange={(e) => setBannerField(i, 'bg', e.target.value)} />
                  <div className="sm:col-span-2">
                    <ImageUpload
                      label="Slayd rasmi"
                      folder="landing"
                      value={b.image}
                      onChange={(image) => setBannerField(i, 'image', image)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <div className={`h-16 w-28 shrink-0 bg-gradient-to-r ${b.bg}`} aria-hidden />
                  {b.image ? (
                    <img src={resolveMediaUrl(b.image)} alt="" className="h-16 max-w-[200px] object-cover" />
                  ) : null}
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-5 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hero ostidagi 4 kartochka</h2>
            {draft.featureCards.map((c, i) => (
              <div key={FEATURE_LABELS[i]} className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{FEATURE_LABELS[i]}</p>
                <Input label="Sarlavha" value={c.title} onChange={(e) => setFeature(i, 'title', e.target.value)} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Matn</label>
                  <textarea
                    value={c.body}
                    onChange={(e) => setFeature(i, 'body', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ))}
            <Input
              label="Qora ERP kartochkadagi tugma matni"
              value={draft.erpCardCta}
              onChange={(e) => setDraft((d) => ({ ...d, erpCardCta: e.target.value }))}
            />
          </Card>

          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tezkor afzalliklar (4 qator)</h2>
            {draft.quickPoints.map((q, i) => (
              <div key={QUICK_LABELS[i]} className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <Input label={`${QUICK_LABELS[i]} — sarlavha`} value={q.title} onChange={(e) => setQuick(i, 'title', e.target.value)} />
                <Input label="Izoh" value={q.subtitle} onChange={(e) => setQuick(i, 'subtitle', e.target.value)} />
              </div>
            ))}
          </Card>

          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Slayd ustidagi kichik statistik kartochka</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Sarlavha" value={draft.statCard.title} onChange={(e) => setStat('title', e.target.value)} />
              <Input label="Podzagolovok" value={draft.statCard.subtitle} onChange={(e) => setStat('subtitle', e.target.value)} />
            </div>
          </Card>

          <div className="flex flex-wrap gap-3 pb-8">
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </Button>
            <Button type="button" variant="secondary" onClick={handleResetForm} disabled={saving} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Standart matnlarga qaytarish
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
