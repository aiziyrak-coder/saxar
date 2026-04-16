import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ShoppingCart, Search, Plus, Minus, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { productApi, categoryApi } from '../../services/api';
import { logger } from '../../services/logger';
import type { Product, Category } from '../../types';

export default function B2BCatalog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [clientApproved] = useState<boolean>(true); // Demo mode - always approved
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToCart, updateQuantity, items: cartItems } = useCart(user?.uid);

  // Load products and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsData, categoriesData] = await Promise.all([
          productApi.getB2BCatalog(),
          categoryApi.getAll(),
        ]);

        // Transform API data to match frontend types
        const transformedProducts: Product[] = productsData.map(p => ({
          id: String(p.id),
          name: p.name,
          description: p.description || '',
          categoryId: String(p.category),
          categoryName: p.category_name,
          brandId: p.brand ? String(p.brand) : undefined,
          brandName: p.brand_name,
          sku: p.sku,
          barcode: p.barcode,
          unit: p.unit as 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'box',
          weight: p.weight,
          images: [], // API doesn't have images yet
          basePrice: Number(p.base_price),
          b2bPrice: Number(p.b2b_price),
          costPrice: Number(p.cost_price),
          minStock: p.min_stock,
          maxStock: p.max_stock,
          isActive: p.is_active,
          isB2BActive: p.is_b2b_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));

        const transformedCategories: Category[] = categoriesData.map(c => ({
          id: String(c.id),
          name: c.name,
          description: c.description,
          image: c.image,
          parentId: c.parent ? String(c.parent) : undefined,
          sortOrder: c.sort_order,
          isActive: c.is_active,
          createdAt: c.created_at,
        }));

        setProducts(transformedProducts);
        setCategories(transformedCategories);
      } catch (err) {
        logger.error('Failed to load catalog data', err as Error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartItemQuantity = (productId: string) => {
    const item = cartItems.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const showPrices = clientApproved;

  return (
    <div className="space-y-6">
      {clientApproved === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
          <p className="text-amber-800">
            Arizangiz admin tasdiqini kutyapti. Tasdiqlangandan so&apos;ng mahsulot narxlari va buyurtma berish imkoniyati ochiladi.
          </p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mahsulotlar katalogi</h1>
          <p className="text-slate-500 mt-1">
            {showPrices ? 'B2B narxlar | Ombor qoldiqlari real vaqtda' : 'Tasdiqlangandan so\'ng narxlar ko\'rinadi'}
          </p>
        </div>
        {cartItems.length > 0 && (
          <Badge variant="default" size="lg">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Savatda: {cartItems.reduce((sum, i) => sum + i.quantity, 0)} ta
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 border focus:border-emerald-500 focus:ring-emerald-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 sm:py-12">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Mahsulot topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const cartQty = getCartItemQuantity(product.id);
            return (
              <Card key={product.id} className="overflow-hidden p-0 flex flex-col hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  {product.basePrice > product.b2bPrice && (
                    <Badge variant="success" className="absolute top-2 right-2">
                      Chegirma
                    </Badge>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Category */}
                  <div className="text-sm text-emerald-700 font-medium mb-1">
                    {categories.find(c => c.id === product.categoryId)?.name || product.categoryName}
                  </div>

                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>

                  {/* Price & Stock */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-2">
                      {showPrices ? (
                        <>
                          <span className="text-xl font-bold text-slate-900">
                            {formatPrice(product.b2bPrice)} UZS
                          </span>
                          {product.basePrice > product.b2bPrice && (
                            <span className="text-sm text-slate-400 line-through">
                              {formatPrice(product.basePrice)} UZS
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">— Tasdiqlash kutilmoqda</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mb-4">
                      Omborda: {product.unit}
                    </div>

                    {/* Add to Cart - only when approved */}
                    {showPrices && (
                      cartQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            onClick={() => updateQuantity(product.id, cartQty - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="flex-1 text-center font-medium">{cartQty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            onClick={() => updateQuantity(product.id, cartQty + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-full gap-2"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Savatga qo&apos;shish
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
