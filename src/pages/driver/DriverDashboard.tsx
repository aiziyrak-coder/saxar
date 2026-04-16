import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MapPin, Truck, CheckCircle2, Wallet, Navigation, Package, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { orderService, paymentService } from '../../services/firestore';
import { logAudit, AuditActions, EntityTypes } from '../../services/audit';
import type { Order, Payment } from '../../types';

export default function DriverDashboard() {
  const { user, userData } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [returnReason, setReturnReason] = useState('');

  // Get driver's assigned orders for today (marshrut varaqasi)
  const today = new Date().toISOString().split('T')[0];
  const { data: orders, loading, refresh } = useFirestore<Order>('orders');
  const driverOrders = orders.filter(o => 
    o.driverId === user?.uid && 
    o.orderDate === today &&
    !['cancelled'].includes(o.status)
  );

  const completedOrders = driverOrders.filter(o => o.status === 'delivered');
  const pendingOrders = driverOrders.filter(o => o.status !== 'delivered');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => setCurrentLocation(position),
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleDeliver = async (order: Order) => {
    try {
      await orderService.update(order.id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });
      refresh();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

    try {
      const payment: Omit<Payment, 'id'> = {
        type: paymentType === 'cash' ? 'cash' : 'card',
        direction: 'in',
        amount: parseInt(paymentAmount),
        currency: 'UZS',
        orderId: selectedOrder.id,
        clientId: selectedOrder.clientId,
        clientName: selectedOrder.clientName,
        description: `Yetkazib berish uchun to'lov - ${selectedOrder.orderNumber}`,
        createdBy: user?.uid || '',
        createdByName: user?.displayName || 'Dastavkachi',
        createdAt: new Date().toISOString(),
      };

      const paymentId = await paymentService.create(payment);
      if (userData) {
        await logAudit(AuditActions.PAYMENT_CREATE, EntityTypes.PAYMENT, paymentId, user?.uid || '', userData.name || 'Dastavkachi', userData.role, undefined, { amount: parseInt(paymentAmount), orderId: selectedOrder.id, type: payment.type });
      }

      // Update order paid amount
      const newPaidAmount = (selectedOrder.paidAmount || 0) + parseInt(paymentAmount);
      await orderService.update(selectedOrder.id, {
        paidAmount: newPaidAmount,
        paymentStatus: newPaidAmount >= selectedOrder.totalAmount ? 'paid' : 'partial',
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      refresh();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const handleReturn = async () => {
    const orderToReturn = returnOrderId ? driverOrders.find(o => o.id === returnOrderId) : null;
    if (!orderToReturn || !returnReason) return;

    try {
      await orderService.update(orderToReturn.id, {
        status: 'returned',
        cancelReason: returnReason,
      });
      setShowReturnModal(false);
      setReturnReason('');
      setReturnOrderId(null);
      refresh();
    } catch (error) {
      console.error('Failed to process return:', error);
    }
  };

  const openReturnModal = () => {
    setReturnOrderId(pendingOrders[0]?.id ?? null);
    setReturnReason('');
    setShowReturnModal(true);
  };

  const totalAmount = driverOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const collectedAmount = driverOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Current Route Status */}
      <Card className="bg-white/70 text-slate-900 border border-emerald-200/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <div className="text-slate-400 text-sm mb-1">Bugungi marshrut</div>
            <h2 className="font-bold text-xl">{driverOrders.length} ta buyurtma</h2>
          </div>
          <div className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-emerald-500/30">
            <Truck className="h-4 w-4" /> Yo'lda
          </div>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div>
            <div className="flex justify-between text-sm mb-2 text-slate-700">
              <span>Yetkazildi: {completedOrders.length}/{driverOrders.length}</span>
              <span className="font-bold text-slate-900">
                {driverOrders.length > 0 ? Math.round((completedOrders.length / driverOrders.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                style={{ width: `${driverOrders.length > 0 ? (completedOrders.length / driverOrders.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Jami summa</div>
              <div className="font-bold text-lg">{formatCurrency(totalAmount)} UZS</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Yig'ilgan pul</div>
              <div className="font-bold text-lg text-emerald-400">{formatCurrency(collectedAmount)} UZS</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="primary" 
          className="h-24 flex-col gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowPaymentModal(true)}
        >
          <Wallet className="h-6 w-6" />
          <span>Pul yig'ish</span>
        </Button>
        <Button 
          variant="secondary" 
          className="h-24 flex-col gap-2 shadow-sm border-emerald-200/60"
          onClick={openReturnModal}
          disabled={pendingOrders.length === 0}
        >
          <RotateCcw className="h-6 w-6" />
          <span>Vozvrat kiritish</span>
        </Button>
      </div>

      {/* Route Points */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900">Manzillar</h3>
          <button 
            className="text-sm text-emerald-300 font-medium flex items-center gap-1"
            onClick={() => {
              if (currentLocation && pendingOrders.length > 0) {
                const nextOrder = pendingOrders[0];
                if (nextOrder.clientLocation) {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.coords.latitude},${currentLocation.coords.longitude}&destination=${nextOrder.clientLocation.lat},${nextOrder.clientLocation.lng}`;
                  window.open(url, '_blank');
                }
              }
            }}
          >
            <Navigation className="h-4 w-4" /> Xarita
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : driverOrders.length === 0 ? (
          <div className="text-center py-8 bg-white/60 border border-emerald-200/60 rounded-3xl">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Bugun buyurtmalar yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {driverOrders.map((order, index) => (
              <Card 
                key={order.id} 
                  className={`p-4 shadow-sm border-emerald-200/60 ${
                  order.status === 'delivered' ? 'opacity-60' : 'ring-2 ring-emerald-600/60 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{order.clientName}</h4>
                      <span className="text-xs text-slate-400">#{order.orderNumber}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {order.clientAddress}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' 
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  }`}>
                    {order.status === 'delivered' ? 'Topshirildi' : `${index + 1}-navbat`}
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4 pt-3 border-t border-emerald-200/60">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Summa</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {formatCurrency(order.totalAmount)} UZS
                    </div>
                    {order.paidAmount > 0 && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Yig'ildi: {formatCurrency(order.paidAmount)} UZS
                      </div>
                    )}
                  </div>
                  {order.status !== 'delivered' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowPaymentModal(true);
                        }}
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleDeliver(order)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Topshirildi
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pul yig'ish"
        size="sm"
      >
        <div className="space-y-4">
          {selectedOrder && (
            <div className="bg-white/60 border border-emerald-200/60 p-3 rounded-2xl">
              <div className="text-sm text-slate-700">Buyurtma: {selectedOrder.orderNumber}</div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))} UZS
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To'lov usuli</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  paymentType === 'cash' 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                    : 'border-emerald-200/60 text-slate-700 bg-white/70'
                }`}
                onClick={() => setPaymentType('cash')}
              >
                Naqd
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  paymentType === 'card' 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                    : 'border-emerald-200/60 text-slate-700 bg-white/70'
                }`}
                onClick={() => setPaymentType('card')}
              >
                Karta
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Summa</label>
            <input
              type="number"
              className="w-full rounded-lg border-emerald-200/60 bg-white/70 border p-3 text-slate-900"
              placeholder="Summani kiriting"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
            >
              Bekor qilish
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handlePayment}
              disabled={!paymentAmount}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => { setShowReturnModal(false); setReturnOrderId(null); setReturnReason(''); }}
        title="Vozvrat kiritish"
        size="sm"
      >
        <div className="space-y-4">
          {pendingOrders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Buyurtma</label>
              <select
                className="w-full rounded-lg border-slate-300 border p-3"
                value={returnOrderId ?? ''}
                onChange={(e) => setReturnOrderId(e.target.value || null)}
              >
                <option value="">Tanlang</option>
                {pendingOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.clientName} ({formatCurrency(o.totalAmount)} UZS)
                  </option>
                ))}
              </select>
            </div>
          )}
          {pendingOrders.length === 0 && (
            <p className="text-slate-400 text-sm">Qaytarish uchun buyurtma yo&apos;q.</p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sabab</label>
            <select
              className="w-full rounded-lg border-slate-300 border p-3"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            >
              <option value="">Sababni tanlang</option>
              <option value="Muddati o'tgan">Muddati o'tgan</option>
              <option value="Buzilgan">Buzilgan</option>
              <option value="Noto'g'ri mahsulot">Noto'g'ri mahsulot</option>
              <option value="Mijoz rad etdi">Mijoz rad etdi</option>
              <option value="Boshqa">Boshqa</option>
            </select>
          </div>

          {returnReason === 'Boshqa' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Izoh</label>
              <textarea
                className="w-full rounded-lg border-slate-300 border p-3"
                rows={3}
                placeholder="Qo'shimcha izoh..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowReturnModal(false)}
            >
              Bekor qilish
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleReturn}
              disabled={!returnReason || !returnOrderId || pendingOrders.length === 0}
            >
              Vozvrat qilish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
