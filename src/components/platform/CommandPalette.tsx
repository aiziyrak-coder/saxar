import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Search } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  path: string;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(t) ||
        c.path.toLowerCase().includes(t) ||
        (c.keywords && c.keywords.toLowerCase().includes(t))
    );
  }, [commands, q]);

  const run = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Tezkor qidiruv va navigatsiya (Ctrl+K)" size="lg">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            autoFocus
            className="w-full rounded-xl border border-emerald-200/80 bg-white/90 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900/80 dark:text-slate-100"
            placeholder="Sahifa nomi yoki yo‘l..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-emerald-100 dark:divide-slate-700 rounded-xl border border-emerald-100 dark:border-slate-700">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm hover:bg-emerald-50/80 dark:hover:bg-slate-800/80"
                onClick={() => run(c.path)}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{c.label}</span>
                <span className="text-xs text-slate-500 font-mono">{c.path}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Natija yo‘q</li>
          )}
        </ul>
      </div>
    </Modal>
  );
}
