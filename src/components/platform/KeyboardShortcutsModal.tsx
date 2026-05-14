import { Modal } from '../ui/Modal';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const ROWS: { keys: string; desc: string }[] = [
  { keys: 'Ctrl / ⌘ + K', desc: 'Tezkor navigatsiya (command palette)' },
  { keys: '?', desc: 'Bu oyna (faqat maydon tashqarisida)' },
  { keys: 'Esc', desc: 'Modal yoki panelni yopish' },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Klaviatura yorliqlari" size="md">
      <ul className="divide-y divide-emerald-100 dark:divide-slate-700 rounded-xl border border-emerald-100 dark:border-slate-700 overflow-hidden">
        {ROWS.map((r) => (
          <li key={r.keys} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {r.keys}
            </kbd>
            <span className="text-slate-600 dark:text-slate-300 text-right">{r.desc}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
