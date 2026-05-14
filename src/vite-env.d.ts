/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** `false` bo‘lsa, login sahifasidagi demo tugmalar va standart demo parol yashiriladi (prod build). */
  readonly VITE_ALLOW_DEMO_LOGIN?: string;
  /** Sessiya ogohlantiruvi (ms), masalan 120000. Kamida 60000. */
  readonly VITE_IDLE_WARN_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

