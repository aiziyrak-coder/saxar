import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Search, Plus, AlertTriangle, Barcode, ArrowRightLeft, Package, Calendar } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { inventoryService, generateBatchNumber } from '../../services/firestore';
import type { InventoryItem, Product } from '../../types';

export default function AdminWMS() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions' | 'expiry'>('inventory');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [_showTransferModal, setShowTransferModal] = useState(false);
  const [_selectedProduct, _setSelectedProduct] = useState<Product | null>(null);
  
  const { data: inventory, loading: inventoryLoading, refresh: refreshInventory } = useFirestore<InventoryItem>('inventory');
  const { data: products, loading: productsLoading } = useFirestore<Product>('products');

  // Calculate total stock per product
  const productStock = inventory.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        total: 0,
        items: [],
      };
    }
    acc[item.productId].total += item.quantity;
    acc[item.productId].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; items: InventoryItem[] }>);

  // Get expiring items (within 7 days)
  const expiringItems = inventory.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && item.status === 'available';
  });

  // Get expired items
  const expiredItems = inventory.filter(item => {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    return expiryDate < today && item.status === 'available';
  });

  const getStockStatus = (productId: string, minStock: number = 10) => {
    const stock = productStock[productId]?.total || 0;
    if (stock === 0) return { label: 'Qolmagan', variant: 'error' as const };
    if (stock < minStock) return { label: 'Kam qoldiq', variant: 'warning' as const };
    return { label: 'Yaxshi', variant: 'success' as const };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Muddati o\'tgan', color: 'text-red-600', bg: 'bg-red-50' };
    if (diffDays <= 7) return { label: `${diffDays} kun qoldi`, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Yaxshi', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const handleStockIn = async (data: {
    productId: string;
    quantity: number;
    expiryDate: string;
    manufactureDate: string;
    location: string;
    batchNumber?: string;
  }) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const batchNumber = data.batchNumber || generateBatchNumber(data.productId);
    
    await inventoryService.create({
      productId: data.productId,
      productName: product.name,
      sku: product.sku,
      batchNumber,
      quantity: data.quantity,
      unit: product.unit,
      expiryDate: data.expiryDate,
      manufactureDate: data.manufactureDate,
      location: data.location,
      status: 'available',
      createdAt: new Date().toISOString(),
    } as Omit<InventoryItem, 'id'>);

    setShowStockInModal(false);
    refreshInventory();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ombor boshqaruvi (WMS)</h1>
          <p className="text-slate-500 mt-1">FIFO usuli | Yaroqlilik muddati nazorati</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Barcode className="h-4 w-4" /> Skanerlash
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft className="h-4 w-4" /> O'tkazma
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => setShowStockInModal(true)}>
            <Plus className="h-4 w-4" /> Kirim qilish
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(expiringItems.length > 0 || expiredItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {expiredItems.length} ta mahsulotning muddati o'tgan!
                </p>
              </div>
            </div>
          )}
          {expiringItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {expiringItems.length} ta mahsulotning muddati yaqin (7 kun)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inventory', label: 'Ombor qoldiqlari', icon: Package },
            { id: 'transactions', label: 'Kirim-chiqim', icon: ArrowRightLeft },
            { id: 'expiry', label: 'Yaroqlilik muddati', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">SKU</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Mahsulot</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Jami qoldiq</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Partiyalar</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Mahsulot topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stock = productStock[product.id];
                    const status = getStockStatus(product.id, product.minStock);
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-500">{product.sku}</td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-500">{product.categoryName}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-slate-900">
                            {stock?.total || 0} {product.unit}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-600">
                            {stock?.items.length || 0} partiya
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Expiry Tab */}
      {activeTab === 'expiry' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">Yaroqlilik muddati bo'yicha</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Partiya #</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Mahsulot</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Miqdor</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Ishlab chiqarilgan</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Yaroqlilik muddati</th>
                  <th className="py-3 px-6 font-semibold text-slate-600 text-sm uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventoryLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Ma'lumot yo'q
                    </td>
                  </tr>
                ) : (
                  [...expiredItems, ...expiringItems, ...inventory.filter(i => !expiredItems.includes(i) && !expiringItems.includes(i))]
                    .map((item) => {
                      const expiryStatus = getExpiryStatus(item.expiryDate);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-slate-500">{item.batchNumber}</td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900">{item.productName}</div>
                            <div className="text-sm text-slate-500">{item.sku}</div>
                          </td>
                          <td className="py-4 px-6 text-sm">{item.quantity} {item.unit}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {new Date(item.manufactureDate).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-4 px-6 text-sm font-medium">
                            <span className={expiryStatus.color}>
                              {new Date(item.expiryDate).toLocaleDateString('uz-UZ')}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${expiryStatus.bg} ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock In Modal */}
      <StockInModal
        isOpen={showStockInModal}
        onClose={() => setShowStockInModal(false)}
        products={products}
        onSubmit={handleStockIn}
      />
    </div>
  );
}

// Stock In Modal Component
interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSubmit: (data: any) => void;
}

function StockInModal({ isOpen, onClose, products, onSubmit }: StockInModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    expiryDate: '',
    manufactureDate: '',
    location: 'A-01',
    batchNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Omborga kirim" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
          <select
            required
            className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 border focus:border-emerald-500 focus:ring-emerald-500"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          >
            <option value="">Tanlang</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor</label>
            <Input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Joylashuv</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Masalan: A-01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ishlab chiqarilgan sana</label>
            <Input
              type="date"
              required
              value={formData.manufactureDate}
              onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yaroqlilik muddati</label>
            <Input
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Partiya raqami (avtomatik yoki qo'lda)</label>
          <Input
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            placeholder="Avtomatik generatsiya qilish uchun bo'sh qoldiring"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit" variant="primary">
            Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  );
}
