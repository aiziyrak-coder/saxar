import type { UserRole } from '../types';

/**
 * Faqat dev / VITE_ALLOW_DEMO_LOGIN=true uchun: har rol uchun alohida telefon va parol.
 * Firebase ishlamasa, Login sahifasi shu ma'lumotlar bilan local demo sessiyasini ochadi.
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
