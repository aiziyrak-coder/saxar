import { getFirebaseDb } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
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

// ==================== GENERIC CRUD ====================

export class FirestoreService<T extends DocumentData> {
  constructor(private collectionName: string) {}

  private getCollectionRef() {
    return collection(getFirebaseDb(), this.collectionName);
  }

  private getDocRef(id: string) {
    return doc(getFirebaseDb(), this.collectionName, id);
  }

  // Create
  async create(data: Omit<T, 'id'>, customId?: string): Promise<string> {
    const timestamp = new Date().toISOString();
    const dataWithTimestamps = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (customId) {
      await updateDoc(this.getDocRef(customId), dataWithTimestamps);
      return customId;
    } else {
      const docRef = await addDoc(this.getCollectionRef(), dataWithTimestamps);
      return docRef.id;
    }
  }

  // Read
  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.getDocRef(id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as unknown as T;
  }

  // Update
  async update(id: string, data: Partial<T>): Promise<void> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(this.getDocRef(id), updateData);
  }

  // Delete
  async delete(id: string): Promise<void> {
    await deleteDoc(this.getDocRef(id));
  }

  // Query
  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
  }

  // Get all
  async getAll(orderByField: string = 'createdAt', direction: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    const q = query(this.getCollectionRef(), orderBy(orderByField, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
  }

  // Paginated query
  async getPaginated(
    pageSize: number,
    lastDoc: any = null,
    orderByField: string = 'createdAt',
    direction: 'asc' | 'desc' = 'desc'
  ): Promise<{ items: T[]; lastDoc: any }> {
    const constraints: QueryConstraint[] = [orderBy(orderByField, direction), limit(pageSize)];
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(this.getCollectionRef(), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as T);
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { items, lastDoc: newLastDoc };
  }
}

// ==================== SERVICE INSTANCES ====================

export const userService = new FirestoreService<User>('users');
export const productService = new FirestoreService<Product>('products');
export const categoryService = new FirestoreService<Category>('categories');
export const clientService = new FirestoreService<Client>('clients');
export const orderService = new FirestoreService<Order>('orders');
export const inventoryService = new FirestoreService<InventoryItem>('inventory');
export const inventoryTransactionService = new FirestoreService<InventoryTransaction>('inventory_transactions');
export const paymentService = new FirestoreService<Payment>('payments');
export const expenseService = new FirestoreService<Expense>('expenses');
export const deliveryService = new FirestoreService<Delivery>('deliveries');
export const auditLogService = new FirestoreService<AuditLog>('audit_logs');
export const kpiService = new FirestoreService<KPIRecord>('kpi_records');
export const agentCheckInService = new FirestoreService<AgentCheckIn>('agent_check_ins');
export const promotionService = new FirestoreService<Promotion>('promotions');
export const payrollService = new FirestoreService<PayrollItem>('payroll_items');

// ==================== BATCH OPERATIONS ====================

export async function runBatch<T extends Record<string, any>>(
  operations: { type: 'create' | 'update' | 'delete'; collection: string; id?: string; data?: T }[]
): Promise<void> {
  const batch = writeBatch(getFirebaseDb());

  for (const op of operations) {
    const collectionRef = collection(getFirebaseDb(), op.collection);
    
    switch (op.type) {
      case 'create':
        if (op.id) {
          batch.set(doc(collectionRef, op.id), { ...op.data, createdAt: new Date().toISOString() });
        } else {
          const newDocRef = doc(collectionRef);
          batch.set(newDocRef, { ...op.data, createdAt: new Date().toISOString() });
        }
        break;
      case 'update':
        if (op.id) {
          batch.update(doc(collectionRef, op.id), { ...op.data, updatedAt: new Date().toISOString() });
        }
        break;
      case 'delete':
        if (op.id) {
          batch.delete(doc(collectionRef, op.id));
        }
        break;
    }
  }

  await batch.commit();
}

// ==================== SPECIALIZED QUERIES ====================

// Get clients by agent (agentga biriktirilgan do'konlar)
export async function getClientsByAgentId(agentId: string): Promise<Client[]> {
  const q = query(
    collection(getFirebaseDb(), 'clients'),
    where('agentId', '==', agentId),
    limit(500)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Client);
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return list;
}

// Get orders by client
export async function getOrdersByClient(clientId: string, limitCount: number = 50): Promise<Order[]> {
  const q = query(
    collection(getFirebaseDb(), 'orders'),
    where('clientId', '==', clientId),
    limit(limitCount * 2)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list.slice(0, limitCount);
}

// Get orders by status
export async function getOrdersByStatus(status: string, limitCount: number = 100): Promise<Order[]> {
  const q = query(
    collection(getFirebaseDb(), 'orders'),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

// Get orders by multiple statuses (in-memory filter to avoid composite index)
export async function getOrdersByStatuses(statuses: string[], limitCount: number = 100): Promise<Order[]> {
  const q = query(
    collection(getFirebaseDb(), 'orders'),
    orderBy('createdAt', 'desc'),
    limit(limitCount * 2)
  );
  const snapshot = await getDocs(q);
  const set = new Set(statuses);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }) as Order)
    .filter(o => set.has(o.status))
    .slice(0, limitCount);
}

// Get inventory by product
export async function getInventoryByProduct(productId: string): Promise<InventoryItem[]> {
  const q = query(
    collection(getFirebaseDb(), 'inventory'),
    where('productId', '==', productId),
    where('status', '==', 'available'),
    orderBy('expiryDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as InventoryItem);
}

// Get expiring inventory
export async function getExpiringInventory(days: number = 7): Promise<InventoryItem[]> {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  const q = query(
    collection(getFirebaseDb(), 'inventory'),
    where('expiryDate', '<=', expiryDate.toISOString()),
    where('status', '==', 'available'),
    orderBy('expiryDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as InventoryItem);
}

// Get low stock products
export async function getLowStockProducts(): Promise<InventoryItem[]> {
  // This requires aggregation query
  const q = query(
    collection(getFirebaseDb(), 'inventory'),
    where('status', '==', 'available')
  );
  const snapshot = await getDocs(q);
  
  // Group by product and sum quantities
  const productQuantities: Record<string, { item: InventoryItem; totalQty: number }> = {};
  
  snapshot.docs.forEach(doc => {
    const item = doc.data() as InventoryItem;
    if (!productQuantities[item.productId]) {
      productQuantities[item.productId] = { item, totalQty: 0 };
    }
    productQuantities[item.productId].totalQty += item.quantity;
  });
  
  // Filter low stock (would need product.minStock for proper check)
  return Object.values(productQuantities)
    .filter(p => p.totalQty < 10) // Default threshold
    .map(p => p.item);
}

// Get payments by client (for Akt sverka / history)
export async function getPaymentsByClient(clientId: string, limitCount: number = 50): Promise<Payment[]> {
  const q = query(
    collection(getFirebaseDb(), 'payments'),
    where('clientId', '==', clientId),
    limit(limitCount * 2)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list.slice(0, limitCount);
}

// Get client balance (orders total - payments total)
export async function getClientBalance(clientId: string): Promise<number> {
  // Get all orders for client
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('clientId', '==', clientId)
  );
  const ordersSnap = await getDocs(ordersQuery);
  const totalOrders = ordersSnap.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);

  // Get all payments for client
  const paymentsQuery = query(
    collection(getFirebaseDb(), 'payments'),
    where('clientId', '==', clientId),
    where('direction', '==', 'in')
  );
  const paymentsSnap = await getDocs(paymentsQuery);
  const totalPayments = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

  return totalOrders - totalPayments;
}

// Get KPI by agent and period
export async function getKPIByAgentAndPeriod(agentId: string, period: string): Promise<KPIRecord | null> {
  const q = query(
    collection(getFirebaseDb(), 'kpi_records'),
    where('agentId', '==', agentId),
    where('period', '==', period),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as KPIRecord;
}

/** FIFO chiqim: mahsulotdan eng avval yaroqlilik muddati tugaydigan partiyalardan chiqaradi. */
export async function deductFIFO(
  productId: string,
  productName: string,
  _sku: string,
  _unit: string,
  quantity: number,
  orderId: string,
  orderNumber: string,
  createdBy: string,
  createdByName: string
): Promise<{ success: boolean; shortage?: number }> {
  const batches = await getInventoryByProduct(productId);
  let remaining = quantity;
  const batch = writeBatch(getFirebaseDb());
  const now = new Date().toISOString();

  for (const item of batches) {
    if (remaining <= 0) break;
    const take = Math.min(item.quantity, remaining);
    if (take <= 0) continue;
    remaining -= take;
    const newQty = item.quantity - take;
    batch.update(doc(getFirebaseDb(), 'inventory', item.id), {
      quantity: newQty,
      updatedAt: now,
    });
    const txData: Omit<InventoryTransaction, 'id'> = {
      type: 'out',
      productId,
      productName,
      batchNumber: item.batchNumber,
      quantity: take,
      unit: item.unit,
      orderId,
      referenceNumber: orderNumber,
      createdBy,
      createdByName,
      createdAt: now,
    };
    const txRef = doc(collection(getFirebaseDb(), 'inventory_transactions'));
    batch.set(txRef, txData);
  }

  if (remaining > 0) {
    return { success: false, shortage: remaining };
  }
  await batch.commit();
  return { success: true };
}

/** Inventarizatsiya: mahsulot bo‘yicha qoldiqni tuzatish (bitta batch dan chiqarish yoki qo‘shish). */
export async function inventoryAdjustment(
  productId: string,
  productName: string,
  _sku: string,
  _unit: string,
  batchId: string,
  batchNumber: string,
  currentQty: number,
  newQty: number,
  reason: string,
  createdBy: string,
  createdByName: string
): Promise<void> {
  const diff = newQty - currentQty;
  if (diff === 0) return;
  const now = new Date().toISOString();
  const batch = writeBatch(getFirebaseDb());
  batch.update(doc(getFirebaseDb(), 'inventory', batchId), {
    quantity: newQty,
    updatedAt: now,
  });
  const txData: Omit<InventoryTransaction, 'id'> = {
    type: 'adjustment',
    productId,
    productName,
    batchNumber,
    quantity: diff,
    unit: _unit,
    notes: reason,
    createdBy,
    createdByName,
    createdAt: now,
  };
  const txRef = doc(collection(getFirebaseDb(), 'inventory_transactions'));
  batch.set(txRef, txData);
  await batch.commit();
}

// Generate order number
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

// Generate batch number
export function generateBatchNumber(productId: string): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BCH-${productId.slice(0, 6)}-${year}${month}${day}-${random}`;
}
