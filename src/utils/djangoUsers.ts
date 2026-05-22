import type { DjangoUserRow } from '../services/platformApi';
import type { Client, User } from '../types';

const nowIso = () => new Date().toISOString();

export function djangoRowToUser(r: DjangoUserRow): User {
  return {
    id: `django_${r.id}`,
    uid: `django_${r.id}`,
    email: r.email,
    phone: r.phone,
    role: r.role,
    name: r.first_name || r.email,
    status: r.is_active === false ? 'inactive' : 'active',
    djangoUserId: r.id,
    region: r.region,
    stir: r.stir,
    companyName: r.company_name,
    address: r.address,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function djangoUserIdFromClientId(clientId: string): number | null {
  const m = /^django_(\d+)$/.exec(clientId);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

export function djangoUserToClient(u: DjangoUserRow): Client {
  const now = new Date().toISOString();
  const active = u.is_active !== false;
  return {
    id: `django_${u.id}`,
    name: u.first_name || u.company_name || u.email || `Mijoz ${u.id}`,
    ownerName: u.first_name || '',
    phone: u.phone || '',
    stir: u.stir || '',
    companyName: u.company_name,
    address: u.address || '',
    region: u.region || '',
    discountPercent: 0,
    paymentType: 'transfer',
    creditLimit: 0,
    creditDays: 14,
    status: active ? 'active' : 'pending',
    registrationStatus: active ? 'approved' : 'pending',
    currentBalance: 0,
    totalPurchases: 0,
    createdAt: now,
    updatedAt: now,
  };
}
