import { persistDemoUser } from '../constants/branding';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../constants/devRoleLogins';
import { ROLE_HOME_PATHS } from '../constants/roles';
import { obtainDjangoJwtDetailed, roleRequiresDjangoJwt } from '../services/djangoAuth';
import type { UserRole } from '../types';

export const API_WARN_STORAGE_KEY = 'saxar_api_warn';

function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function findDevCredentialsByPhone(rawPhone: string): {
  role: UserRole;
  creds: (typeof DEV_ROLE_PHONE_CREDENTIALS)[UserRole];
} | null {
  const digits = phoneDigits(rawPhone);
  if (!digits) return null;
  for (const role of DEV_ROLE_ORDER) {
    const creds = DEV_ROLE_PHONE_CREDENTIALS[role];
    const cd = phoneDigits(creds.phone);
    if (digits === cd) return { role, creds };
  }
  return null;
}

/** Demo rol kirish: avval sessiya, keyin JWT (muvaffaqiyatsiz bo‘lsa ham kabinet ochiladi). */
export async function completeDemoRoleLogin(
  role: UserRole,
  creds: { phone: string; password: string; displayName: string }
): Promise<{ ok: boolean; error?: string; apiWarning?: string }> {
  const syntheticEmail = `${phoneDigits(creds.phone)}@saxar.local`;
  persistDemoUser(
    JSON.stringify({
      uid: `demo_phone_${role}_${phoneDigits(creds.phone).slice(-4)}`,
      email: syntheticEmail,
      phone: creds.phone,
      role,
      name: creds.displayName,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );

  const { pair, error: jwtError } = await obtainDjangoJwtDetailed(creds.phone, creds.password);
  let apiWarning: string | undefined;
  if (!pair?.access && roleRequiresDjangoJwt(role)) {
    apiWarning =
      jwtError ||
      'API (Django) ulanmadi — kabinet ochildi, lekin buyurtma/mahsulot uchun serverda ensure_role_users kerak.';
    try {
      sessionStorage.setItem(API_WARN_STORAGE_KEY, apiWarning);
    } catch {
      /* ignore */
    }
  }

  window.location.assign(ROLE_HOME_PATHS[role]);
  return { ok: true, apiWarning };
}
