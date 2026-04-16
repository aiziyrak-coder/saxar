import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Minus, ShoppingCart, ArrowLeft, Package, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { orderService, generateOrderNumber } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import { addToQueue } from '../../services/offlineQueue';
import type { Product, Order, OrderItem, Client } from '../../types';

interface CartRow {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
}

export default function AgentOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const clientName = searchParams.get('clientName') || '';

  const { user, userData } = useAuth();
  const { data: products } = useFirestore<Product>('products');
  const { data: clients } = useFirestore<Client>('clients');
  const client = clients.find(c => c.id === clientId);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = products.filter(
    p => p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  );

  const addToCart = (product: Product, qty: number = 1) => {
    const price = product.b2bPrice || product.basePrice;
    setCart(prev => {
      const existing = prev.find(r => r.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        const total = newQty * existing.unitPrice * (1 - existing.discountPercent / 100);
        return prev.map(r => r.productId === product.id ? { ...r, quantity: newQty, totalPrice: total } : r);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        quantity: qty,
        unitPrice: price,
        discountPercent: client?.discountPercent ?? 0,
        totalPrice: qty * price * (1 - (client?.discountPercent ?? 0) / 100),
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      const row = prev.find(r => r.productId === productId);
      if (!row) return prev;
      const newQty = Math.max(0, row.quantity + delta);
      if (newQty === 0) return prev.filter(r => r.productId !== productId);
      const total = newQty * row.unitPrice * (1 - row.discountPercent / 100);
      return prev.map(r => r.productId === productId ? { ...r, quantity: newQty, totalPrice: total } : r);
    });
  };

  const totalAmount = cart.reduce((s, r) => s + r.totalPrice, 0);

  const handleSubmit = async () => {
    if (!user || !userData || !clientId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const items: OrderItem[] = cart.map(r => ({
        id: `${r.productId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        productId: r.productId,
        productName: r.productName,
        sku: r.sku,
        unit: r.unit,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        discountPercent: r.discountPercent,
        totalPrice: r.totalPrice,
      }));
      const order: Omit<Order, 'id'> = {
        orderNumber: generateOrderNumber(),
        source: 'agent',
        status: 'pending',
        clientId,
        clientName: client?.name || decodeURIComponent(clientName),
        clientPhone: client?.phone || '',
        clientAddress: client?.address || '',
        clientLocation: client?.location,
        items,
        subtotal: totalAmount,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'pending',
        agentId: user.uid,
        agentName: userData.name,
        orderDate: new Date().toISOString().split('T')[0],
        createdBy: user.uid,
        createdByName: userData.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        addToQueue('order', order as Record<string, unknown>);
        setSubmitting(false);
        alert('Buyurtma saqlandi. Internet ulanganda avtomatik yuboriladi.');
        navigate('/agent/shops');
        return;
      }

      const orderId = await orderService.create(order);
      if (userData) {
        await logAudit(AuditActions.ORDER_CREATE, EntityTypes.ORDER, orderId, user.uid, userData.name || '', userData.role, undefined, { orderNumber: order.orderNumber, totalAmount, source: 'agent', clientId });
      }
      navigate('/agent/shops');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n);

  if (!clientId) {
    return (
      <div className="p-4">
        <p className="text-slate-400">Mijoz tanlanmagan.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/agent/shops')}>
          <ArrowLeft className="h-4 w-4" /> Do‘konlar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/agent/shops')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Button>
        <h1 className="text-xl font-bold text-slate-900">
          Buyurtma: {client?.name || decodeURIComponent(clientName)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Mahsulot qidirish..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {filteredProducts.slice(0, 50).map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 border border-emerald-200/60 rounded-2xl hover:bg-emerald-50"
              >
                <div>
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.sku} • {formatPrice(p.b2bPrice || p.basePrice)} / {p.unit}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => addToCart(p)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <Package className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                Mahsulot topilmadi
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Savat ({cart.length} tur)
          </h3>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-sm">Mahsulot qo‘shing</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {cart.map(r => (
                  <div key={r.productId} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div className="text-sm font-medium text-slate-900">{r.productName}</div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(r.productId, -1)} className="p-1 rounded bg-slate-100">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{r.quantity}</span>
                      <button type="button" onClick={() => updateQty(r.productId, 1)} className="p-1 rounded bg-slate-100">
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-24 text-right">{formatPrice(r.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">Jami:</span>
                <span className="text-xl font-bold text-emerald-600">{formatPrice(totalAmount)} UZS</span>
              </div>
              <Button
                variant="primary"
                className="w-full mt-4 gap-2"
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                Buyurtmani yuborish
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
