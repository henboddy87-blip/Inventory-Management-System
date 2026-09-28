import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, CheckCircle, PackageCheck, Eye, ArrowDownRight } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Purchase, Supplier, Warehouse, Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const PurchasesPage: React.FC = () => {
  const { t } = useLanguage();
  const { formatMoney } = useCurrency();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState<number>(1);
  const [poWarehouseId, setPoWarehouseId] = useState<number>(1);
  const [poDiscount, setPoDiscount] = useState<number>(0);
  const [poShipping, setPoShipping] = useState<number>(0);
  const [poPaid, setPoPaid] = useState<number>(0);
  const [poNotes, setPoNotes] = useState('');
  const [poAutoReceive, setPoAutoReceive] = useState(true);
  const [poItems, setPoItems] = useState<Array<{ product_id: number; quantity: number; unit_cost: number }>>([]);

  // Detail Modal
  const [viewingPo, setViewingPo] = useState<Purchase | null>(null);

  useEffect(() => {
    loadMetadata();
    fetchPurchases();
  }, []);

  const loadMetadata = async () => {
    try {
      const [sRes, wRes, pRes] = await Promise.all([
        apiClient.get<Supplier[]>('/suppliers'),
        apiClient.get<Warehouse[]>('/warehouses'),
        apiClient.get('/products?limit=100')
      ]);
      setSuppliers(sRes.data);
      setWarehouses(wRes.data);
      setProducts(pRes.data.items);
      if (sRes.data.length > 0) setPoSupplierId(sRes.data[0].id);
      if (wRes.data.length > 0) setPoWarehouseId(wRes.data[0].id);
    } catch {
      // ignore
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Purchase[]>('/purchases');
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemToPo = (prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setPoItems([...poItems, { product_id: prod.id, quantity: 10, unit_cost: prod.cost_price }]);
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one product item to the purchase order');
      return;
    }

    try {
      await apiClient.post('/purchases', {
        supplier_id: poSupplierId,
        warehouse_id: poWarehouseId,
        discount: Number(poDiscount),
        shipping_cost: Number(poShipping),
        paid_amount: Number(poPaid),
        notes: poNotes,
        auto_receive: poAutoReceive,
        items: poItems.map(i => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
          discount: 0
        }))
      });
      setIsPoModalOpen(false);
      setPoItems([]);
      fetchPurchases();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating purchase order');
    }
  };

  const handleReceiveGoods = async (poId: number) => {
    if (!window.confirm('Receive goods and update warehouse inventory immediately?')) return;
    try {
      await apiClient.post(`/purchases/${poId}/receive`, {});
      fetchPurchases();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to receive goods');
    }
  };

  const subtotalCalc = poItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0);
  const totalCalc = subtotalCalc - poDiscount + poShipping;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <span>{t('nav_purchases')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase orders, shipment receiving, and inventory replenishment workflow
          </p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) {
              setPoItems([{ product_id: products[0].id, quantity: 20, unit_cost: products[0].cost_price }]);
            }
            setPoDiscount(0);
            setPoShipping(0);
            setPoPaid(0);
            setPoNotes('');
            setPoAutoReceive(true);
            setIsPoModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold font-mono">PO Number</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Warehouse</th>
                <th className="py-3 px-4 font-semibold text-center">Items Count</th>
                <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Paid</th>
                <th className="py-3 px-4 font-semibold text-center">Payment</th>
                <th className="py-3 px-4 font-semibold text-center">Order Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading purchase orders...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No purchase orders found.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.po_number}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {p.supplier_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.warehouse_name}</td>
                    <td className="py-3 px-4 text-center font-semibold">{p.items.length}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(p.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {formatMoney(p.paid_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={p.payment_status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={p.purchase_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingPo(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {p.purchase_status !== 'Received' && p.purchase_status !== 'Cancelled' && (
                          <button
                            onClick={() => handleReceiveGoods(p.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                            title="Receive goods and increase stock"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      <Modal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} title="Create Purchase Order" maxWidth="2xl">
        <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Supplier *</label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Receiving Warehouse *</label>
              <select
                value={poWarehouseId}
                onChange={(e) => setPoWarehouseId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Item Row */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Order Items</span>
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    setPoItems([...poItems, { product_id: products[0].id, quantity: 10, unit_cost: products[0].cost_price }]);
                  }
                }}
                className="text-blue-600 font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {poItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border">
                <select
                  value={item.product_id}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    const prod = products.find(p => p.id === pid);
                    const next = [...poItems];
                    next[idx].product_id = pid;
                    if (prod) next[idx].unit_cost = prod.cost_price;
                    setPoItems(next);
                  }}
                  className="flex-1 px-2 py-1 rounded-lg border text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.cost_price})</option>
                  ))}
                </select>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...poItems];
                      next[idx].quantity = parseInt(e.target.value) || 1;
                      setPoItems(next);
                    }}
                    className="w-full px-2 py-1 rounded-lg border text-xs text-center font-bold"
                  />
                </div>

                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cost"
                    value={item.unit_cost}
                    onChange={(e) => {
                      const next = [...poItems];
                      next[idx].unit_cost = parseFloat(e.target.value) || 0;
                      setPoItems(next);
                    }}
                    className="w-full px-2 py-1 rounded-lg border text-xs text-right font-medium"
                  />
                </div>

                <div className="w-24 text-right font-bold text-slate-800 dark:text-slate-100">
                  ${(item.quantity * item.unit_cost).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePoItem(idx)}
                  className="text-rose-500 hover:text-rose-700 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium mb-1">Discount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={poDiscount}
                onChange={(e) => setPoDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Shipping Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={poShipping}
                onChange={(e) => setPoShipping(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Upfront Paid ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={poPaid}
                onChange={(e) => setPoPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRecv"
                checked={poAutoReceive}
                onChange={(e) => setPoAutoReceive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRecv" className="font-semibold text-slate-800 dark:text-slate-200">
                Mark as immediately received (stock into warehouse now)
              </label>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Total PO Amount</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">${totalCalc.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPoModalOpen(false)} className="px-4 py-2 border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium">
              Create Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Detail Modal */}
      <Modal isOpen={!!viewingPo} onClose={() => setViewingPo(null)} title={`Purchase Order: ${viewingPo?.po_number}`} maxWidth="xl">
        {viewingPo && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
              <div>
                <p className="text-slate-400">Supplier</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{viewingPo.supplier_name}</p>
                <p className="text-slate-500 mt-1">Warehouse: {viewingPo.warehouse_name}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Date: {new Date(viewingPo.purchase_date).toLocaleDateString()}</p>
                <div className="mt-1 space-x-1">
                  <Badge status={viewingPo.purchase_status} />
                  <Badge status={viewingPo.payment_status} />
                </div>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b font-semibold text-slate-500">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Ordered</th>
                  <th className="py-2 text-center">Received</th>
                  <th className="py-2 text-right">Cost</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {viewingPo.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 font-medium">{it.product_name}</td>
                    <td className="py-2 text-center">{it.quantity}</td>
                    <td className="py-2 text-center text-emerald-600 font-bold">{it.received_quantity}</td>
                    <td className="py-2 text-right">${it.unit_cost.toFixed(2)}</td>
                    <td className="py-2 text-right font-bold">${it.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-3 border-t text-right space-y-1">
              <p className="text-slate-500">Subtotal: ${viewingPo.subtotal.toFixed(2)}</p>
              <p className="text-slate-900 dark:text-white font-bold text-sm">Total: ${viewingPo.total_amount.toFixed(2)}</p>
              <p className="text-emerald-600">Paid: ${viewingPo.paid_amount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
