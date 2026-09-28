import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Product, Category, Brand, Unit, Warehouse } from '../../types';
import { apiClient } from '../../api/client';
import { Plus, Trash2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingProduct
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [khmerName, setKhmerName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [brandId, setBrandId] = useState<number | undefined>(undefined);
  const [unitId, setUnitId] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [maxStock, setMaxStock] = useState<number>(500);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [variants, setVariants] = useState<Array<{ size: string; color: string; sku: string; selling_price: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
      if (editingProduct) {
        setName(editingProduct.name);
        setKhmerName(editingProduct.khmer_name || '');
        setSku(editingProduct.sku);
        setBarcode(editingProduct.barcode || '');
        setDescription(editingProduct.description || '');
        setCategoryId(editingProduct.category_id);
        setBrandId(editingProduct.brand_id);
        setUnitId(editingProduct.unit_id);
        setCostPrice(editingProduct.cost_price);
        setSellingPrice(editingProduct.selling_price);
        setWholesalePrice(editingProduct.wholesale_price || editingProduct.selling_price);
        setMinStock(editingProduct.min_stock);
        setMaxStock(editingProduct.max_stock || 500);
        setInitialStock(0);
        setVariants([]);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingProduct]);

  const loadDropdowns = async () => {
    try {
      const [cRes, bRes, uRes, wRes] = await Promise.all([
        apiClient.get('/categories/all'),
        apiClient.get('/brands'),
        apiClient.get('/units'),
        apiClient.get('/warehouses')
      ]);
      setCategories(cRes.data);
      setBrands(bRes.data);
      setUnits(uRes.data);
      setWarehouses(wRes.data);
      if (cRes.data.length > 0 && !editingProduct) setCategoryId(cRes.data[0].id);
      if (wRes.data.length > 0 && !editingProduct) setWarehouseId(wRes.data[0].id);
    } catch {
      // ignore
    }
  };

  const resetForm = () => {
    setName('');
    setKhmerName('');
    setSku('');
    setBarcode('');
    setDescription('');
    setCostPrice(0);
    setSellingPrice(0);
    setWholesalePrice(0);
    setMinStock(5);
    setMaxStock(500);
    setInitialStock(0);
    setVariants([]);
    setError(null);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: 'M', color: 'Black', sku: '', selling_price: sellingPrice }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, {
          name,
          khmer_name: khmerName,
          sku,
          barcode,
          description,
          category_id: categoryId,
          brand_id: brandId || null,
          unit_id: unitId || null,
          cost_price: Number(costPrice),
          selling_price: Number(sellingPrice),
          wholesale_price: Number(wholesalePrice),
          min_stock: Number(minStock),
          max_stock: Number(maxStock)
        });
      } else {
        await apiClient.post('/products', {
          name,
          khmer_name: khmerName,
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          description,
          category_id: categoryId,
          brand_id: brandId || null,
          unit_id: unitId || null,
          cost_price: Number(costPrice),
          selling_price: Number(sellingPrice),
          wholesale_price: Number(wholesalePrice),
          min_stock: Number(minStock),
          max_stock: Number(maxStock),
          initial_stock: Number(initialStock),
          warehouse_id: warehouseId,
          variants: variants.length > 0 ? variants : undefined
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        {/* Row 1: Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Product Name (English) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Cotton T-Shirt"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Khmer Name (ឈ្មោះជាភាសាខ្មែរ)
            </label>
            <input
              type="text"
              value={khmerName}
              onChange={(e) => setKhmerName(e.target.value)}
              placeholder="ឧ. អាវយឺតកប្បាសបែបបុរាណ"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Row 2: SKU & Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              SKU (Auto-generated if empty)
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. TSH-001"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Barcode (Auto-generated if empty)
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8859012345"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Row 3: Category, Brand & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.khmer_name ? `(${c.khmer_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Brand</label>
            <select
              value={brandId || ''}
              onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">None</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Unit</label>
            <select
              value={unitId || ''}
              onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Default (pcs)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Cost Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Retail Selling Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-emerald-600"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Wholesale Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-blue-600"
            />
          </div>
        </div>

        {/* Row 5: Stock Levels & Initial Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Min Stock Alert Level</label>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          {!editingProduct && (
            <>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Receiving Warehouse</label>
                <select
                  value={warehouseId || ''}
                  onChange={(e) => setWarehouseId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Variants section for Clothing/Shoes */}
        {!editingProduct && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Product Variants (e.g. Size & Color for Fashion)
              </span>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-center space-x-2 mb-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                <input
                  type="text"
                  placeholder="Size (e.g. M, L)"
                  value={v.size}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx].size = e.target.value;
                    setVariants(next);
                  }}
                  className="w-24 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border text-xs"
                />
                <input
                  type="text"
                  placeholder="Color (e.g. Black)"
                  value={v.color}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx].color = e.target.value;
                    setVariants(next);
                  }}
                  className="w-28 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
