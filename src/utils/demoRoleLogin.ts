import { ROLE_HOME_PATHS } from '../constants/roles';
import { DEV_ROLE_ORDER, DEV_ROLE_PHONE_CREDENTIALS } from '../constants/devRoleLogins';
import {
  fetchDjangoMe,
  obtainDjangoJwtDetailed,
  roleRequiresDjangoJwt,
} from '../services/djangoAuth';
import {
  buildOfflineDemoUser,
  persistUserSession,
  userFromDjangoProfile,
} from '../services/sessionStore';
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

/** Django JWT + /me — Firebase yo‘q. */
export async function completeDemoRoleLogin(
  role: UserRole,
  creds: { phone: string; password: string; displayName: string }
): Promise<{ ok: boolean; error?: string; apiWarning?: string }> {
  const { pair, error: jwtError } = await obtainDjangoJwtDetailed(creds.phone, creds.password);
  if (!pair?.access) {
    const digits = phoneDigits(creds.phone);
    const expected = phoneDigits(DEV_ROLE_PHONE_CREDENTIALS[role].phone);
    const isDevCreds =
      digits === expected && creds.password === DEV_ROLE_PHONE_CREDENTIALS[role].password;
    const networkDown = Boolean(
      jwtError &&
        (/network|tarmoq|unreachable|vaqti tugadi|HTTP 0/i.test(jwtError) ||
          jwtError.includes('So\'rov vaqti tugadi'))
    );
    if (isDevCreds && networkDown) {
      persistUserSession(buildOfflineDemoUser(role, creds));
      window.location.assign(ROLE_HOME_PATHS[role]);
      return {
        ok: true,
        apiWarning:
          'API vaqtincha ishlamayapti — cheklangan rejim. Internet/API tiklangach sahifada JWT qayta ulang.',
      };
    }
    return {
      ok: false,
      error:
        jwtError ||
        'Django API ga ulanib bo‘lmadi. Serverda: python manage.py ensure_role_users',
    };
  }

  const me = await fetchDjangoMe();
  if (!me) {
    return { ok: false, error: 'Foydalanuvchi profili (/me) olinmadi.' };
  }

  const user = userFromDjangoProfile(me, creds.phone);
  if (user.role !== role) {
    /* ensure_role_users rol mos */
  }
  persistUserSession({ ...user, role, name: creds.displayName });

  let apiWarning: string | undefined;
  if (roleRequiresDjangoJwt(role) && !me.is_active) {
    apiWarning = 'Hisob faol emas — admin tasdig‘ini kuting.';
    try {
      sessionStorage.setItem(API_WARN_STORAGE_KEY, apiWarning);
    } catch {
      /* ignore */
    }
  }

  window.location.assign(ROLE_HOME_PATHS[role]);
  return { ok: true, apiWarning };
}

export async function loginWithDjangoCredentials(
  phone: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const matched = findDevCredentialsByPhone(phone);
  const { pair, error } = await obtainDjangoJwtDetailed(phone, password);
  if (!pair?.access) {
    return { ok: false, error: error || 'Telefon yoki parol noto‘g‘ri' };
  }
  const me = await fetchDjangoMe();
  if (!me) {
    return { ok: false, error: 'Profil olinmadi' };
  }
  if (!me.is_active && me.role === 'b2b') {
    persistUserSession(userFromDjangoProfile(me, phone));
    window.location.assign('/b2b/profile');
    return { ok: true };
  }
  if (!me.is_active) {
    return { ok: false, error: 'Hisob faol emas. Admin tasdig‘ini kuting.' };
  }
  persistUserSession(userFromDjangoProfile(me, phone));
  window.location.assign(ROLE_HOME_PATHS[me.role]);
  if (matched) return { ok: true };
  return { ok: true };
}
