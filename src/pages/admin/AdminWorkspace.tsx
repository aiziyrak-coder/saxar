import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Download,
  Command,
  Timer,
  Activity,
  Keyboard,
  Bell,
  Moon,
  Printer,
  Copy,
  Table,
  History,
  WifiOff,
  Gauge,
  Flag,
  BarChart3,
  FileText,
  CalendarDays,
  Hash,
  RefreshCw,
  Percent,
  type LucideIcon,
} from 'lucide-react';
import { downloadCsv } from '../../platform/csv';
import { copyToClipboard } from '../../platform/clipboard';
import { printHtmlDocument } from '../../platform/printHtml';
import { withRetry } from '../../platform/withRetry';
import { getDateRangePreset } from '../../platform/datePresets';
import { addBusinessDays } from '../../platform/businessDays';
import { suggestSkuFromName, normalizeSku } from '../../platform/skuFormat';
import { priceWithVatExclusive, extractVatFromInclusive } from '../../platform/vat';
import { ORDER_NOTE_TEMPLATES } from '../../platform/orderNoteTemplates';
import { getPublicFeatureFlags } from '../../platform/featureFlags';
import { getPageViewStats, clearPageViewStats } from '../../platform/localAnalytics';
import { addNotification } from '../../platform/notifications';

const FEATURES: { id: number; title: string; body: string; icon: LucideIcon }[] = [
  { id: 1, title: 'CSV eksport', body: 'Buyurtmalar va jadvallarni Excel uchun UTF-8 CSV sifatida yuklash.', icon: Download },
  { id: 2, title: 'Ctrl+K navigatsiya', body: 'Admin yo‘llarini tezdan ochish (command palette).', icon: Command },
  { id: 3, title: 'Sessiya ogohlantiruvi', body: 'Uzoq vaqt faolsizlik — xavfsizlik uchun eslatma oynasi.', icon: Timer },
  { id: 4, title: 'API sog‘lig‘i', body: 'Sarlavhada GET /api/health/ holati (backend mavjudligi).', icon: Activity },
  { id: 5, title: 'Klaviatura yorliqlari', body: 'Maydon tashqarisida ? bosilganda qisqa qo‘llanma.', icon: Keyboard },
  { id: 6, title: 'Mahalliy bildirishnomalar', body: 'Brauzerda saqlanadigan voqealar jurnali (CRM eslatmalar uchun asos).', icon: Bell },
  { id: 7, title: 'Mavzu (yorug‘/qorong‘u)', body: 'Admin panelda ko‘rinish rejimi — tungi smenalar uchun.', icon: Moon },
  { id: 8, title: 'Chop etish', body: 'Buyurtma varaqasini yangi oynada chop etish.', icon: Printer },
  { id: 9, title: 'Buferga nusxa', body: 'Buyurtma ID va matnlarni bir tugma bilan nusxalash.', icon: Copy },
  { id: 10, title: 'Tanlab CSV', body: 'Bir nechta qatorni tanlab eksport (bulk).', icon: Table },
  { id: 11, title: 'So‘nggi sahifalar', body: 'Yon panelda oxirgi ochilgan admin sahifalari.', icon: History },
  { id: 12, title: 'Offlayn indikator', body: 'Internet uzilganda yuqori banner ogohlantirish.', icon: WifiOff },
  { id: 13, title: 'Qidiruv debounce', body: 'Katta jadvalda yozishni silliqlash (kechiktirilgan filtr).', icon: Gauge },
  { id: 14, title: 'Feature flags', body: 'Vite muhit o‘zgaruvchilari (API URL, demo rejimi va h.k.).', icon: Flag },
  { id: 15, title: 'Mahalliy tahlil', body: 'Sahifa ochilishlari soni (maxfiylik: faqat brauzerda).', icon: BarChart3 },
  { id: 16, title: 'Buyurtma shablonlari', body: 'Takrorlanuvchi izoh matnlari — nusxa olish.', icon: FileText },
  { id: 17, title: 'Ish kunlari hisobi', body: 'Yetkazish sanasini shanba-yakshanbasiz hisoblash.', icon: CalendarDays },
  { id: 18, title: 'SKU yordamchi', body: 'Ichki SKU normalizatsiya va avtogeneratsiya taklifi.', icon: Hash },
  { id: 19, title: 'Qayta urinish', body: 'Tarmoq so‘rovlarida sodda retry strategiyasi.', icon: RefreshCw },
  { id: 20, title: 'QQS kalkulyatori', body: 'Narxga QQS qo‘shish yoki inclusive dan ajratish.', icon: Percent },
];

export default function AdminWorkspace() {
  const [vatIn, setVatIn] = useState(100000);
  const [vatPct, setVatPct] = useState(12);
  const [bdStart, setBdStart] = useState(new Date().toISOString().split('T')[0]);
  const [bdDays, setBdDays] = useState(3);
  const [skuDemo, setSkuDemo] = useState(' go‘sht 500 ');
  const [retryMsg, setRetryMsg] = useState('');
  const stats = useMemo(() => getPageViewStats(), []);

  const demoCsv = () => {
    downloadCsv(
      `saxar-demo-${Date.now()}.csv`,
      FEATURES.map((f) => ({ id: f.id, title: f.title }))
    );
    addNotification('CSV tayyor', 'Funksiyalar ro‘yxati yuklandi.');
  };

  const demoPrint = () => {
    printHtmlDocument(
      'Namuna',
      '<h2>Saxar ERP</h2><p>Bu chop etish namunasidir.</p>'
    );
  };

  const demoRetry = async () => {
    let n = 0;
    setRetryMsg('Urinish…');
    try {
      await withRetry(async () => {
        n += 1;
        if (n < 2) throw new Error('fail');
        return true;
      }, 3, 200);
      setRetryMsg('Muvaffaqiyat (2-urinishda).');
    } catch {
      setRetryMsg('Xato');
    }
  };

  const preset = getDateRangePreset('last7');
  const bd = addBusinessDays(new Date(bdStart + 'T12:00:00'), bdDays);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Platform vositalari</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
          Haqiqiy ishlab chiqarish uchun 20 ta asosiy qatlam: eksport, navigatsiya, xavfsizlik, API monitoring,
          bildirishnomalar, mavzu, chop etish, nusxa, bulk, tarix, offlayn, debounce, bayroqlar, tahlil, shablonlar,
          sanalar, SKU, retry va QQS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.id} className="p-5 dark:bg-slate-900/80 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-700 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    {f.id}. {f.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{f.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 dark:bg-slate-900/80 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Interaktiv demo</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={demoCsv}>
            <Download className="h-4 w-4" /> CSV namuna
          </Button>
          <Button variant="outline" className="gap-2" onClick={demoPrint}>
            <Printer className="h-4 w-4" /> Chop namuna
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void copyToClipboard('SAXAR-DEMO-ID')}>
            <Copy className="h-4 w-4" /> ID nusxa
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => void demoRetry()}>
            <RefreshCw className="h-4 w-4" /> Retry demo
          </Button>
          <Button variant="ghost" className="gap-2" onClick={() => { clearPageViewStats(); addNotification('Tahlil', 'Mahalliy sahifa statistikasi tozalandi.'); }}>
            <BarChart3 className="h-4 w-4" /> Tahlilni tozalash
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">{retryMsg}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Sana oralig‘i (last7)</h4>
            <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg overflow-x-auto">{JSON.stringify(preset, null, 2)}</pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Ish kunlari</h4>
            <label className="text-xs text-slate-600 dark:text-slate-400">Boshlanish</label>
            <input type="date" className="block w-full rounded border border-slate-200 dark:border-slate-600 mb-2 text-sm dark:bg-slate-800" value={bdStart} onChange={(e) => setBdStart(e.target.value)} />
            <label className="text-xs text-slate-600 dark:text-slate-400">Ish kunlari</label>
            <input type="number" min={1} className="block w-full rounded border border-slate-200 dark:border-slate-600 text-sm dark:bg-slate-800" value={bdDays} onChange={(e) => setBdDays(Number(e.target.value))} />
            <p className="text-xs mt-2 text-slate-600 dark:text-slate-300">Natija: {bd.toLocaleDateString('uz-UZ')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">QQS</h4>
            <input type="number" className="block w-full mb-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-600" value={vatIn} onChange={(e) => setVatIn(Number(e.target.value))} />
            <input type="number" className="block w-full mb-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600" value={vatPct} onChange={(e) => setVatPct(Number(e.target.value))} />
            <p className="text-xs text-slate-600 dark:text-slate-300">QQS bilan: {priceWithVatExclusive(vatIn, vatPct).toLocaleString('uz-UZ')} so‘m</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {vatIn} inclusive → net: {extractVatFromInclusive(vatIn, vatPct).net}, QQS: {extractVatFromInclusive(vatIn, vatPct).vat}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">SKU</h4>
            <input className="block w-full text-sm border rounded dark:bg-slate-800 dark:border-slate-600 mb-2" value={skuDemo} onChange={(e) => setSkuDemo(e.target.value)} />
            <p className="text-xs text-slate-600 dark:text-slate-300">Normalize: {normalizeSku(skuDemo)}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Taklif: {suggestSkuFromName(skuDemo, 'MT')}</p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Buyurtma izoh shablonlari</h4>
            <div className="flex flex-wrap gap-2">
              {ORDER_NOTE_TEMPLATES.map((t) => (
                <Button key={t.id} size="sm" variant="outline" type="button" onClick={() => void copyToClipboard(t.text)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Feature flags</h4>
            <pre className="text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg overflow-x-auto max-h-40">{JSON.stringify(getPublicFeatureFlags(), null, 2)}</pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Sahifa ochilishlari (top)</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto space-y-1">
              {Object.entries(stats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: <strong>{v}</strong>
                  </li>
                ))}
              {Object.keys(stats).length === 0 && <li>Hozircha yo‘q</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
