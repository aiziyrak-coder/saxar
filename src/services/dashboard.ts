import { getFirebaseDb } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import type { DashboardStats, ChartData, Order } from '../types';

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Get start of month
  const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = startOfMonthDate.toISOString().split('T')[0];
  
  // Get yesterday for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Daily revenue
  const dailyOrdersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '==', todayStr),
    where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'])
  );
  const dailyOrdersSnap = await getDocs(dailyOrdersQuery);
  const dailyRevenue = dailyOrdersSnap.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
  const dailyOrders = dailyOrdersSnap.docs.length;

  // Yesterday's revenue for comparison
  const yesterdayOrdersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '==', yesterdayStr),
    where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'])
  );
  const yesterdayOrdersSnap = await getDocs(yesterdayOrdersQuery);
  const yesterdayRevenue = yesterdayOrdersSnap.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
  const revenueChange = yesterdayRevenue > 0 ? ((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  // Monthly revenue
  const monthlyOrdersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '>=', startOfMonthStr),
    where('orderDate', '<=', todayStr),
    where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'])
  );
  const monthlyOrdersSnap = await getDocs(monthlyOrdersQuery);
  const monthlyRevenue = monthlyOrdersSnap.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
  const monthlyOrders = monthlyOrdersSnap.docs.length;

  // Active clients
  const clientsQuery = query(
    collection(getFirebaseDb(), 'clients'),
    where('status', '==', 'active')
  );
  const clientsSnap = await getDocs(clientsQuery);
  const activeClients = clientsSnap.docs.length;

  // New clients this month
  const newClientsQuery = query(
    collection(getFirebaseDb(), 'clients'),
    where('createdAt', '>=', startOfMonthDate.toISOString()),
    where('status', '==', 'active')
  );
  const newClientsSnap = await getDocs(newClientsQuery);
  const newClientsThisMonth = newClientsSnap.docs.length;

  // Total receivables
  const receivablesQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('paymentStatus', 'in', ['pending', 'partial']),
    where('status', 'in', ['delivered', 'in_transit'])
  );
  const receivablesSnap = await getDocs(receivablesQuery);
  const totalReceivables = receivablesSnap.docs.reduce((sum, doc) => {
    const data = doc.data();
    return sum + (data.totalAmount - (data.paidAmount || 0));
  }, 0);

  // Overdue receivables (orders delivered more than 14 days ago)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const overdueReceivables = receivablesSnap.docs.reduce((sum, doc) => {
    const data = doc.data();
    const deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : null;
    if (deliveredAt && deliveredAt < fourteenDaysAgo) {
      return sum + (data.totalAmount - (data.paidAmount || 0));
    }
    return sum;
  }, 0);

  // Low stock products
  const inventoryQuery = query(
    collection(getFirebaseDb(), 'inventory'),
    where('status', '==', 'available')
  );
  const inventorySnap = await getDocs(inventoryQuery);
  const productQuantities: Record<string, number> = {};
  inventorySnap.docs.forEach(doc => {
    const data = doc.data();
    productQuantities[data.productId] = (productQuantities[data.productId] || 0) + (data.quantity || 0);
  });
  
  // Get products with minStock
  const productsQuery = query(collection(getFirebaseDb(), 'products'));
  const productsSnap = await getDocs(productsQuery);
  let lowStockProducts = 0;
  productsSnap.docs.forEach(doc => {
    const data = doc.data();
    const currentQty = productQuantities[doc.id] || 0;
    if (currentQty < (data.minStock || 10)) {
      lowStockProducts++;
    }
  });

  // Expiring products (within 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const expiringQuery = query(
    collection(getFirebaseDb(), 'inventory'),
    where('expiryDate', '<=', sevenDaysFromNow.toISOString()),
    where('status', '==', 'available')
  );
  const expiringSnap = await getDocs(expiringQuery);
  const expiringProducts = expiringSnap.docs.length;

  return {
    dailyRevenue,
    weeklyRevenue: dailyRevenue * 7, // Simplified calculation
    monthlyRevenue,
    revenueChange,
    dailyOrders,
    weeklyOrders: dailyOrders * 7,
    monthlyOrders,
    ordersChange: 0, // Would need historical data
    activeClients,
    newClientsThisMonth,
    clientsChange: 0,
    totalReceivables,
    overdueReceivables,
    lowStockProducts,
    expiringProducts,
  };
}

// Get sales chart data
export async function getSalesChartData(days: number = 30): Promise<ChartData> {
  const labels: string[] = [];
  const data: number[] = [];
  
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
    
    labels.push(label);
    
    // Get orders for this date
    const ordersQuery = query(
      collection(getFirebaseDb(), 'orders'),
      where('orderDate', '==', dateStr),
      where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'])
    );
    const ordersSnap = await getDocs(ordersQuery);
    const dailyTotal = ordersSnap.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
    
    data.push(dailyTotal);
  }
  
  return {
    labels,
    datasets: [{
      label: 'Savdo (UZS)',
      data,
      color: '#4f46e5',
    }],
  };
}

// Get top products
export async function getTopProducts(limitCount: number = 10): Promise<{ name: string; sales: number; quantity: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '>=', thirtyDaysAgo.toISOString().split('T')[0]),
    where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'])
  );
  const ordersSnap = await getDocs(ordersQuery);
  
  const productStats: Record<string, { name: string; sales: number; quantity: number }> = {};
  
  ordersSnap.docs.forEach(doc => {
    const order = doc.data() as Order;
    order.items?.forEach(item => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          name: item.productName,
          sales: 0,
          quantity: 0,
        };
      }
      productStats[item.productId].sales += item.totalPrice;
      productStats[item.productId].quantity += item.quantity;
    });
  });
  
  return Object.values(productStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limitCount);
}

// Get top agents
export async function getTopAgents(limitCount: number = 5): Promise<{ name: string; region: string; sales: number; orders: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '>=', thirtyDaysAgo.toISOString().split('T')[0]),
    where('status', 'in', ['confirmed', 'picking', 'packed', 'in_transit', 'delivered']),
    where('agentId', '!=', null)
  );
  const ordersSnap = await getDocs(ordersQuery);
  
  const agentStats: Record<string, { name: string; region: string; sales: number; orders: number }> = {};
  
  ordersSnap.docs.forEach(doc => {
    const order = doc.data() as Order;
    if (order.agentId) {
      if (!agentStats[order.agentId]) {
        agentStats[order.agentId] = {
          name: order.agentName || 'Noma\'lum',
          region: '', // Would need to fetch from user data
          sales: 0,
          orders: 0,
        };
      }
      agentStats[order.agentId].sales += order.totalAmount;
      agentStats[order.agentId].orders += 1;
    }
  });
  
  return Object.values(agentStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limitCount);
}

// Get recent orders
export async function getRecentOrders(limitCount: number = 10): Promise<Order[]> {
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const ordersSnap = await getDocs(ordersQuery);
  return ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

// Sales by region (mijozlar tahlili - qaysi hududda savdo yaxshi)
export async function getSalesByRegion(): Promise<{ region: string; sales: number; orders: number; clients: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [ordersSnap, clientsSnap] = await Promise.all([
    getDocs(query(
      collection(getFirebaseDb(), 'orders'),
      where('orderDate', '>=', dateStr),
      limit(500)
    )),
    getDocs(collection(getFirebaseDb(), 'clients')),
  ]);

  const validStatuses = ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'];

  const clientRegion: Record<string, string> = {};
  clientsSnap.docs.forEach(d => {
    const data = d.data();
    clientRegion[d.id] = (data.region as string) || 'Noma\'lum';
  });

  const regionStats: Record<string, { sales: number; orders: number; clients: Set<string> }> = {};
  ordersSnap.docs.forEach(doc => {
    const o = doc.data() as Order;
    if (!validStatuses.includes(o.status)) return;
    const region = clientRegion[o.clientId] || 'Noma\'lum';
    if (!regionStats[region]) {
      regionStats[region] = { sales: 0, orders: 0, clients: new Set() };
    }
    regionStats[region].sales += o.totalAmount || 0;
    regionStats[region].orders += 1;
    regionStats[region].clients.add(o.clientId);
  });

  return Object.entries(regionStats)
    .map(([region, s]) => ({
      region,
      sales: s.sales,
      orders: s.orders,
      clients: s.clients.size,
    }))
    .sort((a, b) => b.sales - a.sales);
}

// Get pending approvals count
export async function getPendingApprovalsCount(): Promise<{
  clients: number;
  orders: number;
  expenses: number;
}> {
  // Pending clients
  const clientsQuery = query(
    collection(getFirebaseDb(), 'clients'),
    where('registrationStatus', '==', 'pending')
  );
  const clientsSnap = await getDocs(clientsQuery);
  
  // Pending orders
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('status', '==', 'pending')
  );
  const ordersSnap = await getDocs(ordersQuery);
  
  // Pending expenses (would need expense approval workflow)
  const expensesQuery = query(
    collection(getFirebaseDb(), 'expenses'),
    where('approvedBy', '==', null)
  );
  const expensesSnap = await getDocs(expensesQuery);
  
  return {
    clients: clientsSnap.docs.length,
    orders: ordersSnap.docs.length,
    expenses: expensesSnap.docs.length,
  };
}

/** P&L: berilgan davr uchun daromad, xarajat va toza foyda */
export async function getPLSummary(
  startDate: string,
  endDate: string
): Promise<{ revenue: number; expenses: number; profit: number }> {
  const ordersQuery = query(
    collection(getFirebaseDb(), 'orders'),
    where('orderDate', '>=', startDate),
    where('orderDate', '<=', endDate),
    limit(1000)
  );
  const expensesQuery = query(
    collection(getFirebaseDb(), 'expenses'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    limit(1000)
  );
  const [ordersSnap, expensesSnap] = await Promise.all([
    getDocs(ordersQuery),
    getDocs(expensesQuery),
  ]);
  const deliveredStatuses = ['delivered'];
  const revenue = ordersSnap.docs.reduce((sum, d) => {
    const data = d.data();
    if (deliveredStatuses.includes(data.status)) return sum + (data.totalAmount || 0);
    return sum;
  }, 0);
  const expenses = expensesSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
  return { revenue, expenses, profit: revenue - expenses };
}
