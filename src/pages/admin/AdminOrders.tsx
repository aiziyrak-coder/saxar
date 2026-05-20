import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Search, ShoppingCart, CheckCircle2, Clock, AlertCircle, Truck, Download, Printer, Copy, Plus, Trash2, Loader2 } from 'lucide-react';
import { useDebouncedValue } from '../../platform/useDebouncedValue';
import { downloadCsv } from '../../platform/csv';
import { copyToClipboard } from '../../platform/clipboard';
import { printHtmlDocument } from '../../platform/printHtml';
import { buildOrderReceiptHtml, type OrderReceiptLike } from '../../platform/orderReceipt';
import { normalizeSku } from '../../platform/skuFormat';
import { addNotification } from '../../platform/notifications';
import { ORDER_NOTE_TEMPLATES } from '../../platform/orderNoteTemplates';
import { useFirestore } from '../../hooks/useFirestore';
import { generateOrderNumber } from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus, Product, Client } from '../../types';

interface OrderRow extends OrderReceiptLike {}

const ORDER_STATUS_UZ: Record<OrderStatus, string> = {
  pending: 'Yangi',
  confirmed: 'Tasdiqlangan',
  picking: 'Yig\u2019ilmoqda',
  packed: 'Qadoqlangan',
  in_transit: 'Yetkazilmoqda',
  delivered: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
  returned: 'Qaytarilgan',
};

function mapOrderToRow(o: Order): OrderRow {
  const dateStr = o.orderDate
    ? new Date(o.orderDate).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
    : '\u2014';
  const lineKinds = new Set(o.items.map((i) => i.productId || i.productName)).size;
  return {
    id: o.orderNumber || o.id,
    client: o.clientName,
    date: dateStr,
    amount: o.totalAmount,
    status: ORDER_STATUS_UZ[o.status] ?? o.status,
    items: lineKinds || o.items.length,
    agent: o.agentName || o.createdByName || '\u2014',
  };
}

interface OrderItemForm {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function AdminOrders() {
  const { userData } = useAuth();
  const { data: orders, loading: ordersLoading, create: createOrder } = useFirestore<Order>('orders');
  const { data: products } = useFirestore<Product>('products');
  const { data: clients } = useFirestore<Client>('clients');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<OrderRow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderForm, setOrderForm] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    notes: '',
  });

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setOrderForm(f => ({
      ...f,
      clientId,
      clientName: client?.name || '',
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',
    }));
  };
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0 },
  ]);

  const orderTotal = orderItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleProductSelect = (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    setOrderItems(prev => prev.map((item, i) =>
      i === idx
        ? { ...item, productId, productName: product?.name || '', unitPrice: product?.basePrice || 0 }
        : item
    ));
  };

  const handleCreateOrder = async () => {
    if (!orderForm.clientName.trim() || orderItems.every(i => !i.productName)) return;
    setSaving(true);
    try {
      const orderNumber = generateOrderNumber();
      const validItems = orderItems.filter(i => i.productName.trim());
      await createOrder({
        orderNumber,
        source: 'admin',
        status: 'pending',
        clientId: orderForm.clientId,
        clientName: orderForm.clientName.trim(),
        clientPhone: orderForm.clientPhone.trim(),
        clientAddress: orderForm.clientAddress.trim(),
        items: validItems.map((item, idx) => ({
          id: `item-${idx}`,
          productId: item.productId,
          productName: item.productName,
          sku: normalizeSku(products.find(p => p.id === item.productId)?.sku || ''),
          unit: 'kg',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: 0,
          totalPrice: item.quantity * item.unitPrice,
        })),
        subtotal: orderTotal,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount: orderTotal,
        paidAmount: 0,
        paymentStatus: 'pending',
        orderDate: new Date().toISOString(),
        notes: orderForm.notes.trim(),
        createdBy: userData?.uid || '',
        createdByName: userData?.name || '',
      } as Omit<Order, 'id'>);
      setShowCreateModal(false);
      setOrderForm({ clientId: '', clientName: '', clientPhone: '', clientAddress: '', notes: '' });
      setOrderItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
      addNotification('Buyurtma yaratildi', `${orderNumber} muvaffaqiyatli saqlandi.`);
    } catch (e) {
      console.error(e);
      addNotification('Xatolik', 'Buyurtma yaratishda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => orders.map(mapOrderToRow), [orders]);

  const filteredOrders = useMemo(
    () =>
      rows.filter(
        (order) =>
          order.id.toLowerCase().includes(debounced.toLowerCase()) ||
          order.client.toLowerCase().includes(debounced.toLowerCase())
      ),
    [rows, debounced]
  );

  const allSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selected[o.id]);
  const toggleAll = () => {
    if (allSelected) {
      const next = { ...selected };
      filteredOrders.forEach((o) => {
        delete next[o.id];
      });
      setSelected(next);
    } else {
      const next = { ...selected };
      filteredOrders.forEach((o) => {
        next[o.id] = true;
      });
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectedRows = filteredOrders.filter((o) => selected[o.id]);
  const rowsForExport = (selectedRows.length ? selectedRows : filteredOrders).map((o) => ({
    buyurtma: o.id,
    mijoz: o.client,
    sana: o.date,
    summa: o.amount,
    status: o.status,
    pozitsiya: o.items,
    agent: o.agent,
  }));

  const exportCsv = () => {
    downloadCsv(`buyurtmalar-${Date.now()}.csv`, rowsForExport);
    addNotification('CSV eksport', `${rowsForExport.length} ta qator yuklandi.`);
  };

  const printOne = (o: OrderRow) => {
    printHtmlDocument(`Buyurtma ${o.id}`, buildOrderReceiptHtml(o));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Buyurtmalar</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" type="button" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV ({selectedRows.length || filteredOrders.length})
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => setShowCreateModal(true)}
          >
            <ShoppingCart className="h-4 w-4" /> Yangi buyurtma
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden dark:bg-slate-900/80 dark:border-slate-700">
        <div className="p-4 border-b border-emerald-200/60 flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 dark:border-slate-700">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buyurtma ID yoki mijoz nomi (debounce 300ms)..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/70 border-b border-emerald-200/60 dark:bg-slate-900/80 dark:border-slate-700">
                <th className="py-3 px-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Hammasini tanlash" />
                </th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">Buyurtma ID / Sana</th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">Mijoz / Agent</th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">Mahsulotlar</th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">Summa</th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {ordersLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!ordersLoading &&
                filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-emerald-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-3">
                    <input type="checkbox" checked={!!selected[order.id]} onChange={() => toggleOne(order.id)} aria-label={order.id} />
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{order.id}</div>
                    <div className="text-xs text-slate-400 mt-1">{order.date}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{order.client}</div>
                    <div className="text-xs text-slate-400 mt-1">Agent: {order.agent}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-200">{order.items} xil</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-slate-100">{order.amount.toLocaleString()} UZS</td>
                  <td className="py-4 px-6 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Yangi'
                          ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/30'
                          : order.status === 'Tasdiqlangan'
                            ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/30'
                            : order.status === 'Yetkazilmoqda'
                              ? 'bg-amber-500/20 text-amber-900 border border-amber-500/30'
                              : order.status === 'Yakunlangan'
                                ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-800 border border-red-500/30'
                      }`}
                    >
                      {order.status === 'Yangi' && <Clock className="h-3 w-3" />}
                      {order.status === 'Tasdiqlangan' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'Yetkazilmoqda' && <Truck className="h-3 w-3" />}
                      {order.status === 'Yakunlangan' && <CheckCircle2 className="h-3 w-3" />}
                      {order.status === 'Bekor qilingan' && <AlertCircle className="h-3 w-3" />}
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setDetail(order)}>
                      Ko&apos;rish
                    </Button>
                    <Button variant="ghost" size="sm" type="button" title="Nusxa" onClick={() => void copyToClipboard(order.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" type="button" title="Chop etish" onClick={() => printOne(order)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!ordersLoading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {rows.length === 0 ? 'Hozircha buyurtmalar yo\u2019q' : 'Buyurtma topilmadi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `Buyurtma ${detail.id}` : ''} size="md">
        {detail && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Mijoz:</strong> {detail.client}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Summa:</strong> {detail.amount.toLocaleString()} UZS
            </p>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Izoh shablonlari (nusxa)</p>
              <div className="flex flex-wrap gap-2">
                {ORDER_NOTE_TEMPLATES.map((t) => (
                  <Button key={t.id} size="sm" variant="outline" type="button" onClick={() => void copyToClipboard(t.text)}>
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => printOne(detail)}>
                Chop etish
              </Button>
              <Button variant="primary" type="button" onClick={() => setDetail(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Yangi buyurtma" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mijoz *</label>
            {clients.length > 0 ? (
              <select
                className="block w-full rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                value={orderForm.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
              >
                <option value="">Mijoz tanlang</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Mijoz nomi *"
                value={orderForm.clientName}
                onChange={(e) => setOrderForm(f => ({ ...f, clientName: e.target.value }))}
              />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Telefon"
              value={orderForm.clientPhone}
              onChange={(e) => setOrderForm(f => ({ ...f, clientPhone: e.target.value }))}
            />
            <Input
              placeholder="Manzil"
              value={orderForm.clientAddress}
              onChange={(e) => setOrderForm(f => ({ ...f, clientAddress: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Mahsulotlar</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setOrderItems(prev => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0 }])}
              >
                <Plus className="h-3 w-3" /> Qo&apos;shish
              </Button>
            </div>
            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-full border-emerald-200/60 bg-white/75 py-2.5 pl-3 pr-10 text-slate-900 border text-sm"
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                  >
                    <option value="">Mahsulot tanlang</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    placeholder="Soni"
                    value={item.quantity}
                    onChange={(e) => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) || 0 } : it))}
                  />
                  <Input
                    type="number"
                    min="0"
                    className="w-28"
                    placeholder="Narx"
                    value={item.unitPrice}
                    onChange={(e) => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) || 0 } : it))}
                  />
                  <span className="text-sm font-medium text-slate-600 w-24 text-right">
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </span>
                  {orderItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-sm text-slate-500">Jami:</span>
            <span className="text-lg font-bold text-slate-900">{orderTotal.toLocaleString()} UZS</span>
          </div>

          <Input
            placeholder="Izoh (ixtiyoriy)"
            value={orderForm.notes}
            onChange={(e) => setOrderForm(f => ({ ...f, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="button" variant="primary" onClick={handleCreateOrder} disabled={saving || !orderForm.clientName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
