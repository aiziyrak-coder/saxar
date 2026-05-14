/** Brauzer build vaqtidagi VITE_* bayroqlari (prod sozlash uchun) */
export function getPublicFeatureFlags(): Record<string, string | undefined> {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_ALLOW_DEMO_LOGIN: import.meta.env.VITE_ALLOW_DEMO_LOGIN,
    MODE: import.meta.env.MODE,
    DEV: String(import.meta.env.DEV),
  };
}
