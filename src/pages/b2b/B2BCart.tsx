import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash2, Plus, Minus, ArrowRight, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { orderService, generateOrderNumber } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import { Modal } from '../../components/ui/Modal';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase';
import type { Order } from '../../types';
import { logger } from '../../services/logger';

export default function B2BCart() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { items, totalAmount, totalCount, updateQuantity, removeFromCart, clearCart } = useCart(user?.uid);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(getFirebaseDb(), 'clients', user.uid)).then((snap) => {
      if (snap.exists()) setClientAddress(snap.data().address || '');
    }).catch(() => {});
  }, [user?.uid]);

  const handleCheckout = async () => {
    if (!user || !userData || items.length === 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const order: Omit<Order, 'id'> = {
        orderNumber: generateOrderNumber(),
        source: 'b2b',
        status: 'pending',
        clientId: user.uid,
        clientName: userData.name || userData.companyName || 'Noma\'lum',
        clientPhone: userData.phone || '',
        clientAddress: clientAddress || userData.address || '',
        items: items.map(item => ({
          id: `${item.productId}_${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          totalPrice: item.totalPrice,
        })),
        subtotal: totalAmount,
        discountAmount: 0,
        deliveryFee: 0,
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'pending',
        notes: orderNotes,
        orderDate: new Date().toISOString().split('T')[0],
        createdBy: user.uid,
        createdByName: userData.name || 'B2B Mijoz',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const orderId = await orderService.create(order);
      if (userData) {
        await logAudit(AuditActions.ORDER_CREATE, EntityTypes.ORDER, orderId, user.uid, userData.name || '', userData.role, undefined, { orderNumber: order.orderNumber, totalAmount: order.totalAmount });
      }
      clearCart();
      setShowConfirmModal(false);
      navigate('/b2b/orders');
    } catch (error) {
      logger.error('Buyurtma yaratishda xatolik', error instanceof Error ? error : undefined);
      alert('Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Savatcha</h1>
        <div className="text-center py-10 sm:py-16 px-3 bg-white rounded-xl border border-slate-200">
          <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Savatchangiz bo'sh</h3>
          <p className="text-slate-500 mb-6">Mahsulotlarni ko'rish va savatga qo'shish uchun katalogga o'ting</p>
          <Button variant="primary" onClick={() => navigate('/b2b/catalog')}>
            Katalogga o'tish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Savatcha</h1>
        <Button variant="outline" onClick={() => navigate('/b2b/catalog')}>
          Katalogga qaytish
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="flex flex-col sm:flex-row items-center gap-6 p-4">
              <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-slate-900">{item.productName}</h3>
                <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                <div className="text-emerald-600 font-medium mt-1">
                  {formatPrice(item.unitPrice)} UZS / {item.unit}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 hover:bg-white rounded text-slate-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 hover:bg-white rounded text-slate-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-32 text-right font-bold text-slate-900">
                  {formatPrice(item.totalPrice)} UZS
                </div>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Buyurtma xulosasi</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Mahsulotlar ({items.length} tur, {totalCount} dona):</span>
                <span className="font-medium text-slate-900">{formatPrice(totalAmount)} UZS</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Yetkazib berish:</span>
                <span className="font-medium text-emerald-600">Bepul</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Chegirma:</span>
                <span className="font-medium text-slate-900">0 UZS</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Jami to'lov:</span>
                <span className="text-2xl font-bold text-emerald-600">{formatPrice(totalAmount)} UZS</span>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Qo'shimcha izoh</label>
              <textarea
                className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                rows={3}
                placeholder="Buyurtma bo'yicha qo'shimcha ma'lumot..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              className="w-full gap-2 py-3 text-lg"
              onClick={() => setShowConfirmModal(true)}
            >
              Buyurtmani rasmiylashtirish <ArrowRight className="h-5 w-5" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Buyurtmani tasdiqlash"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Siz <strong>{items.length}</strong> turdagi mahsulotni buyurtma qilmoqchisiz.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-slate-600">Jami summa:</span>
              <span className="font-bold text-slate-900">{formatPrice(totalAmount)} UZS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">To'lov usuli:</span>
              <span className="font-medium text-slate-900">Naqd / O'tkazma</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Yuborilmoqda...' : 'Tasdiqlash'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
