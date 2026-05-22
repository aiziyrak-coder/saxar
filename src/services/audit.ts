import { auditLogService } from './firestore';
import type { AuditLog, UserRole } from '../types';

const AUDIT_KEY = 'saxar_audit_logs_v1';
const MAX_LOGS = 200;

export function readLocalAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLocalAudit(entry: AuditLog): void {
  try {
    const logs = [entry, ...readLocalAuditLogs()].slice(0, MAX_LOGS);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  userName: string,
  userRole: UserRole,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<void> {
  const entry: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    entityType,
    entityId,
    userId,
    userName,
    userRole,
    oldData: oldData ?? undefined,
    newData: newData ?? undefined,
    ipAddress: '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    createdAt: new Date().toISOString(),
  };
  appendLocalAudit(entry);
  try {
    await auditLogService.create(entry as Omit<AuditLog, 'id'>);
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// Predefined audit actions
export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // Users
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  
  // Products
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  PRODUCT_PRICE_CHANGE: 'PRODUCT_PRICE_CHANGE',
  
  // Orders
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
  ORDER_CANCEL: 'ORDER_CANCEL',
  ORDER_DELETE: 'ORDER_DELETE',
  
  // Inventory
  INVENTORY_IN: 'INVENTORY_IN',
  INVENTORY_OUT: 'INVENTORY_OUT',
  INVENTORY_ADJUST: 'INVENTORY_ADJUST',
  INVENTORY_TRANSFER: 'INVENTORY_TRANSFER',
  
  // Clients
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  CLIENT_APPROVE: 'CLIENT_APPROVE',
  CLIENT_REJECT: 'CLIENT_REJECT',
  
  // Payments
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_DELETE: 'PAYMENT_DELETE',
  
  // Expenses
  EXPENSE_CREATE: 'EXPENSE_CREATE',
  EXPENSE_APPROVE: 'EXPENSE_APPROVE',
  EXPENSE_REJECT: 'EXPENSE_REJECT',
} as const;

// Entity types
export const EntityTypes = {
  USER: 'USER',
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  CLIENT: 'CLIENT',
  ORDER: 'ORDER',
  INVENTORY: 'INVENTORY',
  INVENTORY_TRANSACTION: 'INVENTORY_TRANSACTION',
  PAYMENT: 'PAYMENT',
  EXPENSE: 'EXPENSE',
  DELIVERY: 'DELIVERY',
  KPI: 'KPI',
} as const;
