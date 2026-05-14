import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseIdleSessionOptions {
  /** Faollik yo‘q bo‘lganda ogohlantirish (ms) */
  warnAfterMs: number;
}

/**
 * Uzoq vaqt klaviatura/sichqoncha harakati bo‘lmasa ogohlantirish.
 * `continueSession` — taymerni qayta boshlaydi.
 */
export function useIdleSession({ warnAfterMs }: UseIdleSessionOptions): {
  showWarning: boolean;
  continueSession: () => void;
} {
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const warningRef = useRef(false);
  warningRef.current = showWarning;

  const arm = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setShowWarning(true);
    }, warnAfterMs);
  }, [warnAfterMs]);

  const continueSession = useCallback(() => {
    setShowWarning(false);
    arm();
  }, [arm]);

  useEffect(() => {
    arm();
    const onActivity = () => {
      if (warningRef.current) return;
      if (document.visibilityState === 'hidden') return;
      arm();
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const onVis = () => {
      if (document.visibilityState === 'visible' && !warningRef.current) arm();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [arm]);

  return { showWarning, continueSession };
}
