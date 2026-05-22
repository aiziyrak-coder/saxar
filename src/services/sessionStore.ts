import type { User, UserRole } from '../types';
import { parseUserRole } from '../constants/roles';

const SESSION_KEY = 'saxar_user_session';

function parseUserStatus(value: unknown): User['status'] {
  if (value === 'active' || value === 'inactive' || value === 'pending') {
    return value;
  }
  return 'pending';
}

export function persistUserSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function readUserSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    const role = parseUserRole(d.role);
    const id = String(d.id || d.uid || '');
    if (!id) return null;
    return {
      id,
      uid: String(d.uid || id),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      role,
      name: String(d.name || 'Foydalanuvchi'),
      status: parseUserStatus(d.status),
      createdAt: String(d.createdAt || new Date().toISOString()),
      updatedAt: String(d.updatedAt || new Date().toISOString()),
      djangoUserId:
        typeof d.djangoUserId === 'number'
          ? d.djangoUserId
          : d.djangoUserId
            ? Number(d.djangoUserId)
            : undefined,
      companyName: d.companyName as string | undefined,
      stir: d.stir as string | undefined,
      address: d.address as string | undefined,
      region: d.region as string | undefined,
      avatar: d.avatar as string | undefined,
    };
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** API vaqtincha ishlamasa — demo rol uchun minimal sessiya (JWT keyin ulanadi). */
export function buildOfflineDemoUser(
  role: UserRole,
  creds: { phone: string; displayName: string }
): User {
  const digits = creds.phone.replace(/\D/g, '');
  const uid = `offline_${role}_${digits || role}`;
  const now = new Date().toISOString();
  return {
    id: uid,
    uid,
    email: `${digits || role}@saxar.local`,
    phone: creds.phone,
    role,
    name: creds.displayName,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

export function userFromDjangoProfile(
  row: {
    id: number;
    role: UserRole;
    is_active: boolean;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    stir?: string;
    address?: string;
    region?: string;
  },
  fallbackPhone?: string
): User {
  const uid = `django_${row.id}`;
  const name =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.company_name ||
    row.email?.split('@')[0] ||
    'Foydalanuvchi';
  let status: User['status'] = 'active';
  if (!row.is_active) {
    status = row.role === 'b2b' ? 'pending' : 'inactive';
  }
  const now = new Date().toISOString();
  return {
    id: uid,
    uid,
    email: row.email || '',
    phone: row.phone || fallbackPhone || '',
    role: row.role,
    name,
    status,
    companyName: row.company_name,
    stir: row.stir,
    address: row.address,
    region: row.region,
    djangoUserId: row.id,
    createdAt: now,
    updatedAt: now,
  };
}
