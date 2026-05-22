import type { DashboardStats, ChartData, Order } from '../types';
import { fetchAllOrdersMerged } from '../utils/mergedData';
import { djangoUsersApi } from './platformApi';
import { hasDjangoJwt } from './djangoAuth';

export function emptyDashboardStats(): DashboardStats {
  return {
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    dailyOrders: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
    ordersChange: 0,
    activeClients: 0,
    newClientsThisMonth: 0,
    clientsChange: 0,
    totalReceivables: 0,
    overdueReceivables: 0,
    lowStockProducts: 0,
    expiringProducts: 0,
  };
}

export function emptySalesChartData(days: number): ChartData {
  const labels: string[] = [];
  const data: number[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }));
    data.push(0);
  }
  return {
    labels,
    datasets: [{ label: 'Savdo (UZS)', data, color: '#4f46e5' }],
  };
}

const DELIVERED_STATUSES = ['confirmed', 'picking', 'packed', 'in_transit', 'delivered'];

function isCountableOrder(o: Order): boolean {
  return DELIVERED_STATUSES.includes(o.status);
}

async function loadOrders(): Promise<Order[]> {
  if (!hasDjangoJwt()) return [];
  return fetchAllOrdersMerged();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const orders = (await loadOrders()).filter(isCountableOrder);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyOrders = orders.filter((o) => o.orderDate === todayStr);
    const weeklyOrders = orders.filter((o) => o.orderDate && new Date(o.orderDate) >= weekAgo);
    const monthlyOrders = orders.filter((o) => o.orderDate && new Date(o.orderDate) >= monthStart);

    let activeClients = 0;
    let newClientsThisMonth = 0;
    if (hasDjangoJwt()) {
      try {
        const clients = await djangoUsersApi.list('b2b');
        activeClients = clients.filter((c) => c.is_active !== false).length;
        newClientsThisMonth = activeClients;
      } catch {
        /* ignore */
      }
    }

    return {
      dailyRevenue: dailyOrders.reduce((s, o) => s + o.totalAmount, 0),
      weeklyRevenue: weeklyOrders.reduce((s, o) => s + o.totalAmount, 0),
      monthlyRevenue: monthlyOrders.reduce((s, o) => s + o.totalAmount, 0),
      revenueChange: 0,
      dailyOrders: dailyOrders.length,
      weeklyOrders: weeklyOrders.length,
      monthlyOrders: monthlyOrders.length,
      ordersChange: 0,
      activeClients,
      newClientsThisMonth,
      clientsChange: 0,
      totalReceivables: 0,
      overdueReceivables: 0,
      lowStockProducts: 0,
      expiringProducts: 0,
    };
  } catch {
    return emptyDashboardStats();
  }
}

export async function getSalesChartData(days: number = 30): Promise<ChartData> {
  const orders = (await loadOrders()).filter(isCountableOrder);
  const labels: string[] = [];
  const data: number[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    labels.push(date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }));
    data.push(
      orders.filter((o) => o.orderDate === dateStr).reduce((s, o) => s + o.totalAmount, 0)
    );
  }

  return {
    labels,
    datasets: [{ label: 'Savdo (UZS)', data, color: '#4f46e5' }],
  };
}

export async function getTopProducts(limitCount: number = 10): Promise<{ name: string; sales: number; quantity: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const orders = (await loadOrders()).filter(
    (o) => isCountableOrder(o) && o.orderDate && new Date(o.orderDate) >= thirtyDaysAgo
  );

  const productStats: Record<string, { name: string; sales: number; quantity: number }> = {};
  orders.forEach((order) => {
    order.items?.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = { name: item.productName, sales: 0, quantity: 0 };
      }
      productStats[item.productId].sales += item.totalPrice;
      productStats[item.productId].quantity += item.quantity;
    });
  });

  return Object.values(productStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limitCount);
}

export async function getTopAgents(limitCount: number = 5): Promise<{ name: string; region: string; sales: number; orders: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const orders = (await loadOrders()).filter(
    (o) =>
      isCountableOrder(o) &&
      o.agentId &&
      o.orderDate &&
      new Date(o.orderDate) >= thirtyDaysAgo
  );

  const agentStats: Record<string, { name: string; region: string; sales: number; orders: number }> = {};
  orders.forEach((order) => {
    if (!order.agentId) return;
    if (!agentStats[order.agentId]) {
      agentStats[order.agentId] = {
        name: order.agentName || 'Noma\'lum',
        region: '',
        sales: 0,
        orders: 0,
      };
    }
    agentStats[order.agentId].sales += order.totalAmount;
    agentStats[order.agentId].orders += 1;
  });

  return Object.values(agentStats)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limitCount);
}

export async function getRecentOrders(limitCount: number = 10): Promise<Order[]> {
  const orders = await loadOrders();
  return orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
}

export async function getSalesByRegion(): Promise<{ region: string; sales: number; orders: number; clients: number }[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const orders = (await loadOrders()).filter(
    (o) => isCountableOrder(o) && o.orderDate && new Date(o.orderDate) >= thirtyDaysAgo
  );

  const regionStats: Record<string, { sales: number; orders: number; clients: Set<string> }> = {};
  orders.forEach((o) => {
    const region = o.notes?.split('\n')[0]?.trim() || 'Noma\'lum';
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

export async function getPendingApprovalsCount(): Promise<{
  clients: number;
  orders: number;
  expenses: number;
}> {
  let clients = 0;
  if (hasDjangoJwt()) {
    try {
      const rows = await djangoUsersApi.list('b2b');
      clients = rows.filter((c) => c.is_active === false).length;
    } catch {
      /* ignore */
    }
  }
  const orders = (await loadOrders()).filter((o) => o.status === 'pending').length;
  return { clients, orders, expenses: 0 };
}

export async function getPLSummary(startDate: string, endDate: string): Promise<{
  revenue: number;
  expenses: number;
  profit: number;
}> {
  const orders = (await loadOrders()).filter(
    (o) =>
      isCountableOrder(o) &&
      o.orderDate &&
      o.orderDate >= startDate &&
      o.orderDate <= endDate
  );
  const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  return { revenue, expenses: 0, profit: revenue };
}
