import type { UserRole } from '../types';

/**
 * Har rol uchun alohida demo telefon va parol (Login sahifasidagi tugmalar).
 * Firebase ishlamasa yoki akkaunt bo'lmasa — shu ma'lumotlar bilan local demo sessiyasi ochiladi.
 */
export const DEV_ROLE_PHONE_CREDENTIALS: Record<
  UserRole,
  { phone: string; password: string; title: string; displayName: string }
> = {
  admin: {
    phone: '+998 90 000 01 01',
    password: 'DevRole_Admin!',
    title: 'Admin / Direktor',
    displayName: 'Demo Admin',
  },
  accountant: {
    phone: '+998 90 000 01 02',
    password: 'DevRole_Accountant!',
    title: 'Buxgalter',
    displayName: 'Demo Buxgalter',
  },
  warehouse: {
    phone: '+998 90 000 01 03',
    password: 'DevRole_Warehouse!',
    title: 'Ombor mudiri',
    displayName: 'Demo Ombor',
  },
  production: {
    phone: '+998 90 000 01 04',
    password: 'DevRole_Production!',
    title: 'Ishlab chiqarish',
    displayName: 'Demo Ishlab chiqarish',
  },
  b2b: {
    phone: '+998 90 000 01 05',
    password: 'DevRole_B2B!',
    title: 'B2B mijoz',
    displayName: 'Demo B2B mijoz',
  },
  agent: {
    phone: '+998 90 000 01 06',
    password: 'DevRole_Agent!',
    title: 'Agent',
    displayName: 'Demo Agent',
  },
  driver: {
    phone: '+998 90 000 01 07',
    password: 'DevRole_Driver!',
    title: 'Dastavkachi',
    displayName: 'Demo Haydovchi',
  },
};

export const DEV_ROLE_ORDER: UserRole[] = [
  'admin',
  'accountant',
  'warehouse',
  'production',
  'b2b',
  'agent',
  'driver',
];
