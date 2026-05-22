import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CommandPalette, type CommandItem } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { IdleSessionDialog } from './IdleSessionDialog';
import { OfflineStrip } from './OfflineStrip';
import { useIdleSession } from '../../platform/useIdleSession';
import { useOnlineStatus } from '../../platform/useOnlineStatus';
import { ROLE_HOME_PATHS, roleSubPath } from '../../constants/roles';

const ADMIN_COMMANDS: CommandItem[] = [
  { id: 'd', label: 'Dashboard', path: roleSubPath('admin', 'dashboard'), keywords: 'bosh' },
  { id: 'o', label: 'Buyurtmalar', path: roleSubPath('admin', 'orders') },
  { id: 'c', label: 'Mijozlar', path: roleSubPath('admin', 'clients') },
  { id: 'P', label: 'Mahsulotlar', path: roleSubPath('admin', 'products'), keywords: 'katalog narx' },
  { id: 'w', label: 'Ombor WMS', path: roleSubPath('admin', 'wms') },
  { id: 'f', label: 'Moliya', path: roleSubPath('admin', 'finance') },
  { id: 'r', label: 'Hisobotlar', path: roleSubPath('admin', 'reports') },
  { id: 's', label: 'Sozlamalar', path: roleSubPath('admin', 'settings') },
  {
    id: 'L',
    label: 'Bosh sahifa (landing)',
    path: roleSubPath('admin', 'landing-settings'),
    keywords: 'sayt vitrina matn rasm',
  },
  { id: 'p', label: 'Ishlab chiqarish', path: roleSubPath('admin', 'production') },
  { id: 'a', label: 'Agentlar', path: roleSubPath('admin', 'agents') },
  { id: 'l', label: 'Logistika', path: roleSubPath('admin', 'logistics') },
];

import { platformPublicApi } from '../../services/platformApi';
import { addNotification } from '../../platform/notifications';
import { API_WARN_STORAGE_KEY } from '../../utils/demoRoleLogin';

function idleMsFromMinutes(minutes: number): number {
  if (Number.isFinite(minutes) && minutes >= 5) return minutes * 60 * 1000;
  const raw = Number(import.meta.env.VITE_IDLE_WARN_MS);
  if (Number.isFinite(raw) && raw >= 60_000) return raw;
  return 25 * 60 * 1000;
}

export function PlatformGlobal() {
  const location = useLocation();
  const online = useOnlineStatus();
  const [idleMs, setIdleMs] = useState(() => idleMsFromMinutes(30));
  const { showWarning, continueSession } = useIdleSession({ warnAfterMs: idleMs });

  useEffect(() => {
    platformPublicApi.getPublic().then((p) => {
      setIdleMs(idleMsFromMinutes(p.session_idle_minutes));
    }).catch(() => {});
  }, []);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    try {
      const warn = sessionStorage.getItem(API_WARN_STORAGE_KEY);
      if (warn) {
        sessionStorage.removeItem(API_WARN_STORAGE_KEY);
        addNotification('API ulanishi', warn);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (e.key === '?' && !typing) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    const openCmd = () => setCmdOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('saxar:open-command-palette', openCmd);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('saxar:open-command-palette', openCmd);
    };
  }, []);

  const showAdminChrome = location.pathname.startsWith(ROLE_HOME_PATHS.admin);

  return (
    <>
      <OfflineStrip online={online} />
      {showAdminChrome && (
        <>
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={ADMIN_COMMANDS} />
          <KeyboardShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
      )}
      <IdleSessionDialog open={showWarning} onContinue={continueSession} />
    </>
  );
}
