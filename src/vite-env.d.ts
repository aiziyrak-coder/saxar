/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** `false` bo‘lsa, standart demo parol matni (bo‘sh parol fallback) yashiriladi. */
  readonly VITE_ALLOW_DEMO_LOGIN?: string;
  /**
   * `true` bo‘lsa, login sahifasida rol bo‘yicha tezkir kirish tugmalari ko‘rinadi.
   * Bo‘sh bo‘lsa — `VITE_ALLOW_DEMO_LOGIN` qiymatiga bog‘liq.
   */
  readonly VITE_SHOW_DEMO_ROLE_LOGIN?: string;
  /** Sessiya ogohlantiruvi (ms), masalan 120000. Kamida 60000. */
  readonly VITE_IDLE_WARN_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

