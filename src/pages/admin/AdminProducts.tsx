import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  FolderTree,
  Tag,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useDebouncedValue } from '../../platform/useDebouncedValue';
import { addNotification } from '../../platform/notifications';
import {
  productApi,
  categoryApi,
  brandApi,
  ApiError,
  type ApiProduct,
  type ApiCategory,
  type ApiBrand,
} from '../../services/api';
import { hasDjangoJwt } from '../../services/djangoAuth';
import DjangoApiReconnect from '../../components/DjangoApiReconnect';
import { logger } from '../../services/logger';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { normalizeMediaPath, resolveMediaUrl } from '../../utils/mediaUrl';

type Tab = 'products' | 'categories' | 'brands';

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'box'] as const;

const emptyProductForm = () => ({
  name: '',
  sku: '',
  barcode: '',
  description: '',
  image: '',
  category: '',
  brand: '',
  unit: 'kg' as (typeof UNITS)[number],
  weight: '',
  base_price: '',
  b2b_price: '',
  cost_price: '',
  min_stock: '0',
  max_stock: '1000',
  is_active: true,
  is_b2b_active: true,
});

function formatMoney(n: number | string) {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

export default function AdminProducts() {
  const [apiLinked, setApiLinked] = useState(() => hasDjangoJwt());
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [brands, setBrands] = useState<ApiBrand[]>([]);

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '', sort_order: '0', is_active: true });

  const [brandModal, setBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ApiBrand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: '', logo: '', description: '', is_active: true });

  useEffect(() => {
    const onRestored = () => setApiLinked(true);
    const onExpired = () => setApiLinked(false);
    window.addEventListener('auth:jwt-restored', onRestored);
    window.addEventListener('auth:jwt-expired', onExpired);
    return () => {
      window.removeEventListener('auth:jwt-restored', onRestored);
      window.removeEventListener('auth:jwt-expired', onExpired);
    };
  }, []);

  const loadAll = useCallback(async () => {
    if (!hasDjangoJwt()) {
      setApiLinked(false);
      setLoading(false);
      return;
    }
    setApiLinked(true);
    setLoading(true);
    try {
      const [p, c, b] = await Promise.all([
        productApi.getAll(debouncedSearch ? { search: debouncedSearch } : undefined),
        categoryApi.getAll(),
        brandApi.getAll(),
      ]);
      setProducts(p);
      setCategories(c);
      setBrands(b);
    } catch (e) {
      logger.error('Katalog yuklanmadi', e instanceof Error ? e : undefined);
      addNotification('Xatolik', e instanceof ApiError ? e.message : 'Ma\'lumotlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
    );
  }, [products, debouncedSearch]);

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm());
    if (categories.length > 0) {
      setProductForm((f) => ({ ...f, category: String(categories[0].id) }));
    }
    setProductModal(true);
  };

  const openEditProduct = (p: ApiProduct) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      description: p.description || '',
      image: p.image || '',
      category: String(p.category),
      brand: p.brand != null ? String(p.brand) : '',
      unit: (UNITS.includes(p.unit as (typeof UNITS)[number]) ? p.unit : 'kg') as (typeof UNITS)[number],
      weight: p.weight != null ? String(p.weight) : '',
      base_price: String(p.base_price),
      b2b_price: String(p.b2b_price),
      cost_price: String(p.cost_price),
      min_stock: String(p.min_stock),
      max_stock: String(p.max_stock),
      is_active: p.is_active,
      is_b2b_active: p.is_b2b_active,
    });
    setProductModal(true);
  };

  const buildProductPayload = () => {
    if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.category) {
      throw new Error('Nomi, SKU va kategoriya majburiy');
    }
    return {
      name: productForm.name.trim(),
      sku: productForm.sku.trim(),
      barcode: productForm.barcode.trim(),
      description: productForm.description.trim(),
      image: normalizeMediaPath(productForm.image.trim()),
      category: Number(productForm.category) || productForm.category,
      brand: productForm.brand ? Number(productForm.brand) || productForm.brand : null,
      unit: productForm.unit,
      weight: productForm.weight ? Number(productForm.weight) : null,
      base_price: Number(productForm.base_price) || 0,
      b2b_price: Number(productForm.b2b_price) || 0,
      cost_price: Number(productForm.cost_price) || 0,
      min_stock: Number(productForm.min_stock) || 0,
      max_stock: Number(productForm.max_stock) || 0,
      is_active: productForm.is_active,
      is_b2b_active: productForm.is_b2b_active,
    };
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload = buildProductPayload();
      let saved: ApiProduct;
      if (editingProduct) {
        saved = await productApi.update(String(editingProduct.id), payload);
        addNotification('Saqlandi', `${saved.name} yangilandi`);
      } else {
        saved = await productApi.create(payload);
        addNotification('Yaratildi', `${saved.name} qo‘shildi`);
      }
      setProductModal(false);
      await loadAll();
    } catch (e) {
      addNotification('Xatolik', e instanceof Error ? e.message : 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const deactivateProduct = async (p: ApiProduct) => {
    if (!window.confirm(`"${p.name}" ni nofaol qilasizmi?`)) return;
    setSaving(true);
    try {
      await productApi.update(String(p.id), { is_active: false, is_b2b_active: false });
      addNotification('Nofaol', `${p.name} katalogdan yashirildi`);
      await loadAll();
    } catch (e) {
      addNotification('Xatolik', e instanceof Error ? e.message : 'Yangilashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const deleteProductHard = async (p: ApiProduct) => {
    if (!window.confirm(`"${p.name}" butunlay o‘chirilsinmi? Buyurtmalarda ishlatilgan bo‘lsa xato beradi.`)) return;
    setSaving(true);
    try {
      await productApi.delete(String(p.id));
      addNotification('O‘chirildi', p.name);
      await loadAll();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'O‘chirib bo‘lmadi — nofaol qiling yoki buyurtmalarni tekshiring';
      addNotification('Xatolik', msg);
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        image: normalizeMediaPath(categoryForm.image.trim()),
        sort_order: Number(categoryForm.sort_order) || 0,
        is_active: categoryForm.is_active,
      };
      if (editingCategory) {
        await categoryApi.update(String(editingCategory.id), payload);
      } else {
        await categoryApi.create(payload);
      }
      setCategoryModal(false);
      await loadAll();
      addNotification('Kategoriya', 'Saqlandi');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Kategoriya saqlanmadi';
      addNotification('Xatolik', msg);
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async () => {
    if (!brandForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: brandForm.name.trim(),
        logo: normalizeMediaPath(brandForm.logo.trim()),
        description: brandForm.description.trim(),
        is_active: brandForm.is_active,
      };
      if (editingBrand) {
        await brandApi.update(String(editingBrand.id), payload);
      } else {
        await brandApi.create(payload);
      }
      setBrandModal(false);
      await loadAll();
      addNotification('Brend', 'Saqlandi');
    } catch (e) {
      addNotification('Xatolik', e instanceof Error ? e.message : 'Brend saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  if (!apiLinked || !hasDjangoJwt()) {
    return (
      <DjangoApiReconnect
        title="Mahsulotlar boshqaruvi"
        onConnected={() => {
          setApiLinked(true);
          void loadAll();
        }}
      />
    );
  }

  const tabBtn = (id: Tab, label: string, Icon: typeof Package) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        tab === id
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mahsulotlar katalogi</h1>
          <p className="text-slate-600 text-sm mt-1">
            Qoʻshish, tahrirlash, narxlar, rasmlar. Barcha o‘zgarishlar Django serverda saqlanadi.
          </p>
        </div>
        {tab === 'products' && (
          <div className="flex gap-2">
            <Button variant="primary" className="gap-2" type="button" onClick={openCreateProduct}>
              <Plus className="h-4 w-4" /> Yangi mahsulot
            </Button>
          </div>
        )}
        {tab === 'categories' && (
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '', image: '', sort_order: '0', is_active: true });
              setCategoryModal(true);
            }}
          >
            <Plus className="h-4 w-4" /> Kategoriya
          </Button>
        )}
        {tab === 'brands' && (
          <Button
            variant="primary"
            className="gap-2"
            type="button"
            onClick={() => {
              setEditingBrand(null);
              setBrandForm({ name: '', logo: '', description: '', is_active: true });
              setBrandModal(true);
            }}
          >
            <Plus className="h-4 w-4" /> Brend
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabBtn('products', 'Mahsulotlar', Package)}
        {tabBtn('categories', 'Kategoriyalar', FolderTree)}
        {tabBtn('brands', 'Brendlar', Tag)}
      </div>

      {tab === 'products' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Nomi, SKU, shtrix-kod..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" type="button" onClick={() => loadAll()}>
              Yangilash
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-slate-500 py-12">Mahsulotlar yo‘q. «Yangi mahsulot» tugmasini bosing.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Rasm</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Mahsulot</th>
                    <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Kategoriya</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">Asosiy</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">B2B</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">Tannarx</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Holat</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={String(p.id)} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        {p.image ? (
                          <img src={resolveMediaUrl(p.image)} alt="" className="h-10 w-10 rounded object-cover border border-slate-200" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{p.category_name || p.category}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(p.base_price)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">{formatMoney(p.b2b_price)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{formatMoney(p.cost_price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={p.is_active ? 'success' : 'neutral'} size="sm">
                            {p.is_active ? 'Faol' : 'Nofaol'}
                          </Badge>
                          {p.is_b2b_active && (
                            <Badge variant="info" size="sm">B2B</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" type="button" onClick={() => openEditProduct(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {p.is_active && (
                            <Button variant="outline" size="sm" type="button" onClick={() => deactivateProduct(p)}>
                              Nofaol
                            </Button>
                          )}
                          <Button variant="outline" size="sm" type="button" onClick={() => deleteProductHard(p)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'categories' && (
        <Card>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {categories.map((c) => (
                <li key={String(c.id)} className="flex items-center justify-between py-3 px-2">
                  <div className="flex items-center gap-3">
                    {c.image ? (
                      <img src={resolveMediaUrl(c.image)} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <FolderTree className="h-5 w-5 text-slate-400" />
                    )}
                    <span className="font-medium">{c.name}</span>
                    {!c.is_active && <Badge variant="neutral" size="sm">Nofaol</Badge>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setEditingCategory(c);
                      setCategoryForm({
                        name: c.name,
                        description: c.description || '',
                        image: c.image || '',
                        sort_order: String(c.sort_order),
                        is_active: c.is_active,
                      });
                      setCategoryModal(true);
                    }}
                  >
                    Tahrirlash
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'brands' && (
        <Card>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {brands.map((b) => (
                <li key={String(b.id)} className="flex items-center justify-between py-3 px-2">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">{b.name}</span>
                    {!b.is_active && <Badge variant="neutral" size="sm">Nofaol</Badge>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setEditingBrand(b);
                      setBrandForm({
                        name: b.name,
                        logo: b.logo || '',
                        description: b.description || '',
                        is_active: b.is_active,
                      });
                      setBrandModal(true);
                    }}
                  >
                    Tahrirlash
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal
        isOpen={productModal}
        onClose={() => setProductModal(false)}
        title={editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Nomi *" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          <Input label="SKU *" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
          <Input label="Shtrix-kod" value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategoriya *</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            >
              <option value="">Tanlang</option>
              {categories.filter((c) => c.is_active).map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brend</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={productForm.brand}
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
            >
              <option value="">—</option>
              {brands.filter((b) => b.is_active).map((b) => (
                <option key={String(b.id)} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">O‘lchov birligi</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value as (typeof UNITS)[number] })}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input label="Og‘irlik (kg)" value={productForm.weight} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} />
          <Input label="Asosiy narx" type="number" value={productForm.base_price} onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })} />
          <Input label="B2B narxi" type="number" value={productForm.b2b_price} onChange={(e) => setProductForm({ ...productForm, b2b_price: e.target.value })} />
          <Input label="Tannarx" type="number" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} />
          <Input label="Min zaxira" type="number" value={productForm.min_stock} onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })} />
          <Input label="Max zaxira" type="number" value={productForm.max_stock} onChange={(e) => setProductForm({ ...productForm, max_stock: e.target.value })} />
          <div className="md:col-span-2">
            <ImageUpload
              label="Mahsulot rasmi"
              folder="catalog"
              hint="Fayl yuklang yoki internetdagi rasm havolasini (URL) kiriting"
              value={productForm.image}
              onChange={(image) => setProductForm({ ...productForm, image })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tavsif</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={productForm.is_active} onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })} />
            Faol (katalogda)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={productForm.is_b2b_active} onChange={(e) => setProductForm({ ...productForm, is_b2b_active: e.target.checked })} />
            B2B katalogda ko‘rsatish
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => setProductModal(false)}>Bekor</Button>
          <Button variant="primary" type="button" disabled={saving} onClick={saveProduct}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Saqlash'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={categoryModal} onClose={() => setCategoryModal(false)} title={editingCategory ? 'Kategoriya' : 'Yangi kategoriya'}>
        <div className="space-y-3">
          <Input label="Nomi" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          <ImageUpload
            label="Kategoriya rasmi"
            folder="categories"
            value={categoryForm.image}
            onChange={(image) => setCategoryForm({ ...categoryForm, image })}
          />
          <Input label="Tartib" type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} />
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Tavsif"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />
            Faol
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={() => setCategoryModal(false)}>Bekor</Button>
          <Button variant="primary" type="button" disabled={saving} onClick={saveCategory}>Saqlash</Button>
        </div>
      </Modal>

      <Modal isOpen={brandModal} onClose={() => setBrandModal(false)} title={editingBrand ? 'Brend' : 'Yangi brend'}>
        <div className="space-y-3">
          <Input label="Nomi" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} />
          <ImageUpload
            label="Brend logotipi"
            folder="brands"
            value={brandForm.logo}
            onChange={(logo) => setBrandForm({ ...brandForm, logo })}
          />
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Tavsif"
            value={brandForm.description}
            onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={brandForm.is_active} onChange={(e) => setBrandForm({ ...brandForm, is_active: e.target.checked })} />
            Faol
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={() => setBrandModal(false)}>Bekor</Button>
          <Button variant="primary" type="button" disabled={saving} onClick={saveBrand}>Saqlash</Button>
        </div>
      </Modal>
    </div>
  );
}
