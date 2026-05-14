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
  Instagram,
  Send,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { productApi, categoryApi, orderApi } from '../services/api';
import { logger } from '../services/logger';
import type { Category, Product, Order } from '../types';
import { BRAND, CONTACT, erpHomePathForRole } from '../constants/branding';
import { orderService, generateOrderNumber } from '../services/firestore';
import { fetchLandingPublicCopy } from '../services/landingSettings';
import {
  applyLandingErpPlaceholders,
  getDefaultLandingPublicCopy,
  type LandingPublicCopy,
} from '../types/landingPublic';

const LANDING_WISHLIST_KEY = 'saxar_landing_wishlist';
const LANDING_WISHLIST_LEGACY = 'wishlist';

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
  const [landing, setLanding] = useState<LandingPublicCopy>(() => getDefaultLandingPublicCopy());
  const [flashSaleTime, setFlashSaleTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
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
  const [notifications] = useState<Array<{ id: string; title: string; time: string; read: boolean }>>([]);

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

  useEffect(() => {
    let ok = true;
    fetchLandingPublicCopy().then((d) => {
      if (ok) setLanding(d);
    });
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    const onUpdated = () => {
      fetchLandingPublicCopy().then(setLanding);
    };
    window.addEventListener('saxar:landing-updated', onUpdated);
    return () => window.removeEventListener('saxar:landing-updated', onUpdated);
  }, []);

  const categoriesSorted = useMemo(() => {
    return [...categories]
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const categoryTiles = useMemo(
    () =>
      categoriesSorted.slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        logo: '📦',
        count: products.filter((p) => p.categoryId === c.id && p.isActive).length,
      })),
    [categoriesSorted, products]
  );

  const suggestTerms = useMemo(() => categoriesSorted.slice(0, 8).map((c) => c.name), [categoriesSorted]);

  const isB2bUser = userData?.role === 'b2b';
  const canAddToCart = !isB2bUser || clientApproved === true;
  const canShowPrices = !isB2bUser || clientApproved === true;

  const erpDashboardHref = useMemo(() => erpHomePathForRole(userData?.role), [userData?.role]);

  useEffect(() => {
    const n = landing.banners.length;
    if (n === 0) return;
    setCurrentBanner((c) => c % n);
  }, [landing.banners]);

  // Banner auto-slide
  useEffect(() => {
    const n = landing.banners.length;
    if (n === 0) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % n);
    }, 5000);
    return () => clearInterval(interval);
  }, [landing.banners.length]);

  // Flash sale — kun oxirigacha qolgan vaqt
  useEffect(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - Date.now());
      setFlashSaleTime({
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
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

  // B2B mijoz: tasdiq va manzil — profildan
  useEffect(() => {
    if (userData?.role !== 'b2b') {
      setClientApproved(null);
      setClientAddress('');
      return;
    }
    setClientApproved(userData.status === 'active');
    setClientAddress((userData.address || '').trim());
  }, [userData?.role, userData?.status, userData?.address]);

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

  // Top products — katalogdan birinchi faol mahsulotlar
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
        const fid = await orderService.create(fsOrder);
        if (!fid) {
          alert('Buyurtma Firestore ga yozilmadi. Firebase sozlanganini tekshiring.');
          return;
        }
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
      <div className="group bg-white rounded-2xl border border-zinc-200/80 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-[4/5] bg-zinc-100 overflow-hidden sm:aspect-square">
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
              className={`w-7 h-7 rounded-full border border-zinc-200/80 bg-white flex items-center justify-center transition-colors ${
                isWishlisted ? 'bg-emerald-600 border-emerald-600 text-white' : 'hover:bg-zinc-50 text-zinc-400 hover:text-emerald-600'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setQuickViewProduct(product)}
              className="w-7 h-7 bg-white rounded-full border border-zinc-200/80 flex items-center justify-center hover:bg-zinc-50 text-zinc-400 hover:text-emerald-600 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-emerald-600/90">
            {categoriesSorted.find((c) => c.id === product.categoryId)?.name || product.categoryName || ''}
          </div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mb-3 mt-2">
            {showOrderControls ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-semibold text-zinc-900">
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
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col antialiased">
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-200/90 shadow-[0_8px_30px_-14px_rgba(15,23,42,0.1)] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-2 py-2.5 text-[11px] sm:text-xs text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a
                href={BRAND.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline font-semibold text-emerald-700 hover:text-emerald-600"
              >
                {BRAND.siteHost}
              </a>
              {CONTACT.phones.map((p) => (
                <a
                  key={p.tel}
                  href={`tel:${p.tel}`}
                  className="inline-flex items-center gap-1 text-zinc-700 hover:text-emerald-700 font-medium"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  {p.display}
                </a>
              ))}
              <span className="hidden md:inline-flex items-start gap-1.5 text-zinc-500 max-w-md" title={CONTACT.addressLine}>
                <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-snug">{CONTACT.addressLine}</span>
              </span>
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
                <Truck className="h-3.5 w-3.5 text-emerald-700" />
                Bepul yetkazib berish
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors">
                <Globe className="h-3.5 w-3.5" />
                O&apos;Z
              </button>
              {user ? (
                <Link to={erpDashboardHref} className="font-medium hover:text-zinc-900 transition-colors">
                  ERP kabineti
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-zinc-900 transition-colors">
                    Kirish
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    Ro&apos;yxatdan o&apos;tish
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-[3px] bg-zinc-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <header className="border-t border-zinc-100/90 bg-white/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-semibold text-zinc-900">{BRAND.name}</span>
                <span className="block text-[10px] text-emerald-600 font-medium -mt-0.5">{BRAND.tagline}</span>
              </div>
            </Link>

            {/* Categories Button */}
            <button 
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <Grid3X3 className="h-4 w-4 text-zinc-600" />
              <span>Kategoriyalar</span>
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl hidden md:block relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Mahsulot qidirish..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(catalogSearch)}
                  className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={() => handleSearch(catalogSearch)}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
                >
                  <Search className="h-3.5 w-3.5 text-white" />
                </button>
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-md border border-zinc-100 overflow-hidden z-50">
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
                      {suggestTerms.length === 0 && (
                        <span className="text-xs text-slate-400">Kategoriyalar yuklangach takliflar paydo bo‘ladi</span>
                      )}
                      {suggestTerms.map((term, i) => (
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
                    {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-md border border-zinc-100 overflow-hidden z-50">
                      <div className="p-3 border-b border-emerald-50 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">Bildirishnomalar</span>
                        <button className="text-sm text-emerald-600 hover:text-emerald-700">Barchasini o'qish</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 && (
                          <p className="p-4 text-sm text-slate-500">Hozircha bildirishnomalar yo‘q.</p>
                        )}
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
                className="relative flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm shadow-sm"
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
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-md border border-zinc-100 overflow-hidden z-50">
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
          <div className="absolute top-full left-0 right-0 z-40 rounded-b-2xl border-x border-b border-zinc-100 bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categoriesSorted.map((cat) => (
                  <Link
                    key={cat.id}
                    to="#catalog"
                    onClick={() => { setSelectedCategory(cat.id); setShowMegaMenu(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
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
      </div>

      {/* Saxar kompaniyasi — vizual ma'lumot bloklari */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-gradient-to-b from-white via-zinc-50/40 to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-400/[0.07] blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              {landing.hero.eyebrow}
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold text-zinc-900 tracking-tight leading-[1.15]">
              {landing.hero.headline}
              <span className="text-emerald-600">{landing.hero.headlineAccent}</span>
            </h1>
            <p className="mt-5 text-zinc-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {applyLandingErpPlaceholders(landing.hero.lead)}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                {landing.hero.ctaCatalog}
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                {applyLandingErpPlaceholders(landing.hero.ctaErp)}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {landing.featureCards.slice(0, 4).map((card, idx) => {
              const icons = [Factory, Truck, Building2, Award] as const;
              const Icon = icons[idx] ?? Factory;
              const isErp = idx === 3;
              if (isErp) {
                return (
                  <div
                    key={`fc-${idx}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-white shadow-sm"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-5 w-5 text-amber-300" />
                    </div>
                    <h3 className="text-base font-semibold">{applyLandingErpPlaceholders(card.title)}</h3>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{applyLandingErpPlaceholders(card.body)}</p>
                    <Link
                      to="/login"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                      {applyLandingErpPlaceholders(landing.erpCardCta)}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              }
              const ringClass =
                idx === 0
                  ? 'hover:border-zinc-300 hover:shadow-md'
                  : 'shadow-sm';
              const iconWrap =
                idx === 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : idx === 1
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-amber-50 text-amber-800';
              return (
                <div
                  key={`fc-${idx}`}
                  className={`rounded-2xl border border-zinc-200/80 bg-white p-6 transition-colors ${ringClass}`}
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900">{applyLandingErpPlaceholders(card.title)}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{applyLandingErpPlaceholders(card.body)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hero Banner Slider */}
      <section className="relative bg-zinc-50 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-zinc-200/80 shadow-md sm:rounded-3xl">
            <div className="relative h-[260px] sm:h-[340px] lg:h-[400px]">
          {landing.banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg}`} />
              <div className="absolute inset-0 bg-slate-900/20" />
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover opacity-40"
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
              style={{ width: `${((currentBanner + 1) / landing.banners.length) * 100}%` }}
            />
          </div>

          {/* Banner Navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {landing.banners.map((_, index) => (
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
            onClick={() => setCurrentBanner((prev) => (prev - 1 + landing.banners.length) % landing.banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentBanner((prev) => (prev + 1) % landing.banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Floating Cards */}
          <div className="hidden lg:block absolute bottom-12 right-12">
            <div className="bg-white/95 rounded-lg p-3 shadow-md border border-white/50 max-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{landing.statCard.title}</p>
                  <p className="text-[10px] text-slate-500">{landing.statCard.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features Bar */}
      <section className="border-b border-zinc-100 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {landing.quickPoints.slice(0, 4).map((qp, i) => {
              const icons = [Truck, Shield, RefreshCw, HeadphonesIcon] as const;
              const Icon = icons[i] ?? Truck;
              const wrap =
                i === 0 || i === 1
                  ? 'bg-emerald-50'
                  : i === 2
                    ? 'bg-blue-50'
                    : 'bg-amber-50';
              const iconColor =
                i === 0 || i === 1 ? 'text-emerald-600' : i === 2 ? 'text-blue-500' : 'text-amber-500';
              return (
                <div
                  key={`qp-${i}`}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
                >
                  <div className={`w-9 h-9 ${wrap} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">{qp.title}</h3>
                    <p className="text-xs text-zinc-500">{qp.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Horizontal */}
      <section className="py-4 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
              Barchasi
            </button>
            {categoriesSorted.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200'
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
        <section className="py-8 bg-zinc-50 border-y border-zinc-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">Flash chegirmalar</h2>
                    <p className="text-zinc-600 text-sm">Chegirma tugashiga qoldi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 rounded-lg border border-orange-200/80 bg-white/80 px-3 py-2">
                    <Timer className="h-4 w-4 text-orange-600" />
                    <div className="flex items-center gap-1 font-mono font-semibold text-lg text-zinc-800">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded">{String(flashSaleTime.hours).padStart(2, '0')}</span>
                      <span>:</span>
                      <span className="bg-zinc-100 px-2 py-0.5 rounded">{String(flashSaleTime.minutes).padStart(2, '0')}</span>
                      <span>:</span>
                      <span className="bg-zinc-100 px-2 py-0.5 rounded">{String(flashSaleTime.seconds).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-orange-700 hover:text-orange-800 flex items-center gap-1"
                  >
                    Barchasini ko&apos;rish <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {discountProducts.slice(0, 5).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coupon Banner */}
      <section className="py-4 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Gift className="h-7 w-7 text-white/90" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white">Birinchi buyurtmangizga 15% chegirma</h3>
                <p className="text-white/80 text-xs">NEWUSER kupon kodidan foydalaning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/15 px-3 py-1.5 rounded-md border border-dashed border-white/40">
                <span className="text-white font-mono font-semibold text-sm">NEWUSER</span>
              </div>
              <button 
                onClick={() => copyCoupon('NEWUSER')}
                className="bg-white text-emerald-700 font-medium px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors text-sm shadow-sm"
              >
                Nusxalash
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products */}
      <section className="border-b border-zinc-100 bg-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Mashhur mahsulotlar</h2>
                <p className="text-sm text-zinc-500">Eng ko&apos;p sotilgan mahsulotlar</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              Barchasi <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            {topProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="border-b border-zinc-100 bg-zinc-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Kategoriyalar</h2>
            <p className="mt-1 text-sm text-zinc-500">Katalog bo‘yicha</p>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
            {categoryTiles.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-zinc-500">Kategoriyalar yuklanmoqda...</p>
            )}
            {categoryTiles.map((brand) => (
              <button
                key={brand.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-emerald-200/80 hover:shadow-md"
              >
                <div className="mb-1 text-2xl">{brand.logo}</div>
                <div className="text-sm font-medium text-zinc-900">{brand.name}</div>
                <div className="text-xs text-zinc-500">{brand.count} ta</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Full Catalog */}
      <section id="catalog" ref={catalogRef} className="scroll-mt-28 border-t border-zinc-100 bg-zinc-50/80 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Barcha mahsulotlar</h2>
              <p className="mt-1 text-sm text-zinc-500">{filteredProducts.length} ta mahsulot</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode */}
              <div className="hidden md:flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-full p-2 transition-colors ${viewMode === 'grid' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-full p-2 transition-colors ${viewMode === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                {BRAND.name} — oila va hamkorlar uchun taza go&apos;sht-kolbasa
              </h2>
              <p className="text-slate-600 mb-4 leading-relaxed">
                {BRAND.description}
              </p>
              <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                Do&apos;kon yoki oshxona uchun buyurtma, narx va yetkazib berishni qulay qilish uchun hamkorlar{' '}
                {BRAND.erpProductName} orqali buyurtma, ombor va logistikani bir joyda boshqiradi — siz esa vaqtingizni
                mijozlarga sarflaysiz.
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

          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l border-zinc-200 shadow-lg overflow-y-auto">
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
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white border-l border-zinc-200 shadow-lg overflow-y-auto">
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
      <footer className="mt-auto shrink-0 border-t border-zinc-800 bg-zinc-950 text-zinc-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Logo */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center ring-1 ring-emerald-500/30">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">{BRAND.name}</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                {BRAND.tagline}. {BRAND.siteHost} — rasmiy vitrina va B2B; {BRAND.erpProductName} — ichki boshqaruv.
              </p>
            </div>

            {/* Kategoriyalar */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Kategoriyalar</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                {CONTACT.showcaseCategories.map((label) => (
                  <li key={label}>
                    <a href="#catalog" className="transition-colors hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bog'lanish */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Bog&apos;lanish</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                {CONTACT.phones.map((p) => (
                  <li key={p.tel} className="flex items-start gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    <a href={`tel:${p.tel}`} className="transition-colors hover:text-white">
                      {p.display}
                    </a>
                  </li>
                ))}
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  <span className="leading-snug text-zinc-400">{CONTACT.addressLine}</span>
                </li>
              </ul>
            </div>

            {/* Working Hours */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ish vaqti</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Dushanba – Juma: 08:00 – 18:00</li>
                <li>Shanba: 08:00 – 14:00</li>
                <li>Yakshanba: dam olish</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-zinc-800/80 pt-6 text-[11px] text-zinc-500 pb-[env(safe-area-inset-bottom,0px)]">
            <span className="whitespace-nowrap text-zinc-500">© 2026</span>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <span className="whitespace-nowrap text-zinc-400">
              Ishlab chiqaruvchi:{' '}
              <a
                href="https://cdcgroup.uz"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                CDCGroup
              </a>
              <span className="mx-1 text-zinc-600">/</span>
              <a
                href="https://cdcgroup.uz"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                CraDev Company
              </a>
            </span>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {CONTACT.phones.map((p, i) => (
                <span key={p.tel} className="inline-flex items-center gap-1 whitespace-nowrap">
                  {i > 0 && <span className="hidden sm:inline text-zinc-600">·</span>}
                  <Phone className="h-3 w-3 shrink-0 text-zinc-600" aria-hidden />
                  <a href={`tel:${p.tel}`} className="text-zinc-400 hover:text-emerald-400 hover:underline">
                    {p.display}
                  </a>
                </span>
              ))}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <a
                href="https://t.me/Xazrat_bro"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="rounded p-0.5 text-emerald-400 transition-colors hover:bg-white/10"
              >
                <Send className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.instagram.com/islom_cdcgroup?igsh=MXVtejdibTUzY281ZQ=="
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded p-0.5 text-emerald-400 transition-colors hover:bg-white/10"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </span>
          </div>

        </div>
      </footer>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setQuickViewProduct(null)} />
          <div className="relative bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-lg border border-zinc-200">
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
          className="fixed bottom-20 right-4 z-50 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md flex items-center justify-center transition-colors"
          aria-label="Yuqoriga"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[100] px-3 py-2 rounded-lg shadow-md flex items-center gap-2 text-sm text-white border border-white/10 ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Cookie Consent */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] bg-zinc-900 text-white p-4 border-t border-zinc-700 shadow-lg">
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
