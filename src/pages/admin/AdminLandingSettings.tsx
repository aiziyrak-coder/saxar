import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Loader2,
  Image as ImageIcon,
  RotateCcw,
  Save,
  ExternalLink,
  Layout,
  Layers,
  Sparkles,
  ListChecks,
  Globe,
  Eye,
} from 'lucide-react';
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
import { hasDjangoJwt } from '../../services/djangoAuth';
import DjangoApiReconnect from '../../components/DjangoApiReconnect';
import { BRAND } from '../../constants/branding';

type TabId = 'hero' | 'slides' | 'features' | 'quick' | 'seo' | 'preview';

const TABS: { id: TabId; label: string; icon: typeof Layout }[] = [
  { id: 'hero', label: 'Hero', icon: Layout },
  { id: 'slides', label: 'Slaydlar', icon: ImageIcon },
  { id: 'features', label: 'Kartochkalar', icon: Layers },
  { id: 'quick', label: 'Afzalliklar', icon: ListChecks },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'preview', label: 'Ko‘rinish', icon: Eye },
];

const BANNER_LABELS = ['1-slayd', '2-slayd', '3-slayd', '4-slayd'] as const;
const FEATURE_LABELS = ['Ishlab chiqarish', 'Yetkazish', 'B2B', 'ERP kartochka'] as const;
const QUICK_LABELS = ['1-qator', '2-qator', '3-qator', '4-qator'] as const;

const GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: 'Yashil', value: 'from-emerald-100 via-teal-50 to-cyan-50' },
  { label: 'Qizg\'alt', value: 'from-amber-50 via-orange-50 to-stone-50' },
  { label: 'Moviy', value: 'from-sky-50 via-cyan-50 to-slate-50' },
  { label: 'Binafsha', value: 'from-violet-50 via-fuchsia-50 to-zinc-50' },
  { label: 'Kulrang', value: 'from-slate-100 via-zinc-50 to-stone-100' },
];

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function AdminLandingSettings() {
  const [draft, setDraft] = useState<LandingPublicCopy>(() => getDefaultLandingPublicCopy());
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [tab, setTab] = useState<TabId>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [apiLinked, setApiLinked] = useState(hasDjangoJwt());

  const dirty = useMemo(
    () => savedSnapshot !== '' && JSON.stringify(draft) !== savedSnapshot,
    [draft, savedSnapshot]
  );

  const reload = useCallback(() => {
    setLoading(true);
    fetchLandingPublicCopy()
      .then((data) => {
        setDraft(data);
        setSavedSnapshot(JSON.stringify(data));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setHero = (key: keyof LandingPublicCopy['hero'], value: string) => {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: value } }));
  };

  const setSeo = (key: 'pageTitle' | 'metaDescription', value: string) => {
    setDraft((d) => ({
      ...d,
      seo: { pageTitle: d.seo?.pageTitle ?? '', metaDescription: d.seo?.metaDescription ?? '', [key]: value },
    }));
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
    if (res.ok) {
      setSavedSnapshot(JSON.stringify(draft));
      notifyLandingPublicUpdated();
    }
  };

  const handleResetForm = () => {
    const d = getDefaultLandingPublicCopy();
    setDraft(d);
    setBanner({ kind: 'ok', text: 'Standart matnlar yuklandi. Saqlash tugmasini bosing.' });
  };

  if (!apiLinked || !hasDjangoJwt()) {
    return (
      <DjangoApiReconnect
        title="Bosh sahifa sozlamalari"
        onConnected={() => {
          setApiLinked(true);
          reload();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Bosh sahifa (landing)</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Matnlar va rasmlar <strong>Django serverda</strong> saqlanadi — barcha qurilmalarda bir xil ko‘rinadi.
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{'{erp}'}</code>
            → {BRAND.erpProductName}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={reload} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Qayta yuklash
          </Button>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            <ExternalLink className="h-4 w-4" />
            Saytni ochish
          </Link>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {tab === 'hero' && (
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Hero (yuqori blok)</h2>
              <Input label="Yuqori yorliq" value={draft.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Sarlavha" value={draft.hero.headline} onChange={(e) => setHero('headline', e.target.value)} />
                <Input
                  label="Rangli qism"
                  value={draft.hero.headlineAccent}
                  onChange={(e) => setHero('headlineAccent', e.target.value)}
                />
              </div>
              <TextArea label="Tavsif" value={draft.hero.lead} onChange={(v) => setHero('lead', v)} rows={4} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Katalog tugmasi" value={draft.hero.ctaCatalog} onChange={(e) => setHero('ctaCatalog', e.target.value)} />
                <Input label="ERP tugmasi" value={draft.hero.ctaErp} onChange={(e) => setHero('ctaErp', e.target.value)} />
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                ERP tugmasi ko‘rinishi: {applyLandingErpPlaceholders(draft.hero.ctaErp)}
              </p>
            </Card>
          )}

          {tab === 'slides' && (
            <Card className="p-5 sm:p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                Slayd bannerlar (4 ta)
              </h2>
              {draft.banners.map((b, i) => (
                <div key={b.id} className="space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{BANNER_LABELS[i]}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Sarlavha" value={b.title} onChange={(e) => setBannerField(i, 'title', e.target.value)} />
                    <Input label="Podzagolovok" value={b.subtitle} onChange={(e) => setBannerField(i, 'subtitle', e.target.value)} />
                    <Input label="Badge" value={b.badge} onChange={(e) => setBannerField(i, 'badge', e.target.value)} />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Fon gradienti</label>
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                        value={b.bg}
                        onChange={(e) => setBannerField(i, 'bg', e.target.value)}
                      >
                        {GRADIENT_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                        <option value={b.bg}>Boshqa (qo‘lda)</option>
                      </select>
                      <Input
                        className="mt-2"
                        label="Gradient klasslari"
                        value={b.bg}
                        onChange={(e) => setBannerField(i, 'bg', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ImageUpload
                        label="Slayd rasmi"
                        folder="landing"
                        value={b.image}
                        onChange={(image) => setBannerField(i, 'image', image)}
                      />
                    </div>
                  </div>
                  <div className={`rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-r ${b.bg} min-h-[120px] flex`}>
                    {b.image ? (
                      <img src={resolveMediaUrl(b.image)} alt="" className="w-full max-h-48 object-cover" />
                    ) : (
                      <span className="m-auto text-sm text-slate-500">Rasm tanlanmagan</span>
                    )}
                  </div>
                </div>
              ))}
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-semibold mb-2">Statistik kartochka (slayd ustida)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Sarlavha" value={draft.statCard.title} onChange={(e) => setStat('title', e.target.value)} />
                  <Input label="Izoh" value={draft.statCard.subtitle} onChange={(e) => setStat('subtitle', e.target.value)} />
                </div>
              </Card>
            </Card>
          )}

          {tab === 'features' && (
            <Card className="p-5 sm:p-6 space-y-5">
              <h2 className="text-lg font-semibold">Hero ostidagi 4 kartochka</h2>
              {draft.featureCards.map((c, i) => (
                <div
                  key={FEATURE_LABELS[i]}
                  className={`space-y-2 rounded-xl border p-4 ${
                    i === 3 ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <p className="text-sm font-medium">{FEATURE_LABELS[i]}</p>
                  <Input
                    label="Sarlavha"
                    value={c.title}
                    onChange={(e) => setFeature(i, 'title', e.target.value)}
                  />
                  <TextArea label="Matn" value={c.body} onChange={(v) => setFeature(i, 'body', v)} />
                </div>
              ))}
              <Input
                label="Qora ERP kartochka — tugma matni"
                value={draft.erpCardCta}
                onChange={(e) => setDraft((d) => ({ ...d, erpCardCta: e.target.value }))}
              />
            </Card>
          )}

          {tab === 'quick' && (
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Tezkor afzalliklar (4 qator)</h2>
              {draft.quickPoints.map((q, i) => (
                <div key={QUICK_LABELS[i]} className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-100 p-4">
                  <Input label="Sarlavha" value={q.title} onChange={(e) => setQuick(i, 'title', e.target.value)} />
                  <Input label="Izoh" value={q.subtitle} onChange={(e) => setQuick(i, 'subtitle', e.target.value)} />
                </div>
              ))}
            </Card>
          )}

          {tab === 'seo' && (
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">SEO va brauzer sarlavhasi</h2>
              <Input
                label="Sahifa sarlavhasi (title)"
                value={draft.seo?.pageTitle ?? ''}
                onChange={(e) => setSeo('pageTitle', e.target.value)}
              />
              <TextArea
                label="Meta tavsif (description)"
                value={draft.seo?.metaDescription ?? ''}
                onChange={(v) => setSeo('metaDescription', v)}
                rows={3}
              />
            </Card>
          )}

          {tab === 'preview' && (
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Jonli ko‘rinish (qisqacha)
                </h2>
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/80 to-white p-6 dark:from-slate-900 dark:to-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{draft.hero.eyebrow}</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {draft.hero.headline}
                    <span className="text-emerald-600">{draft.hero.headlineAccent}</span>
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                    {applyLandingErpPlaceholders(draft.hero.lead)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">{draft.hero.ctaCatalog}</span>
                    <span className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                      {applyLandingErpPlaceholders(draft.hero.ctaErp)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {draft.featureCards.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 text-sm ${
                        i === 3 ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100'
                      }`}
                    >
                      <p className="font-semibold">{applyLandingErpPlaceholders(c.title)}</p>
                      <p className="mt-1 opacity-80">{applyLandingErpPlaceholders(c.body)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  To‘liq slayd va katalog uchun «Saytni ochish» tugmasidan foydalaning. Saqlagandan keyin sahifani yangilang.
                </p>
              </Card>
            </div>
          )}
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 dark:border-slate-800 dark:bg-slate-950/95 lg:pl-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className={`text-sm ${dirty ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
            {dirty ? 'Saqlanmagan o‘zgarishlar bor' : 'Barcha o‘zgarishlar saqlangan'}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleResetForm} disabled={saving} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Standart
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving || loading} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
