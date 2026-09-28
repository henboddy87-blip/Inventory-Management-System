import React, { useState, useEffect } from 'react';
import { History, Filter, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { apiClient } from '../../api/client';
import { StockMovement, Warehouse } from '../../types';

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchMovements();
  }, [selectedWh, selectedType]);

  const fetchWarehouses = async () => {
    try {
      const res = await apiClient.get<Warehouse[]>('/warehouses');
      setWarehouses(res.data);
    } catch {
      // ignore
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      let url = '/inventory/movements?limit=100';
      if (selectedWh) url += `&warehouse_id=${selectedWh}`;
      if (selectedType) url += `&movement_type=${selectedType}`;

      const res = await apiClient.get<StockMovement[]>(url);
      setMovements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'Purchase':
      case 'Opening Stock':
      case 'Transfer In':
      case 'Sale Return':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case 'Sale':
      case 'Purchase Return':
      case 'Transfer Out':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
      case 'Stock Adjustment':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Stock Movements Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail for all stock transactions (Never change stock without traceability)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedWh}
            onChange={(e) => setSelectedWh(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
          >
            <option value="">All Movement Types</option>
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Stock Adjustment">Stock Adjustment</option>
            <option value="Transfer In">Transfer In</option>
            <option value="Transfer Out">Transfer Out</option>
            <option value="Opening Stock">Opening Stock</option>
            <option value="Sale Return">Sale Return</option>
            <option value="Purchase Return">Purchase Return</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Product & SKU</th>
                <th className="py-3 px-4 font-semibold">Warehouse Depot</th>
                <th className="py-3 px-4 font-semibold">Movement Type</th>
                <th className="py-3 px-4 font-semibold text-center">Before</th>
                <th className="py-3 px-4 font-semibold text-center">Change (Delta)</th>
                <th className="py-3 px-4 font-semibold text-center">After</th>
                <th className="py-3 px-4 font-semibold font-mono">Reference #</th>
                <th className="py-3 px-4 font-semibold">User / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading stock ledger records...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No stock movements recorded yet.</td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.movement_date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{m.product_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.product_sku} {m.variant_label ? `(${m.variant_label})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{m.warehouse_name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getMovementTypeBadge(m.movement_type)}`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{m.before_quantity}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {m.after_quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{m.reference_number || '-'}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{m.user_name || 'System'}</p>
                      {m.note && <p className="text-[10px] text-slate-400 truncate max-w-xs">{m.note}</p>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
