import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Boxes,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  Plus,
  ArrowUpRight,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { apiClient } from '../../api/client';
import { DashboardData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<DashboardData>('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-400">Loading analytics & stock data...</p>
      </div>
    );
  }

  const { kpis, sales_trend, top_products, category_breakdown, recent_transactions } = data;

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('nav_dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time business performance overview for <strong className="text-slate-700 dark:text-slate-200">Khmer Style Fashion</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/pos')}
            className="px-3.5 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs rounded-xl shadow-xs shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>POS Checkout</span>
          </button>
          <button
            onClick={() => navigate('/purchases')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs shadow-blue-500/20 flex items-center space-x-1.5 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>New Purchase Order</span>
          </button>
          <button
            onClick={() => navigate('/products')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('kpi_total_sales')}
          value={formatMoney(kpis.total_sales)}
          subtitle={`Gross Profit: ${formatMoney(kpis.gross_profit)} (${kpis.gross_margin_percent}%)`}
          icon={<DollarSign className="w-5 h-5" />}
          colorScheme="blue"
        />

        <StatCard
          title={t('kpi_net_profit')}
          value={formatMoney(kpis.net_profit)}
          subtitle={`Operating Expenses: ${formatMoney(kpis.operating_expenses)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          colorScheme="emerald"
        />

        <StatCard
          title={t('kpi_inventory_value')}
          value={formatMoney(kpis.inventory_value)}
          subtitle={`${kpis.total_products_count} active product types`}
          icon={<Boxes className="w-5 h-5" />}
          colorScheme="purple"
        />

        <StatCard
          title={t('kpi_low_stock')}
          value={kpis.low_stock_count}
          subtitle={`${kpis.out_of_stock_count} out of stock`}
          icon={<AlertTriangle className="w-5 h-5" />}
          colorScheme={kpis.low_stock_count > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Secondary Quick Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-0">
          <p className="text-[11px] text-slate-400 uppercase font-medium">{t('kpi_total_purchases')}</p>
          <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatMoney(kpis.total_purchases)}</p>
        </div>
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-0">
          <p className="text-[11px] text-slate-400 uppercase font-medium">{t('kpi_pending_po')}</p>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{kpis.pending_po_count} orders</p>
        </div>
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-0">
          <p className="text-[11px] text-slate-400 uppercase font-medium">{t('kpi_receivables')}</p>
          <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">{formatMoney(kpis.receivables_amount)}</p>
        </div>
        <div className="p-2 last:border-0">
          <p className="text-[11px] text-slate-400 uppercase font-medium">{t('kpi_payables')}</p>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(kpis.payables_amount)}</p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('chart_sales_trend')}
              </h3>
              <p className="text-xs text-slate-400">Comparing Daily Sales vs Profit performance</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="sales" name="Sales ($)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name="Profit ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('chart_category_breakdown')}
            </h3>
            <p className="text-xs text-slate-400">Share of revenue by merchandise category</p>
          </div>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={category_breakdown}
                  dataKey="sales_amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {category_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Items List */}
          <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
            {category_breakdown.map((cat, idx) => (
              <div key={cat.category_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {language === 'kh' && cat.khmer_name ? cat.khmer_name : cat.name}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white shrink-0 ml-2">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('chart_top_products')}
            </h3>
            <button
              onClick={() => navigate('/products')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {top_products.map((item, idx) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[11px]">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {language === 'kh' && item.khmer_name ? item.khmer_name : item.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{formatMoney(item.revenue)}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">+{item.quantity_sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('recent_transactions')}
            </h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent_transactions.map((txn) => (
              <div key={`${txn.type}-${txn.id}`} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {txn.transaction_number}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      txn.type === 'Sale' ? 'bg-emerald-100 text-emerald-700' :
                      txn.type === 'Purchase' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {txn.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {txn.party_name} • {new Date(txn.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {formatMoney(txn.amount)}
                  </p>
                  <div className="mt-1">
                    <Badge status={txn.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
