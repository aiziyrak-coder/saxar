import { useEffect, useState } from 'react';
import { buildApiFetchUrl, API_BASE_URL, coerceBrowserFetchUrl } from '../../services/api';

type HealthState = 'checking' | 'ok' | 'error';

export function ApiHealthBadge() {
  const [state, setState] = useState<HealthState>('checking');

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const url = coerceBrowserFetchUrl(buildApiFetchUrl(API_BASE_URL, '/health/'));
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!cancelled) setState(res.ok ? 'ok' : 'error');
      } catch {
        if (!cancelled) setState('error');
      }
    };
    void tick();
    const id = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const label =
    state === 'checking' ? 'API…' : state === 'ok' ? 'API OK' : 'API yo‘q';

  const cls =
    state === 'checking'
      ? 'bg-slate-200/80 text-slate-700'
      : state === 'ok'
        ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/30'
        : 'bg-red-500/20 text-red-800 border border-red-500/30';

  return (
    <span
      className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls} dark:text-slate-100`}
      title="GET /api/health/ — backend holati"
    >
      {label}
    </span>
  );
}
