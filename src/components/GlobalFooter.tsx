import { Instagram, Phone, Send } from 'lucide-react';

const year = 2026;
const cdcUrl = 'https://cdcgroup.uz';
const phone1Label = '+998 90 786 38 88';
const phone1Tel = 'tel:+998907863888';
const telegramUrl = 'https://t.me/Xazrat_bro';
const instagramUrl = 'https://www.instagram.com/islom_cdcgroup?igsh=MXVtejdibTUzY281ZQ==';

export default function GlobalFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-40">
      <div className="w-full border-t border-emerald-200/60 pointer-events-auto">
        <div className="w-full px-3 sm:px-6 py-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-600 leading-tight">
          <span className="text-slate-500">© {year}</span>
          <span className="text-slate-500 font-medium">Mualliflik huquqi</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-600">
            Ishlab chiqaruvchi:{' '}
            <a
              href={cdcUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline"
            >
              CDCGroup
            </a>
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-600">
            Qo&apos;llab-quvvatlovchi:{' '}
            <a
              href={cdcUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline"
            >
              CraDev Company
            </a>
          </span>
          <span className="text-slate-500">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <a href={phone1Tel} className="font-medium hover:text-emerald-700 hover:underline">
              {phone1Label}
            </a>
          </span>
          <span className="text-slate-500">·</span>
          <span className="inline-flex items-center gap-2">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              className="inline-flex items-center justify-center rounded-md hover:bg-emerald-50"
            >
              <Send className="h-3.5 w-3.5 text-emerald-700" />
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex items-center justify-center rounded-md hover:bg-emerald-50"
            >
              <Instagram className="h-3.5 w-3.5 text-emerald-700" />
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

