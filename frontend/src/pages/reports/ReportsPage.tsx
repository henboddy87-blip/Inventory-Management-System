import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Calendar, DollarSign, TrendingUp, Boxes, ShoppingBag } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

type ReportTab = 'sales' | 'purchases' | 'inventory' | 'profit';

export const ReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/${activeTab}?`;
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}&`;

      const res = await apiClient.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let url = `/api/reports/${activeTab}?export_csv=true`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Business Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial analytics, inventory valuation, cost accounting, and spreadsheet export
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab !== 'profit' && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Date Range Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Tab Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sales' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'purchases' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Purchase Report
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'profit' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Profit & Loss (P&L)
          </button>
        </div>

        {/* Date pickers */}
        <div className="flex items-center space-x-2 text-xs w-full md:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Content Rendering based on Tab */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading report analytics...</div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Summary KPI Cards for the active report */}
          {activeTab === 'sales' && data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Invoices Count</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.summary.total_sales_count}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Gross Revenue</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(data.summary.total_revenue)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Cost of Goods (COGS)</span>
                <p className="text-xl font-bold text-slate-500 mt-1">{formatMoney(data.summary.total_cost)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Gross Profit</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatMoney(data.summary.total_profit)} ({data.summary.profit_margin_percent}%)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">POs Processed</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.summary.total_po_count}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Total Purchase Outlay</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(data.summary.total_purchase_amount)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Paid to Suppliers</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatMoney(data.summary.total_paid_amount)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Outstanding Payables</span>
                <p className="text-xl font-bold text-rose-600 mt-1">{formatMoney(data.summary.total_unpaid_amount)}</p>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Total Units In Stock</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.summary.total_items_in_stock} items</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Total Inventory Cost</span>
                <p className="text-xl font-bold text-blue-600 mt-1">{formatMoney(data.summary.total_inventory_value)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Projected Retail Revenue</span>
                <p className="text-xl font-bold text-purple-600 mt-1">{formatMoney(data.summary.potential_sales_revenue)}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
                <span className="text-xs text-slate-400 font-medium">Projected Unrealized Profit</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatMoney(data.summary.projected_profit)}</p>
              </div>
            </div>
          )}

          {/* Profit & Loss Comprehensive View */}
          {activeTab === 'profit' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Income Statement / Profit & Loss Statement (P&L)
              </h3>

              <div className="space-y-3 text-xs max-w-xl">
                <div className="flex justify-between py-2 border-b font-semibold text-slate-800 dark:text-slate-200">
                  <span className="text-sm">Revenue (Gross Sales)</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(data.revenue)}</span>
                </div>

                <div className="flex justify-between py-2 border-b text-slate-500">
                  <span>Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-semibold text-rose-500">-{formatMoney(data.cost_of_goods_sold)}</span>
                </div>

                <div className="flex justify-between py-2.5 bg-blue-50/60 dark:bg-blue-950/20 px-3 rounded-xl font-bold text-blue-700 dark:text-blue-300">
                  <span>Gross Profit</span>
                  <span>{formatMoney(data.gross_profit)} ({data.gross_margin_percent}%)</span>
                </div>

                <div className="flex justify-between py-2 border-b text-slate-500">
                  <span>Less: Operating Expenses</span>
                  <span className="font-semibold text-rose-500">-{formatMoney(data.operating_expenses)}</span>
                </div>

                <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-950/30 px-3 rounded-xl font-black text-sm text-emerald-700 dark:text-emerald-300">
                  <span>NET PROFIT</span>
                  <span>{formatMoney(data.net_profit)} ({data.net_margin_percent}%)</span>
                </div>
              </div>

              {/* Expense Breakdown List */}
              {data.expense_breakdown && data.expense_breakdown.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Operating Expense Breakdown
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {data.expense_breakdown.map((item: any) => (
                      <div key={item.category} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                        <span className="text-slate-500 block">{item.category}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatMoney(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table for Sales, Purchases, or Inventory Records */}
          {activeTab !== 'profit' && data.records && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b">
                      {activeTab === 'sales' && (
                        <>
                          <th className="py-3 px-4 font-semibold font-mono">Invoice #</th>
                          <th className="py-3 px-4 font-semibold">Date</th>
                          <th className="py-3 px-4 font-semibold">Customer</th>
                          <th className="py-3 px-4 font-semibold">Warehouse</th>
                          <th className="py-3 px-4 font-semibold text-right">Revenue</th>
                          <th className="py-3 px-4 font-semibold text-right">Profit</th>
                          <th className="py-3 px-4 font-semibold">Payment Method</th>
                        </>
                      )}
                      {activeTab === 'purchases' && (
                        <>
                          <th className="py-3 px-4 font-semibold font-mono">PO Number</th>
                          <th className="py-3 px-4 font-semibold">Date</th>
                          <th className="py-3 px-4 font-semibold">Supplier</th>
                          <th className="py-3 px-4 font-semibold">Warehouse</th>
                          <th className="py-3 px-4 font-semibold text-right">Total Outlay</th>
                          <th className="py-3 px-4 font-semibold text-right">Paid</th>
                          <th className="py-3 px-4 font-semibold text-center">Status</th>
                        </>
                      )}
                      {activeTab === 'inventory' && (
                        <>
                          <th className="py-3 px-4 font-semibold">Product & SKU</th>
                          <th className="py-3 px-4 font-semibold">Category</th>
                          <th className="py-3 px-4 font-semibold">Warehouse</th>
                          <th className="py-3 px-4 font-semibold text-center">Stock Quantity</th>
                          <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                          <th className="py-3 px-4 font-semibold text-right">Selling Price</th>
                          <th className="py-3 px-4 font-semibold text-right">Valuation</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.records.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        {activeTab === 'sales' && (
                          <>
                            <td className="py-3 px-4 font-mono font-bold">{r.invoice_number}</td>
                            <td className="py-3 px-4 text-slate-500">{r.sale_date}</td>
                            <td className="py-3 px-4 font-medium">{r.customer_name}</td>
                            <td className="py-3 px-4 text-slate-500">{r.warehouse_name}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                              {formatMoney(r.total_amount)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">
                              {formatMoney(r.profit)}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{r.payment_method}</td>
                          </>
                        )}
                        {activeTab === 'purchases' && (
                          <>
                            <td className="py-3 px-4 font-mono font-bold">{r.po_number}</td>
                            <td className="py-3 px-4 text-slate-500">{r.purchase_date}</td>
                            <td className="py-3 px-4 font-medium">{r.supplier_name}</td>
                            <td className="py-3 px-4 text-slate-500">{r.warehouse_name}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                              {formatMoney(r.total_amount)}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600">{formatMoney(r.paid_amount)}</td>
                            <td className="py-3 px-4 text-center font-medium">{r.purchase_status}</td>
                          </>
                        )}
                        {activeTab === 'inventory' && (
                          <>
                            <td className="py-3 px-4 font-medium">{r.product_name} ({r.sku})</td>
                            <td className="py-3 px-4 text-slate-500">{r.category}</td>
                            <td className="py-3 px-4 text-slate-500">{r.warehouse}</td>
                            <td className="py-3 px-4 text-center font-bold">{r.current_stock}</td>
                            <td className="py-3 px-4 text-right">${r.cost_price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">${r.selling_price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                              {formatMoney(r.inventory_value)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
