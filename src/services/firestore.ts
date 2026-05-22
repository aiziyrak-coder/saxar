/**
 * Firestore olib tashlangan — CRUD stub.
 * Ma’lumotlar Django REST API orqali (orderApi, djangoUsersApi, mergedData, va h.k.).
 */
import type {
  User,
  Product,
  Category,
  Client,
  Order,
  InventoryItem,
  InventoryTransaction,
  Payment,
  Expense,
  Delivery,
  AuditLog,
  KPIRecord,
  AgentCheckIn,
  Promotion,
  PayrollItem,
} from '../types';

export class FirestoreService<T extends { id?: string }> {
  constructor(_collectionName: string) {}

  async create(_data: Omit<T, 'id'>, _customId?: string): Promise<string | null> {
    return null;
  }

  async getById(_id: string): Promise<T | null> {
    return null;
  }

  async getAll(_constraints?: unknown[]): Promise<T[]> {
    return [];
  }

  async update(_id: string, _data: Partial<T>): Promise<boolean> {
    return false;
  }

  async delete(_id: string): Promise<boolean> {
    return false;
  }

  subscribe(
    _callback: (data: T[]) => void,
    _constraints?: unknown[]
  ): () => void {
    _callback([]);
    return () => {};
  }
}

export const userService = new FirestoreService<User>('users');
export const productService = new FirestoreService<Product>('products');
export const categoryService = new FirestoreService<Category>('categories');
export const clientService = new FirestoreService<Client>('clients');
export const orderService = new FirestoreService<Order>('orders');
export const inventoryService = new FirestoreService<InventoryItem>('inventory');
export const inventoryTransactionService = new FirestoreService<InventoryTransaction>(
  'inventory_transactions'
);
export const paymentService = new FirestoreService<Payment>('payments');
export const expenseService = new FirestoreService<Expense>('expenses');
export const deliveryService = new FirestoreService<Delivery>('deliveries');
export const auditLogService = new FirestoreService<AuditLog>('audit_logs');
export const kpiService = new FirestoreService<KPIRecord>('kpi_records');
export const agentCheckInService = new FirestoreService<AgentCheckIn>('agent_check_ins');
export const promotionService = new FirestoreService<Promotion>('promotions');
export const payrollService = new FirestoreService<PayrollItem>('payroll_items');

export async function runBatch<T extends Record<string, unknown>>(
  _operations: Array<{ type: 'create' | 'update' | 'delete'; collection: string; id?: string; data?: Partial<T> }>
): Promise<boolean> {
  return false;
}

export async function getClientsByAgentId(_agentId: string): Promise<Client[]> {
  return [];
}

export async function getOrdersByClient(
  clientId: string,
  _limitCount: number = 50
): Promise<Order[]> {
  const { fetchClientOrdersMerged } = await import('../utils/mergedData');
  const { djangoUserIdFromClientId } = await import('../utils/djangoUsers');
  const djangoId = djangoUserIdFromClientId(clientId);
  if (!djangoId) return [];
  return fetchClientOrdersMerged(clientId, djangoId);
}

export async function getOrdersByStatus(_status: string, _limitCount: number = 100): Promise<Order[]> {
  return [];
}

export async function getOrdersByStatuses(_statuses: string[], _limitCount: number = 100): Promise<Order[]> {
  return [];
}

export async function getInventoryByProduct(_productId: string): Promise<InventoryItem[]> {
  return [];
}

export async function getExpiringInventory(_days: number = 7): Promise<InventoryItem[]> {
  return [];
}

export async function getLowStockProducts(): Promise<InventoryItem[]> {
  return [];
}

export async function getPaymentsByClient(
  clientId: string,
  _limitCount: number = 50
): Promise<Payment[]> {
  const { fetchPaymentsMerged } = await import('../utils/mergedData');
  const { djangoUserIdFromClientId } = await import('../utils/djangoUsers');
  const djangoId = djangoUserIdFromClientId(clientId);
  return fetchPaymentsMerged(clientId, djangoId ?? undefined);
}

export async function getClientBalance(clientId: string): Promise<number> {
  const orders = await getOrdersByClient(clientId);
  const payments = await getPaymentsByClient(clientId);
  const ordered = orders
    .filter((o) => !['cancelled', 'returned'].includes(o.status))
    .reduce((s, o) => s + o.totalAmount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  return ordered - paid;
}

export async function getKPIByAgentAndPeriod(
  _agentId: string,
  _period: string
): Promise<KPIRecord | null> {
  return null;
}

export async function checkFifoAvailability(
  _productId: string,
  quantity: number
): Promise<{ available: boolean; shortage: number }> {
  return { available: false, shortage: quantity };
}

export async function deductFIFO(
  _productId: string,
  _productName: string,
  _skuOrQuantity: string | number,
  _unitOrOrderId?: string | number,
  quantityOrOrderNumber?: number | string,
  _orderId?: string,
  _orderNumber?: string,
  _createdBy?: string,
  _createdByName?: string
): Promise<{ success: boolean; shortage?: number }> {
  const qty =
    typeof _skuOrQuantity === 'number'
      ? _skuOrQuantity
      : typeof quantityOrOrderNumber === 'number'
        ? quantityOrOrderNumber
        : 0;
  return { success: false, shortage: qty };
}

export async function inventoryAdjustment(
  _productId: string,
  _productName: string,
  _sku: string,
  _unit: string,
  _batchId: string,
  _batchNumber: string,
  _currentQty: number,
  _newQty: number,
  _reason: string,
  _createdBy: string,
  _createdByName: string
): Promise<void> {}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

export function generateBatchNumber(productId: string): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BCH-${productId.slice(0, 6)}-${year}${month}${day}-${random}`;
}
