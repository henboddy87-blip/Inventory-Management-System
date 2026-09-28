import React, { useState, useEffect } from 'react';
import { Boxes, Search, SlidersHorizontal, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { WarehouseStockItem, Warehouse } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const InventoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [stocks, setStocks] = useState<WarehouseStockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [adjItem, setAdjItem] = useState<WarehouseStockItem | null>(null);
  const [adjQuantity, setAdjQuantity] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('Physical count discrepancy');

  // Transfer Modal
  const [isTrfOpen, setIsTrfOpen] = useState(false);
  const [trfItem, setTrfItem] = useState<WarehouseStockItem | null>(null);
  const [trfDestWhId, setTrfDestWhId] = useState<number>(1);
  const [trfQuantity, setTrfQuantity] = useState<number>(1);
  const [trfNotes, setTrfNotes] = useState('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [selectedWarehouse, selectedStatus, search]);

  const fetchWarehouses = async () => {
    try {
      const res = await apiClient.get<Warehouse[]>('/warehouses');
      setWarehouses(res.data);
    } catch {
      // ignore
    }
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      let url = '/inventory?';
      if (selectedWarehouse) url += `warehouse_id=${selectedWarehouse}&`;
      if (selectedStatus) url += `stock_status=${selectedStatus}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiClient.get<WarehouseStockItem[]>(url);
      setStocks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (item: WarehouseStockItem) => {
    setAdjItem(item);
    setAdjQuantity(item.current_stock);
    setAdjReason('Physical count discrepancy');
    setIsAdjOpen(true);
  };

  const handleOpenTransfer = (item: WarehouseStockItem) => {
    setTrfItem(item);
    setTrfQuantity(1);
    setTrfNotes('');
    const otherWh = warehouses.find(w => w.id !== item.warehouse_id);
    if (otherWh) setTrfDestWhId(otherWh.id);
    setIsTrfOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItem) return;
    try {
      await apiClient.post('/inventory/adjust', {
        warehouse_id: adjItem.warehouse_id,
        product_id: adjItem.product_id,
        variant_id: adjItem.variant_id,
        adjusted_quantity: Number(adjQuantity),
        is_absolute: true,
        reason: adjReason
      });
      setIsAdjOpen(false);
      fetchStocks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to adjust stock');
    }
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfItem) return;
    try {
      const res = await apiClient.post('/inventory/transfers', {
        source_warehouse_id: trfItem.warehouse_id,
        destination_warehouse_id: trfDestWhId,
        notes: trfNotes,
        items: [
          {
            product_id: trfItem.product_id,
            variant_id: trfItem.variant_id,
            quantity: Number(trfQuantity)
          }
        ]
      });

      // Complete transfer immediately for seamless user experience
      await apiClient.post(`/inventory/transfers/${res.data.id}/complete`);

      setIsTrfOpen(false);
      fetchStocks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to transfer stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>{t('nav_stocks')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-warehouse inventory levels with audit adjustment and stock transfer controls
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            <option value="">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold font-mono">SKU / Variant</th>
                <th className="py-3 px-4 font-semibold">Warehouse Depot</th>
                <th className="py-3 px-4 font-semibold text-center">Current Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Inventory Valuation</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading inventory data...</td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No stock records found.</td>
                </tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.product_name}</div>
                      {s.product_khmer_name && (
                        <div className="text-[11px] text-slate-400 font-sans">{s.product_khmer_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{s.sku}</span>
                      {(s.variant_size || s.variant_color) && (
                        <span className="block text-[10px] text-slate-400">
                          {[s.variant_size, s.variant_color].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.warehouse_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {s.current_stock}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Min: {s.min_stock}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">${s.cost_price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(s.inventory_value)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={s.stock_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenAdjust(s)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center space-x-1"
                          title="Adjust Stock Quantity"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-blue-500" />
                          <span>Adjust</span>
                        </button>
                        <button
                          onClick={() => handleOpenTransfer(s)}
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium flex items-center space-x-1"
                          title="Transfer to another warehouse"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjOpen} onClose={() => setIsAdjOpen(false)} title="Audit Stock Adjustment" maxWidth="md">
        {adjItem && (
          <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="font-bold text-slate-900 dark:text-white">{adjItem.product_name}</p>
              <p className="text-slate-400 font-mono">SKU: {adjItem.sku} • Warehouse: {adjItem.warehouse_name}</p>
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">Current system stock: {adjItem.current_stock} units</p>
            </div>
            <div>
              <label className="block font-medium mb-1">New Actual Physical Count *</label>
              <input
                type="number"
                min="0"
                required
                value={adjQuantity}
                onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Delta difference: {adjQuantity - adjItem.current_stock > 0 ? `+${adjQuantity - adjItem.current_stock}` : adjQuantity - adjItem.current_stock} units
              </span>
            </div>
            <div>
              <label className="block font-medium mb-1">Reason for Adjustment *</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                <option value="Physical count discrepancy">Physical count discrepancy</option>
                <option value="Damaged or expired inventory">Damaged or expired inventory</option>
                <option value="Supplier shipment discrepancy">Supplier shipment discrepancy</option>
                <option value="Customer return unrecorded">Customer return unrecorded</option>
                <option value="Internal shop use / sample">Internal shop use / sample</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsAdjOpen(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                Save Adjustment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Stock Transfer Modal */}
      <Modal isOpen={isTrfOpen} onClose={() => setIsTrfOpen(false)} title="Inter-Warehouse Transfer" maxWidth="md">
        {trfItem && (
          <form onSubmit={handleSaveTransfer} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="font-bold text-slate-900 dark:text-white">{trfItem.product_name}</p>
              <p className="text-slate-400 font-mono">SKU: {trfItem.sku}</p>
              <p className="text-slate-500 mt-1">Source Warehouse: <strong>{trfItem.warehouse_name}</strong> (Available: {trfItem.current_stock})</p>
            </div>
            <div>
              <label className="block font-medium mb-1">Destination Warehouse *</label>
              <select
                value={trfDestWhId}
                onChange={(e) => setTrfDestWhId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                {warehouses.filter(w => w.id !== trfItem.warehouse_id).map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.province})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Transfer Quantity *</label>
              <input
                type="number"
                min="1"
                max={trfItem.current_stock}
                required
                value={trfQuantity}
                onChange={(e) => setTrfQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Notes / Dispatch Memo</label>
              <input
                type="text"
                placeholder="e.g. Stock replenishment for weekend promo"
                value={trfNotes}
                onChange={(e) => setTrfNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsTrfOpen(false)} className="px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                Execute Transfer
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
