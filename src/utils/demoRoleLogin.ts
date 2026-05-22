import { persistDemoUser } from '../constants/branding';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../constants/devRoleLogins';
import { ROLE_HOME_PATHS } from '../constants/roles';
import { obtainDjangoJwt, roleRequiresDjangoJwt } from '../services/djangoAuth';
import type { UserRole } from '../types';

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

/** Firebase yo‘q yoki demo rejim: localStorage + Django JWT (API uchun). */
export async function completeDemoRoleLogin(
  role: UserRole,
  creds: { phone: string; password: string; displayName: string }
): Promise<{ ok: boolean; error?: string }> {
  const syntheticEmail = `${phoneDigits(creds.phone)}@saxar.local`;
  persistDemoUser(
    JSON.stringify({
      uid: `demo_phone_${role}_${phoneDigits(creds.phone).slice(-4)}`,
      email: syntheticEmail,
      phone: creds.phone,
      role,
      name: creds.displayName,
      status: role === 'b2b' ? 'active' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  );

  const jwt = await obtainDjangoJwt(creds.phone, creds.password);
  if (roleRequiresDjangoJwt(role) && !jwt?.access) {
    return {
      ok: false,
      error:
        'Server API (Django) bilan bog‘lanmadi. Serverda `python manage.py ensure_role_users` ishga tushiring.',
    };
  }
  if (role === 'b2b' && !jwt?.access) {
    /* B2B ba’zi funksiyalar JWT siz ham ishlaydi */
  }

  window.location.href = ROLE_HOME_PATHS[role];
  return { ok: true };
}
