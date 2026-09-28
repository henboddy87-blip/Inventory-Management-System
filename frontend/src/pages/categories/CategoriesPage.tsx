import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Category, Brand } from '../../types';
import { Modal } from '../../components/common/Modal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catKhmerName, setCatKhmerName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState<number | undefined>(undefined);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);

  // Brand Modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandKhmerName, setBrandKhmerName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([
        apiClient.get<Category[]>('/categories/all'),
        apiClient.get<Brand[]>('/brands')
      ]);
      setCategories(cRes.data);
      setBrands(bRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await apiClient.put(`/categories/${editingCatId}`, {
          name: catName,
          khmer_name: catKhmerName,
          description: catDesc,
          parent_id: catParentId || null
        });
      } else {
        await apiClient.post('/categories', {
          name: catName,
          khmer_name: catKhmerName,
          description: catDesc,
          parent_id: catParentId || null
        });
      }
      setIsCatModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving category');
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/brands', {
        name: brandName,
        khmer_name: brandKhmerName,
        description: brandDesc
      });
      setIsBrandModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving brand');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cannot delete category containing products');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>Categories & Brands</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize products by taxonomy and brand labels with Cambodian naming support
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingCatId(null);
              setCatName('');
              setCatKhmerName('');
              setCatDesc('');
              setCatParentId(undefined);
              setIsCatModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              setBrandName('');
              setBrandKhmerName('');
              setBrandDesc('');
              setIsBrandModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl flex items-center space-x-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Two columns: Categories list & Brands list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Product Categories ({categories.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {c.name}
                  </div>
                  {c.khmer_name && (
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {c.khmer_name}
                    </div>
                  )}
                  {c.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setEditingCatId(c.id);
                      setCatName(c.name);
                      setCatKhmerName(c.khmer_name || '');
                      setCatDesc(c.description || '');
                      setCatParentId(c.parent_id || undefined);
                      setIsCatModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brands list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Brands ({brands.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {brands.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{b.name}</div>
                  {b.khmer_name && (
                    <div className="text-[11px] text-slate-400">{b.khmer_name}</div>
                  )}
                  {b.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCatId ? 'Edit Category' : 'Create Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Category Name (English) *</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Footwear"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Khmer Name (ឈ្មោះជាភាសាខ្មែរ)</label>
            <input
              type="text"
              value={catKhmerName}
              onChange={(e) => setCatKhmerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="ឧ. ស្បែកជើង"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Brand Modal */}
      <Modal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        title="Add New Brand"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Brand Name *</label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Angkor Urban"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Khmer Brand Name</label>
            <input
              type="text"
              value={brandKhmerName}
              onChange={(e) => setBrandKhmerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="ឧ. អង្គរ អឺបាន"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsBrandModalOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              Save Brand
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
