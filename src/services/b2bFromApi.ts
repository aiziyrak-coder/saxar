import type {
  Order,
  OrderItem,
  OrderSource,
  OrderStatus,
  Payment,
  PaymentType,
  Expense,
  ExpenseCategory,
} from '../types';
import type { ApiOrderItemRow, ApiOrderRow, ApiPaymentRow, ApiExpenseRow } from './api';

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'picking',
  'packed',
  'in_transit',
  'delivered',
  'cancelled',
  'returned',
];

function normalizeOrderStatus(s: string | undefined): OrderStatus {
  const v = String(s || '').toLowerCase();
  return (ORDER_STATUSES.includes(v as OrderStatus) ? v : 'pending') as OrderStatus;
}

const PAYMENT_TYPES: PaymentType[] = ['cash', 'card', 'transfer', 'click', 'payme', 'uzum'];

function normalizePaymentType(t: string | undefined): PaymentType {
  const v = String(t || '').toLowerCase();
  return (PAYMENT_TYPES.includes(v as PaymentType) ? v : 'transfer') as PaymentType;
}

/** Map Django `OrderSerializer` row to frontend `Order` (B2B list / finance). */
export function mapApiOrderRowToOrder(row: ApiOrderRow): Order {
  const id = String(row.id);
  const clientId = String(row.client ?? '');
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items: OrderItem[] = itemsRaw.map((it: ApiOrderItemRow, idx: number) => ({
    id: String(it.id ?? `${id}-item-${idx}`),
    productId: String(it.product ?? ''),
    productName: String(it.product_name ?? ''),
    sku: '',
    unit: 'pcs',
    quantity: Number(it.quantity ?? 0),
    unitPrice: Number(it.price ?? 0),
    discountPercent: 0,
    totalPrice: Number(it.total ?? 0),
  }));
  const totalAmount = Number(row.total_amount ?? 0);
  const paidAmount = Number(row.paid_amount ?? 0);
  const createdAt = String(row.created_at ?? new Date().toISOString());
  const orderDate = row.order_date ? String(row.order_date).slice(0, 10) : createdAt.slice(0, 10);
  let paymentStatus: Order['paymentStatus'] = 'pending';
  if (totalAmount > 0 && paidAmount >= totalAmount) paymentStatus = 'paid';
  else if (paidAmount > 0) paymentStatus = 'partial';
  const src = String(row.source || 'b2b').toLowerCase();
  const source: OrderSource = src === 'agent' ? 'agent' : src === 'admin' ? 'admin' : 'b2b';

  const agentId = row.agent != null ? `django_${row.agent}` : undefined;
  const driverId = row.driver != null ? `django_${row.driver}` : undefined;

  return {
    id,
    orderNumber: `ORD-${id}`,
    source,
    status: normalizeOrderStatus(row.status),
    clientId,
    agentId,
    driverId,
    clientName: String(row.client_name ?? ''),
    clientPhone: '',
    clientAddress: '',
    agentName: row.agent_name ? String(row.agent_name) : undefined,
    driverName: row.driver_name ? String(row.driver_name) : undefined,
    items,
    subtotal: totalAmount,
    discountAmount: 0,
    deliveryFee: 0,
    totalAmount,
    paidAmount,
    paymentStatus,
    orderDate,
    createdBy: clientId,
    createdByName: '',
    createdAt,
    updatedAt: createdAt,
  };
}

/** Map Django `PaymentSerializer` row to frontend `Payment`. */
export function mapApiPaymentRowToPayment(row: ApiPaymentRow): Payment {
  const id = String(row.id);
  const clientId = row.client != null ? `django_${row.client}` : '';
  return {
    id,
    type: normalizePaymentType(row.type),
    direction: 'in',
    amount: Number(row.amount ?? 0),
    currency: 'UZS',
    orderId: row.order != null ? String(row.order) : undefined,
    clientId: clientId || undefined,
    description: String(row.description ?? ''),
    referenceNumber: id,
    createdBy: '',
    createdByName: '',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'salary', 'rent', 'utilities', 'fuel', 'maintenance', 'tax', 'marketing', 'office', 'other',
];

function normalizeExpenseCategory(c: string | undefined): ExpenseCategory {
  const v = String(c || '').toLowerCase();
  return (EXPENSE_CATEGORIES.includes(v as ExpenseCategory) ? v : 'other') as ExpenseCategory;
}

/** Map Django `ExpenseSerializer` row to frontend `Expense`. */
export function mapApiExpenseRowToExpense(row: ApiExpenseRow): Expense {
  const id = String(row.id);
  const dateRaw = row.date ?? row.created_at;
  return {
    id,
    category: normalizeExpenseCategory(row.category),
    amount: Number(row.amount ?? 0),
    description: String(row.description ?? ''),
    date: dateRaw ? String(dateRaw).slice(0, 10) : new Date().toISOString().slice(0, 10),
    createdBy: '',
    createdByName: '',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}
