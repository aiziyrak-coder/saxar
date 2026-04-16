// ==================== USER TYPES ====================
export type UserRole = 'admin' | 'accountant' | 'warehouse' | 'agent' | 'driver' | 'b2b' | 'production';

export interface User {
  id?: string;
  uid: string;
  email: string;
  phone: string;
  role: UserRole;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatar?: string;
  // Role-specific fields
  region?: string; // for agents
  vehicleNumber?: string; // for drivers
  stir?: string; // for b2b clients
  companyName?: string; // for b2b clients
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

// ==================== PRODUCT TYPES ====================
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  sku: string;
  barcode?: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'box';
  weight?: number;
  images: string[];
  // Pricing
  basePrice: number;
  b2bPrice: number;
  costPrice: number;
  // Inventory
  minStock: number;
  maxStock: number;
  // Flags
  isActive: boolean;
  isB2BActive: boolean;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== INVENTORY TYPES ====================
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  manufactureDate: string;
  location: string; // warehouse zone
  status: 'available' | 'reserved' | 'expired' | 'damaged';
  createdAt: string;
}

export type InventoryTransactionType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return';

export interface InventoryTransaction {
  id: string;
  type: InventoryTransactionType;
  productId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  // Reference
  orderId?: string;
  productionId?: string;
  referenceNumber?: string;
  // Details
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
  // User
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

// ==================== CLIENT TYPES ====================
export interface Client {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  stir: string;
  companyName?: string;
  address: string;
  region: string;
  location?: {
    lat: number;
    lng: number;
  };
  // Assignment
  agentId?: string;
  agentName?: string;
  // Pricing
  discountPercent: number;
  paymentType: 'cash' | 'transfer' | 'mixed';
  creditLimit: number;
  creditDays: number;
  // Status
  status: 'active' | 'inactive' | 'pending';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  // Balance
  currentBalance: number;
  totalPurchases: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== ORDER TYPES ====================
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'picking' 
  | 'packed' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export type OrderSource = 'b2b' | 'agent' | 'admin';

export interface Order {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  // Client
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientLocation?: {
    lat: number;
    lng: number;
  };
  // Items
  items: OrderItem[];
  // Pricing
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  // Payment
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  // Assignment
  agentId?: string;
  agentName?: string;
  driverId?: string;
  driverName?: string;
  // Dates
  orderDate: string;
  deliveryDate?: string;
  deliveredAt?: string;
  // Notes
  notes?: string;
  cancelReason?: string;
  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  // Inventory tracking
  batchNumber?: string;
  expiryDate?: string;
}

// ==================== DELIVERY TYPES ====================
export interface Delivery {
  id: string;
  routeId: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed';
  orders: DeliveryOrder[];
  // Route
  startLocation?: {
    lat: number;
    lng: number;
  };
  endLocation?: {
    lat: number;
    lng: number;
  };
  // Timing
  startedAt?: string;
  completedAt?: string;
  // Collections
  totalCashCollected: number;
  totalCardCollected: number;
  // Notes
  notes?: string;
  createdAt: string;
}

export interface DeliveryOrder {
  orderId: string;
  orderNumber: string;
  clientName: string;
  clientAddress: string;
  clientLocation?: {
    lat: number;
    lng: number;
  };
  totalAmount: number;
  status: 'pending' | 'delivered' | 'returned';
  deliveredAt?: string;
  returnReason?: string;
  collectedAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  sequence: number;
}

// ==================== FINANCE TYPES ====================
export type PaymentType = 'cash' | 'card' | 'transfer' | 'click' | 'payme' | 'uzum';
export type PaymentDirection = 'in' | 'out';

export interface Payment {
  id: string;
  type: PaymentType;
  direction: PaymentDirection;
  amount: number;
  currency: 'UZS';
  // Reference
  orderId?: string;
  clientId?: string;
  clientName?: string;
  expenseId?: string;
  // Details
  description: string;
  referenceNumber?: string;
  // User
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'salary' 
  | 'rent' 
  | 'utilities' 
  | 'fuel' 
  | 'maintenance' 
  | 'tax' 
  | 'marketing' 
  | 'office' 
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
  // Approval
  approvedBy?: string;
  approvedAt?: string;
  // User
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

// ==================== KPI TYPES ====================
export interface KPIRecord {
  id: string;
  agentId: string;
  agentName: string;
  period: string; // YYYY-MM
  // Targets
  targetAmount: number;
  targetOrders: number;
  targetNewClients: number;
  // Actual
  actualAmount: number;
  actualOrders: number;
  actualNewClients: number;
  // Calculated
  completionPercent: number;
  bonusAmount: number;
  commissionAmount: number;
  createdAt: string;
}

// ==================== AUDIT LOG TYPES ====================
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  // User
  userId: string;
  userName: string;
  userRole: UserRole;
  // Details
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ==================== CART TYPES ====================
export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  image?: string;
}

// ==================== FILTER TYPES ====================
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// ==================== DASHBOARD TYPES ====================
export interface DashboardStats {
  // Sales
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  // Orders
  dailyOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  ordersChange: number;
  // Clients
  activeClients: number;
  newClientsThisMonth: number;
  clientsChange: number;
  // Finance
  totalReceivables: number;
  overdueReceivables: number;
  // Inventory
  lowStockProducts: number;
  expiringProducts: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// ==================== SETTINGS TYPES ====================
export interface CompanySettings {
  name: string;
  legalName: string;
  stir: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  // Bank details
  bankName?: string;
  bankAccount?: string;
  bankMfo?: string;
}

export interface PricingSettings {
  defaultB2bDiscount: number;
  defaultAgentCommission: number;
  defaultDriverBonusPerKm: number;
  vatPercent: number;
}

export interface NotificationSettings {
  smsEnabled: boolean;
  smsProvider: 'eskiz' | 'playmobile';
  lowStockAlert: boolean;
  expiryAlertDays: number;
  orderStatusNotifications: boolean;
}

// ==================== AKT SVERKA (Mutual Settlement) ====================
export interface AktSverkaRecord {
  date: string;
  description: string;
  debit: number;  // Mijoz qarzi (buyurtma)
  credit: number; // To'lov
  balance: number;
}

export interface AktSverka {
  id: string;
  clientId: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  records: AktSverkaRecord[];
  openingBalance: number;
  closingBalance: number;
  createdAt: string;
}

// ==================== ROUTE SHEET (Marshrut varaqasi) ====================
export interface RouteSheet {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  status: 'planned' | 'in_progress' | 'completed';
  orderIds: string[];
  totalOrders: number;
  totalAmount: number;
  sequence?: number[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== AGENT CHECK-IN / GPS ====================
export interface AgentCheckIn {
  id: string;
  agentId: string;
  agentName: string;
  clientId: string;
  clientName: string;
  location: { lat: number; lng: number };
  checkInAt: string;
  checkOutAt?: string;
  orderId?: string;
  createdAt: string;
}

// ==================== PROMOTION / AKSIYA ====================
export type PromotionType = 'percent' | 'fixed' | 'buy_x_get_y';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  value: number;           // foiz yoki so'm
  buyQuantity?: number;    // buy_x_get_y: x
  getQuantity?: number;    // buy_x_get_y: y (tekin)
  productIds?: string[];  // bo'sh bo'lsa barcha mahsulot
  categoryIds?: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== PAYROLL (Ish haqi) ====================
export interface PayrollItem {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  period: string; // YYYY-MM
  baseSalary: number;
  bonusAmount: number;
  commissionAmount: number;
  deductionAmount: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== CASH / BANK ACCOUNTS ====================
export interface CashAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'terminal' | 'click' | 'payme' | 'uzum';
  balance: number;
  currency: 'UZS';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== DELIVERY RETURN ====================
export interface DeliveryReturn {
  id: string;
  deliveryId: string;
  orderId: string;
  productId?: string;
  quantity?: number;
  reason: 'expired' | 'damaged' | 'wrong' | 'refused' | 'other';
  reasonText?: string;
  createdBy: string;
  createdAt: string;
}
