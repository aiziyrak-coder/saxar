import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Truck,
  Shield,
  ShoppingCart,
  Minus,
  Plus,
  X,
  Trash2,
  Phone,
  Star,
  ChevronRight,
  ChevronDown,
  HeadphonesIcon,
  RefreshCw,
  Heart,
  Eye,
  Check,
  AlertCircle,
  ArrowUp,
  Search,
  Bell,
  User,
  Globe,
  MapPin,
  Gift,
  TrendingUp,
  Sparkles,
  Grid3X3,
  List,
  Flame,
  Timer,
  Users,
  LayoutDashboard,
  Building2,
  Award,
  Factory,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { productApi, categoryApi, orderApi } from '../services/api';
import { logger } from '../services/logger';
import type { Category, Product, Order } from '../types';
import { BRAND, erpHomePathForRole } from '../constants/branding';
import { orderService, generateOrderNumber } from '../services/firestore';

const LANDING_WISHLIST_KEY = 'saxar_landing_wishlist';
const LANDING_WISHLIST_LEGACY = 'wishlist';

// Banner data
const banners = [
  {
    id: 1,
    title: 'Saxar — sifatli go\'sht mahsulotlari',
    subtitle: 'Tabiiy va ekologik toza go\'sht-kolbasa mahsulotlari',
    bg: 'from-emerald-400 via-teal-400 to-emerald-300',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200',
    badge: 'SAXAR',
  },
  {
    id: 2,
    title: 'B2B hamkorlar uchun',
    subtitle: 'Ulgurji narxlar va tezkor yetkazib berish',
    bg: 'from-amber-300 via-yellow-300 to-amber-200',
    image: 'https://images.unsplash.com/photo-1614961909012-73b4ece2c51a?w=1200',
    badge: 'B2B',
  },
  {
    id: 3,
    title: 'Sifat kafolati',
    subtitle: 'ISO 22000 va HACCP sertifikatlari bilan',
    bg: 'from-blue-300 via-cyan-300 to-blue-200',
    image: 'https://images.unsplash.com/photo-1607058332818-32e5e4a60ffe?w=1200',
    badge: 'SIFAT',
  },
  {
    id: 4,
    title: 'Yangi so\'yilgan go\'sht',
    subtitle: 'Har kuni yangi va yangi so\'yilgan go\'sht',
    bg: 'from-violet-300 via-purple-300 to-violet-200',
    image: 'https://images.unsplash.com/photo-1588347818036-558601350947?w=1200',
    badge: 'YANGI',
  },
];

// Product categories
const brands = [
  { id: '1', name: 'Kolbasa', logo: '🌭', count: 45 },
  { id: '2', name: 'Sosiska', logo: '🔥', count: 32 },
  { id: '3', name: 'Mol go\'shti', logo: '🥩', count: 28 },
  { id: '4', name: 'Qo\'y go\'shti', logo: '🍖', count: 18 },
  { id: '5', name: 'Tovuq', logo: '🍗', count: 24 },
  { id: '6', name: 'Qiyma', logo: '🥟', count: 15 },
];

// Popular searches
const popularSearches = ['Kolbasa', 'Sosiska', 'Mol go\'shti', 'Qiyma', 'Tovuq', 'Qo\'y go\'shti'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const {
    items: cartItems,
    totalAmount,
    totalCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart(user?.uid);

  const [cartOpen, setCartOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [clientApproved, setClientApproved] = useState<boolean | null>(null);
  const [clientAddress, setClientAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [flashSaleTime, setFlashSaleTime] = useState({ hours: 5, minutes: 23, seconds: 45 });
  
  // Professional features state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const catalogRef = useRef<HTMLDivElement>(null);
  
  // New UI state
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [notifications] = useState([
    { id: '1', title: 'Buyurtmangiz yuborildi', time: '5 daqiqa oldin', read: false },
    { id: '2', title: 'Yangi chegirmalar!', time: '1 soat oldin', read: false },
    { id: '3', title: 'SAXAR10 kuponini ishlating', time: '2 soat oldin', read: true },
  ]);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setProductsLoading(true);
        setApiError(null);

        const [productsData, categoriesData] = await Promise.all([
          productApi.getAll({ is_b2b: 'true' }),
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
          images: [],
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
        logger.error('Failed to load landing page data', err as Error);
        setApiError('Ma\'lumotlarni yuklashda xatolik');
      } finally {
        setProductsLoading(false);
      }
    };

    loadData();
  }, []);

  const categoriesSorted = useMemo(() => {
    return [...categories]
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const isB2bUser = userData?.role === 'b2b';
  const canAddToCart = !isB2bUser || clientApproved === true;
  const canShowPrices = !isB2bUser || clientApproved === true;

  const erpDashboardHref = useMemo(() => erpHomePathForRole(userData?.role), [userData?.role]);

  // Banner auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Flash sale countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashSaleTime((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
      setShowBackToTop(winScroll > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Demo mode - client always approved
  useEffect(() => {
    setClientApproved(true);
    setClientAddress('Toshkent sh.');
  }, [user?.uid]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedCatalogSearch(catalogSearch.trim()), 300);
    return () => window.clearTimeout(id);
  }, [catalogSearch]);

  const filteredProducts = useMemo(() => {
    const q = debouncedCatalogSearch.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'all' || p.categoryId === selectedCategory;

      return matchesSearch && matchesCategory && p.isB2BActive && p.isActive;
    });
  }, [products, debouncedCatalogSearch, selectedCategory]);

  // Top products (eng ko'p sotilgan - random for demo)
  const topProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.isB2BActive && p.isActive)
      .slice(0, 8);
  }, [products]);

  // Discount products
  const discountProducts = useMemo(() => {
    return products
      .filter((p) => p.isB2BActive && p.isActive && p.basePrice > p.b2bPrice)
      .slice(0, 8);
  }, [products]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id)),
    [products, wishlist]
  );

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price);

  const getCartQty = (productId: string) => {
    return cartItems.find((i) => i.productId === productId)?.quantity || 0;
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Cookie consent
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setTimeout(() => setShowCookieConsent(true), 2000);
  }, []);

  // Load wishlist, recently viewed & search history
  useEffect(() => {
    try {
      let savedWishlist = localStorage.getItem(LANDING_WISHLIST_KEY);
      if (!savedWishlist) {
        const legacy = localStorage.getItem(LANDING_WISHLIST_LEGACY);
        if (legacy) {
          localStorage.setItem(LANDING_WISHLIST_KEY, legacy);
          localStorage.removeItem(LANDING_WISHLIST_LEGACY);
          savedWishlist = legacy;
        }
      }
      const savedRecent = localStorage.getItem('recentlyViewed');
      const savedSearchHistory = localStorage.getItem('searchHistory');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist) as string[]);
      if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent) as Product[]);
      if (savedSearchHistory) setSearchHistory(JSON.parse(savedSearchHistory) as string[]);
    } catch (e) {
      logger.warn('Landing localStorage parse failed', { error: String(e) });
    }
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Handle search
  const handleSearch = useCallback((term: string) => {
    if (term.trim()) {
      const updated = [term, ...searchHistory.filter(s => s !== term)].slice(0, 5);
      setSearchHistory(updated);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
    }
    setShowSearchDropdown(false);
  }, [searchHistory]);

  // Copy coupon code
  const copyCoupon = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Kupon nusxalandi!', 'success');
  }, [showToast]);

  // Toggle wishlist
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const updated = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem(LANDING_WISHLIST_KEY, JSON.stringify(updated));
        localStorage.removeItem(LANDING_WISHLIST_LEGACY);
      } catch {
        /* ignore quota */
      }
      return updated;
    });
  }, []);

  // Add to recently viewed
  const addToRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle add to cart with feedback
  const handleAddToCart = useCallback((product: Product, qty: number = 1) => {
    addToCart(product, qty);
    addToRecentlyViewed(product);
    showToast(`${product.name} savatga qo'shildi!`, 'success');
  }, [addToCart, addToRecentlyViewed, showToast]);

  // Testimonials data
  const testimonials = [
    { id: '1', author: 'Alisher Karimov', role: 'Direktor', company: 'SuperMarket Osiyo', content: "Saxar kompaniyasidan kolbasa va go'sht mahsulotlarini buyurtma qilish juda oson! Sifatli va yangi mahsulotlar yetkazib beriladi.", rating: 5 },
    { id: '2', author: 'Nilufar Rahimova', role: 'Buxgalter', company: 'Makro Trade', content: "Go'sht mahsulotlari sifati a'lo! Har doim yangi va toza mahsulotlar yetkazib beriladi.", rating: 5 },
    { id: '3', author: 'Bobur Toshmatov', role: 'Logistika menejeri', company: 'Toshkent Foods', content: "Yetkazib berishlar vaqtlida amalga oshiriladi. Go'sht mahsulotlari har doim sovuq saqlashda yetkaziladi.", rating: 5 },
  ];

  const handleCheckout = async () => {
    if (isSubmittingOrder) return;
    if (cartItems.length === 0) return;

    if (!userData) {
      setCartOpen(false);
      navigate('/login');
      return;
    }

    if (!user?.uid) {
      navigate('/login');
      return;
    }

    if (userData.role !== 'b2b') {
      alert("Faqat B2B mijozlar buyurtma bera oladi.");
      return;
    }

    if (clientApproved !== true) {
      alert('Buyurtma berish uchun arizangiz admin tasdiqini kutyapti.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Generate order number
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `ORD-${year}${month}${day}-${random}`;

      const orderData = {
        order_number: orderNumber,
        source: 'b2b',
        status: 'pending',
        client_id: user.uid,
        client_name: userData?.name || 'Noma\'lum',
        client_phone: userData?.phone || '',
        client_address: clientAddress || '',
        items: cartItems.map((item) => ({
          product_id: item.productId,
          product_name: item.productName,
          sku: item.sku,
          unit: item.unit,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice,
        })),
        total_amount: totalAmount,
        notes: orderNotes,
        order_date: new Date().toISOString().split('T')[0],
      };

      try {
        await orderApi.create(orderData);
      } catch (apiErr) {
        logger.warn('REST buyurtma ishlamadi, Firestore ga yozilmoqda', {
          detail: apiErr instanceof Error ? apiErr.message : String(apiErr),
        });
        const fsOrder: Omit<Order, 'id'> = {
          orderNumber: generateOrderNumber(),
          source: 'b2b',
          status: 'pending',
          clientId: user.uid,
          clientName: userData?.name || userData?.companyName || 'Noma\'lum',
          clientPhone: userData?.phone || '',
          clientAddress: clientAddress || '',
          items: cartItems.map((item) => ({
            id: `${item.productId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
          createdByName: userData?.name || 'B2B Mijoz',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await orderService.create(fsOrder);
      }

      clearCart();
      setCartOpen(false);
      setOrderNotes('');
      navigate('/b2b/orders');
    } catch (error) {
      logger.error('Buyurtma yaratishda xatolik', error instanceof Error ? error : undefined);
      alert('Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const calculateDiscount = (basePrice: number, b2bPrice: number) => {
    if (basePrice <= b2bPrice) return 0;
    return Math.round(((basePrice - b2bPrice) / basePrice) * 100);
  };

  // Product Card Component
  const ProductCard = ({ product, showBadge = true }: { product: Product; showBadge?: boolean }) => {
    const cartQty = getCartQty(product.id);
    const discount = calculateDiscount(product.basePrice, product.b2bPrice);
    const showOrderControls = canShowPrices;
    const isWishlisted = wishlist.includes(product.id);

    return (
      <div className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-200" />
            </div>
          )}

          {/* Badges */}
          {showBadge && discount > 0 && (
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discount}%
            </div>
          )}

          {/* Quick actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-colors ${
                isWishlisted ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-500'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setQuickViewProduct(product)}
              className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="text-[10px] text-emerald-600 font-medium mb-0.5">
            {categoriesSorted.find((c) => c.id === product.categoryId)?.name || product.categoryName || ''}
          </div>
          <h3 className="font-medium text-slate-800 text-xs line-clamp-2 mb-1.5 min-h-[32px]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mb-2">
            {showOrderControls ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-slate-800">
                  {formatPrice(product.b2bPrice)} so'm
                </span>
                {discount > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-xs">Tasdiqlash kutilmoqda</span>
            )}
          </div>

          {/* Add to cart */}
          {showOrderControls ? (
            cartQty > 0 ? (
              <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(product.id, cartQty - 1)}
                  className="w-6 h-6 rounded bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <Minus className="h-3 w-3 text-emerald-600" />
                </button>
                <span className="font-medium text-emerald-600 text-sm">{cartQty}</span>
                <button
                  onClick={() => updateQuantity(product.id, cartQty + 1)}
                  className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                  disabled={!canAddToCart}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product)}
                disabled={!canAddToCart}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Savatga
              </button>
            )
          ) : (
            <button disabled className="w-full py-2 bg-slate-100 text-slate-400 font-medium rounded-lg cursor-not-allowed text-xs">
              Tasdiqlash kutilmoqda
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Saxar — saxar.uz: ERP kirish va brend */}
      <div className="sticky top-0 z-[100] shadow-md shadow-emerald-950/10">
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white border-b border-emerald-800/40">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div
                className="shrink-0 h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 flex items-center justify-center text-slate-900 font-black text-lg shadow-lg ring-2 ring-white/20"
                aria-hidden
              >
                S
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-emerald-300/95 font-semibold">
                  {BRAND.siteHost} · rasmiy sayt
                </p>
                <p className="text-sm sm:text-base font-bold text-white leading-snug truncate">
                  {BRAND.name}{' '}
                  <span className="text-emerald-200/90 font-medium">— {BRAND.tagline}</span>
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 hidden md:block max-w-xl">
                  {BRAND.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="hidden lg:inline text-xs text-slate-400 max-w-[220px] leading-snug">
                Hamkorlar va xodimlar: buyurtma, ombor, moliya, logistika — bitta Saxar ERP.
              </span>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                B2B ro&apos;yxatdan o&apos;tish
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-lg shadow-orange-500/25 hover:from-amber-300 hover:to-orange-400 transition-all"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                ERP ga kirish
              </Link>
            </div>
          </div>
        </div>
        <div className="h-0.5 bg-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white text-slate-600 text-xs py-2 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={BRAND.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline font-semibold text-emerald-700 hover:text-emerald-600"
            >
              {BRAND.siteHost}
            </a>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-emerald-500" />
              <a href="tel:+998907863888" className="hover:text-emerald-500 transition-colors font-medium">+998907863888</a>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-emerald-500" />
              <span>Toshkent</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <Truck className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-600 font-medium text-xs">Bepul yetkazib berish</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <button className="flex items-center gap-1 hover:text-emerald-500 transition-colors text-xs">
              <Globe className="h-3 w-3" />
              <span>O'Z</span>
            </button>
            {user ? (
              <Link to={erpDashboardHref} className="hover:text-emerald-500 transition-colors text-xs font-medium">
                ERP kabineti
              </Link>
            ) : (
              <>
                <Link to="/login" className="hover:text-emerald-500 transition-colors text-xs">
                  Kirish
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-md transition-colors text-xs font-medium"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-slate-800">{BRAND.name}</span>
                <span className="block text-[10px] text-emerald-600 font-medium -mt-0.5">{BRAND.tagline}</span>
              </div>
            </Link>

            {/* Categories Button */}
            <button 
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
            >
              <Grid3X3 className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-700 font-medium">Kategoriyalar</span>
              <ChevronDown className={`h-3.5 w-3.5 text-emerald-500 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl hidden md:block relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(catalogSearch)}
                  className="w-full py-2 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-sm text-slate-700 placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSearch(catalogSearch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-md flex items-center justify-center transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-white" />
                </button>
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                  {searchHistory.length > 0 && (
                    <div className="p-2 border-b border-slate-50">
                      <div className="text-[10px] text-slate-400 mb-1.5">So'nggi qidiruvlar</div>
                      <div className="flex flex-wrap gap-1.5">
                        {searchHistory.map((term, i) => (
                          <button key={i} onClick={() => { setCatalogSearch(term); handleSearch(term); }} className="px-2 py-0.5 bg-slate-50 rounded-full text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-2">
                    <div className="text-[10px] text-slate-400 mb-1.5">Mashhur</div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((term, i) => (
                        <button key={i} onClick={() => { setCatalogSearch(term); handleSearch(term); }} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs hover:bg-emerald-100 transition-colors">
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-emerald-50 transition-colors"
                  >
                    <Bell className="h-4 w-4 text-slate-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      2
                    </span>
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-emerald-100 border border-emerald-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-emerald-50 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">Bildirishnomalar</span>
                        <button className="text-sm text-emerald-600 hover:text-emerald-700">Barchasini o'qish</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-3 border-b border-emerald-50 hover:bg-emerald-50/50 cursor-pointer ${!n.read ? 'bg-emerald-50/30' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <div className="flex-1">
                                <p className="text-sm text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-400">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist (alohida sahifa yo'q — panel ochiladi) */}
              <button
                type="button"
                onClick={() => setWishlistOpen(true)}
                className="relative w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-emerald-50 transition-colors"
                aria-label="Sevimlilar"
              >
                <Heart className="h-4 w-4 text-slate-500" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-1.5 rounded-lg transition-all text-sm"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline font-medium text-sm">Savat</span>
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors"
                  >
                    <span className="text-emerald-600 font-bold text-sm">
                      {userData?.name?.charAt(0) || 'U'}
                    </span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                      <div className="p-2.5 border-b border-slate-50">
                        <p className="font-semibold text-slate-800 text-sm">{userData?.name || 'Foydalanuvchi'}</p>
                        <p className="text-xs text-slate-400">{userData?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to={erpDashboardHref} className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-50 text-slate-700 text-sm">
                          <LayoutDashboard className="h-3.5 w-3.5 text-emerald-500" /> Saxar ERP
                        </Link>
                        {userData?.role === 'b2b' && (
                          <Link to="/b2b/orders" className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-50 text-slate-700 text-sm">
                            <Package className="h-3.5 w-3.5 text-emerald-500" /> Buyurtmalar
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setWishlistOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-emerald-50 text-slate-700 text-sm text-left"
                        >
                          <Heart className="h-3.5 w-3.5 text-emerald-500" /> Sevimlilar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-emerald-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-500" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-2 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Qidirish..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm text-slate-700"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center">
                <Search className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        {showMegaMenu && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categoriesSorted.map((cat) => (
                  <Link
                    key={cat.id}
                    to="#catalog"
                    onClick={() => { setSelectedCategory(cat.id); setShowMegaMenu(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors">
                      <Package className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Saxar kompaniyasi — vizual ma'lumot bloklari */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/90 via-white to-slate-50 border-b border-emerald-100/80">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {BRAND.name} kompaniyasi
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Tabiiylik, zanjir va{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ishonch</span>
            </h1>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              {BRAND.description} B2B hamkorlar uchun ulgurji narxlar, sovuq saqlash bilan yetkazib berish va yagona{' '}
              <span className="font-semibold text-emerald-700">{BRAND.erpProductName}</span> orqali jarayonlarni nazorat qiling.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-colors"
              >
                Katalogni ko&apos;rish
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                {BRAND.erpProductName} ga o&apos;tish
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Factory className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zamonaviy ishlab chiqarish</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                HACCP va ISO 22000 talablari asosida partiyalar bo&apos;yicha nazorat, xavfsizlik va izchil sifat.
              </p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Sovuq zanjir</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                -18°C gacha saqlash va transport: mahsulot sizga qadar xavfsiz haroratda yetadi.
              </p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">B2B hamkorlik</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                STIR va shartnoma asosida ulgurji narxlar, qarz limiti va akkaunt bo&apos;yicha shaffof hisob-kitob.
              </p>
            </div>
            <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-5 text-white shadow-xl">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Award className="h-5 w-5 text-amber-300" />
              </div>
              <h3 className="text-base font-bold">{BRAND.erpProductName}</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Admin, ombor, buxgalter, agent, haydovchi — rollar bo&apos;yicha kirish. Ro&apos;yxatdan o&apos;tish va kirish.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-2.5 text-sm font-bold text-slate-900 hover:from-amber-300 hover:to-orange-400"
              >
                Kirish / ro&apos;yxatdan o&apos;tish
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner Slider */}
      <section className="relative bg-white overflow-hidden">
        <div className="relative h-[280px] sm:h-[360px] lg:h-[420px]">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg}`} />
              <div className="absolute inset-0 bg-black/30" />
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
                      <Sparkles className="h-3 w-3" />
                      {banner.badge}
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                      {banner.title}
                    </h2>
                    <p className="text-base sm:text-lg text-white/90 mb-5">
                      {banner.subtitle}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={scrollToCatalog}
                        className="bg-white text-slate-800 font-medium px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-all shadow-md flex items-center gap-1.5 group text-sm"
                      >
                        Xarid qilish
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <Link
                        to="/register"
                        className="bg-white/20 backdrop-blur-sm text-white font-medium px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all border border-white/30 text-sm"
                      >
                        B2B bo'lish
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Banner Progress */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${((currentBanner + 1) / banners.length) * 100}%` }}
            />
          </div>

          {/* Banner Navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentBanner ? 'w-10 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <button
            onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Floating Cards */}
          <div className="hidden lg:block absolute bottom-12 right-12">
            <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg max-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">500+ Do'konlar</p>
                  <p className="text-[10px] text-slate-500">Bizning hamkorlarimiz</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features Bar */}
      <section className="bg-white border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 text-sm">Tezkor yetkazish</h3>
                <p className="text-xs text-slate-500">24 soat ichida</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 text-sm">Sifat kafolati</h3>
                <p className="text-xs text-slate-500">100% tabiiy</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 text-sm">Sovuq saqlash</h3>
                <p className="text-xs text-slate-500">-18°C gacha</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <HeadphonesIcon className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800 text-sm">24/7 Qo'llab-quvvatlash</h3>
                <p className="text-xs text-slate-500">Har doim yordam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal */}
      <section className="py-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
              Barchasi
            </button>
            {categoriesSorted.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Package className="h-5 w-5" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      {discountProducts.length > 0 && (
        <section className="py-8 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Flame className="h-7 w-7 text-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Flash Chegirmalar</h2>
                    <p className="text-white/80 text-sm">Chegirmalar tugashiga qoldi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                  <Timer className="h-5 w-5 text-white" />
                  <div className="flex items-center gap-1 font-mono font-bold text-xl text-white">
                    <span className="bg-white/20 px-2 py-1 rounded">{String(flashSaleTime.hours).padStart(2, '0')}</span>
                    <span className="animate-pulse">:</span>
                    <span className="bg-white/20 px-2 py-1 rounded">{String(flashSaleTime.minutes).padStart(2, '0')}</span>
                    <span className="animate-pulse">:</span>
                    <span className="bg-white/20 px-2 py-1 rounded">{String(flashSaleTime.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
              <button className="text-white font-medium flex items-center gap-1 hover:underline bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
                Barchasini ko'rish <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {discountProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Coupon Banner */}
      <section className="py-4 bg-gradient-to-r from-emerald-500 to-teal-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-white" />
              <div>
                <h3 className="text-base font-bold text-white">Birinchi buyurtmangizga 15% chegirma!</h3>
                <p className="text-white/80 text-xs">NEWUSER kupon kodidan foydalaning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg border border-dashed border-white/50">
                <span className="text-white font-mono font-bold text-sm">NEWUSER</span>
              </div>
              <button 
                onClick={() => copyCoupon('NEWUSER')}
                className="bg-white text-emerald-600 font-medium px-4 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Nusxalash
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Mashhur mahsulotlar</h2>
                <p className="text-slate-500 text-xs">Eng ko'p sotilgan mahsulotlar</p>
              </div>
            </div>
            <button className="text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors text-sm">
              Barchasi <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
            {topProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Mashhur brendlar</h2>
            <p className="text-slate-500 text-xs">Ishonchli ishlab chiqaruvchilar</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all hover:shadow-md"
              >
                <div className="text-2xl mb-1">{brand.logo}</div>
                <div className="font-medium text-slate-800 text-sm">{brand.name}</div>
                <div className="text-xs text-slate-400">{brand.count} ta</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Full Catalog */}
      <section id="catalog" ref={catalogRef} className="py-8 scroll-mt-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Barcha mahsulotlar</h2>
              <p className="text-slate-500 text-xs">{filteredProducts.length} ta mahsulot</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode */}
              <div className="hidden md:flex items-center gap-0.5 bg-white rounded-lg p-0.5 border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="popular">Mashhurlik bo'yicha</option>
                <option value="newest">Eng yangi</option>
                <option value="price-asc">Narx: Arzon → Qimmat</option>
                <option value="price-desc">Narx: Qimmat → Arzon</option>
              </select>
            </div>
          </div>

          {apiError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{apiError} — lekin sayt demo rejimida ishlashda davom etadi.</span>
            </div>
          )}

          {isB2bUser && clientApproved === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 shrink-0">
                !
              </div>
              <div>
                <p className="font-semibold text-amber-900">Arizangiz admin tasdiqini kutyapti</p>
                <p className="text-amber-800 mt-1 text-sm">
                  Tasdiqlangandan so'ng mahsulot narxlari va buyurtma berish imkoniyati ochiladi.
                </p>
              </div>
            </div>
          )}

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Mahsulot topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="py-10 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">So'nggi ko'rilgan</h2>
                  <p className="text-sm text-slate-500">Siz ko'rgan mahsulotlar</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {recentlyViewed.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mijozlarimiz fikrlari</h2>
            <p className="text-slate-600">Bizga ishonch bildirgan hamkorlar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 italic">"{review.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{review.author}</p>
                    <p className="text-sm text-slate-500">{review.role}, {review.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {BRAND.name} — sifatli go&apos;sht mahsulotlari ishlab chiqaruvchi
              </h2>
              <p className="text-slate-600 mb-6">
                {BRAND.name} O&apos;zbekistonda tabiiy xom asyo va zamonaviy texnologiyalar yordamida go&apos;sht-kolbasa
                mahsulotlarini ishlab chiqaradi. Har kuni yangi so&apos;yilgan go&apos;sht va sovuq zanjir bilan
                hamkorlarga yetkazib beramiz. Korxona jarayonlari uchun {BRAND.erpProductName} tizimidan foydalaning.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-600">500+</div>
                  <div className="text-sm text-slate-500">Hamkor do'konlar</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-600">100+</div>
                  <div className="text-sm text-slate-500">Mahsulot turlari</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-600">24/7</div>
                  <div className="text-sm text-slate-500">Yetkazib berish</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-600">ISO</div>
                  <div className="text-sm text-slate-500">Sertifikatlangan</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">B2B hamkor bo'ling</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Maxsus ulgurji narxlar
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tezkor yetkazib berish
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sovuq saqlash bilan yetkazib berish
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sifat kafolati
                </li>
              </ul>
              <Link
                to="/register"
                className="inline-block bg-white text-red-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Ro'yxatdan o'tish
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-800">Savatcha</h3>
                {totalCount > 0 && (
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {totalCount} ta
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isB2bUser && clientApproved === false && (
              <div className="bg-amber-50 border-b border-amber-100 p-3">
                <p className="font-medium text-amber-700 text-xs">
                  Buyurtma berish uchun tasdiq kerak
                </p>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-slate-800 font-medium mb-1 text-sm">Savatchingiz bo'sh</p>
                <p className="text-slate-400 text-xs mb-4">Mahsulotlarni katalogdan tanlang</p>
                <Button
                  variant="primary"
                  className="gap-1.5 text-sm"
                  onClick={() => {
                    setCartOpen(false);
                    scrollToCatalog();
                  }}
                >
                  Katalogga o'tish
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="p-3 space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-2 p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded bg-white border border-slate-100 overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-slate-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-xs line-clamp-1">{item.productName}</h4>
                        <p className="text-[10px] text-slate-400">{formatPrice(item.unitPrice)} so'm</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-emerald-500 hover:text-emerald-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Qo'shimcha izoh
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      disabled={isSubmittingOrder}
                      rows={2}
                      placeholder="Buyurtma bo'yicha izoh..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-600 text-sm">Jami:</span>
                    <span className="text-lg font-bold text-slate-800">{formatPrice(totalAmount)} so'm</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isSubmittingOrder}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {isSubmittingOrder ? 'Yuborilmoqda...' : 'Buyurtma berish'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full py-2 mt-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                  >
                    Xaridni davom ettirish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sevimlilar paneli */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-[72]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setWishlistOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-800">Sevimlilar</h3>
                {wishlist.length > 0 && (
                  <span className="bg-rose-50 text-rose-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {wishlist.length} ta
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {wishlistProducts.length === 0 ? (
              <div className="p-6 text-center">
                <Heart className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-800 font-medium text-sm mb-1">Sevimlilar bo&apos;sh</p>
                <p className="text-slate-500 text-xs mb-4">Mahsulot kartochkasidagi yurakcha orqali qo&apos;shing.</p>
                <Button
                  variant="primary"
                  className="text-sm"
                  onClick={() => {
                    setWishlistOpen(false);
                    scrollToCatalog();
                  }}
                >
                  Katalogga
                </Button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {wishlistProducts.map((p) => (
                  <div key={p.id} className="flex gap-2 p-2 bg-slate-50 rounded-lg items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm line-clamp-2">{p.name}</p>
                      <p className="text-xs text-slate-500">{formatPrice(p.b2bPrice)} so&apos;m</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className="text-rose-500 text-xs font-medium shrink-0 px-2"
                    >
                      Olib tashlash
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Logo */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-800">{BRAND.name}</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                {BRAND.tagline}. {BRAND.siteHost} — rasmiy vitrina va B2B; {BRAND.erpProductName} — ichki boshqaruv.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">Mahsulotlar</h4>
              <ul className="space-y-1.5 text-slate-500 text-xs">
                <li><a href="#catalog" className="hover:text-emerald-500 transition-colors">Kolbasa</a></li>
                <li><a href="#catalog" className="hover:text-emerald-500 transition-colors">Sosiska</a></li>
                <li><a href="#catalog" className="hover:text-emerald-500 transition-colors">Mol go&apos;shti</a></li>
                <li><a href="#catalog" className="hover:text-emerald-500 transition-colors">Qo&apos;y go&apos;shti</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">Bog'lanish</h4>
              <ul className="space-y-1.5 text-slate-500 text-xs">
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-emerald-500" />
                  <a href="tel:+998907863888" className="hover:text-emerald-500 transition-colors">+998907863888</a>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-emerald-500" />
                  <span>Toshkent</span>
                </li>
              </ul>
            </div>

            {/* Working Hours */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 text-sm">Ish vaqti</h4>
              <ul className="space-y-1.5 text-slate-500 text-xs">
                <li>Dushanba - Juma: 08:00 - 18:00</li>
                <li>Shanba: 08:00 - 14:00</li>
                <li>Yakshanba: Dam olish kuni</li>
              </ul>
            </div>
          </div>

        </div>
      </footer>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setQuickViewProduct(null)} />
          <div className="relative bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl">
            <button onClick={() => setQuickViewProduct(null)} className="absolute top-3 right-3 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 z-10">
              <X className="h-4 w-4" />
            </button>
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <div className="relative aspect-square bg-slate-50 rounded-lg overflow-hidden">
                {quickViewProduct.images?.[0] ? (
                  <img src={quickViewProduct.images[0]} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-slate-200" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-emerald-500 font-medium mb-1">{quickViewProduct.categoryName || 'Mahsulot'}</span>
                <h2 className="text-lg font-bold text-slate-800 mb-1">{quickViewProduct.name}</h2>
                <p className="text-slate-500 mb-3 text-xs leading-relaxed">{quickViewProduct.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-slate-800">{quickViewProduct.b2bPrice.toLocaleString()} so'm</span>
                  {quickViewProduct.basePrice > quickViewProduct.b2bPrice && (
                    <span className="text-sm text-slate-400 line-through">{quickViewProduct.basePrice.toLocaleString()} so'm</span>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => { handleAddToCart(quickViewProduct); setQuickViewProduct(null); }}
                    disabled={!canAddToCart}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    <ShoppingCart className="h-4 w-4" /> Savatga
                  </button>
                  <button 
                    onClick={() => toggleWishlist(quickViewProduct.id)}
                    className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors ${
                      wishlist.includes(quickViewProduct.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'border-slate-200 hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${wishlist.includes(quickViewProduct.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-50 w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
          aria-label="Yuqoriga"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
          toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Cookie Consent */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] bg-slate-900 text-white p-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium">Cookie fayllaridan foydalanamiz</p>
                <p className="text-sm text-slate-400">Saytning to'liq ishlashi uchun cookie fayllari kerak.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { localStorage.setItem('cookieConsent', 'true'); setShowCookieConsent(false); }}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
              >
                Qabul qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
