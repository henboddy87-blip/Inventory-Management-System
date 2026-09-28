import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Boxes,
  ArrowLeftRight,
  Truck,
  ShoppingCart,
  Users,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  History,
  Settings,
  ChevronDown,
  ShoppingBag,
  Receipt,
  UserCheck,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const isSuperAdminOrAdmin = user?.role?.name === 'super_admin' || user?.role?.name === 'admin';

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    inventory: true,
    purchasing: true,
    sales: true,
    finance: true,
    reports: true,
    admin: isSuperAdminOrAdmin
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
    }`;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto w-64 sm:w-72 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-screen transition-transform duration-300 ease-in-out select-none shadow-2xl lg:shadow-none shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0 group">
            <img
              src="/inventory.png"
              alt="SME Inventory Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              Khmer Style POS
            </h1>
            <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase block truncate mt-0.5">
              {language === 'kh' ? 'សហគ្រាសកម្ពុជា' : 'SME Edition'}
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) {
            handleNavClick();
          }
        }}
      >
        {/* Main Dashboard */}
        <div>
          <NavLink to="/" className={linkClass} end>
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('nav_dashboard')}</span>
          </NavLink>
        </div>

        {/* Group: Inventory */}
        <div>
          <button
            onClick={() => toggleGroup('inventory')}
            className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
          >
            <span>{t('nav_inventory_group')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.inventory ? 'rotate-180' : ''}`} />
          </button>
          {expandedGroups.inventory && (
            <div className="space-y-1">
              <NavLink to="/products" className={linkClass}>
                <Package className="w-4 h-4" />
                <span>{t('nav_products')}</span>
              </NavLink>
              <NavLink to="/categories" className={linkClass}>
                <Layers className="w-4 h-4" />
                <span>{t('nav_categories')}</span>
              </NavLink>
              <NavLink to="/warehouses" className={linkClass}>
                <Warehouse className="w-4 h-4" />
                <span>{t('nav_warehouses')}</span>
              </NavLink>
              <NavLink to="/inventory" className={linkClass} end>
                <Boxes className="w-4 h-4" />
                <span>{t('nav_stocks')}</span>
              </NavLink>
              <NavLink to="/inventory/movements" className={linkClass}>
                <History className="w-4 h-4" />
                <span>{t('nav_movements')}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Group: Purchasing */}
        <div>
          <button
            onClick={() => toggleGroup('purchasing')}
            className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
          >
            <span>{t('nav_purchasing_group')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.purchasing ? 'rotate-180' : ''}`} />
          </button>
          {expandedGroups.purchasing && (
            <div className="space-y-1">
              <NavLink to="/suppliers" className={linkClass}>
                <Truck className="w-4 h-4" />
                <span>{t('nav_suppliers')}</span>
              </NavLink>
              <NavLink to="/purchases" className={linkClass}>
                <ShoppingBag className="w-4 h-4" />
                <span>{t('nav_purchases')}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Group: Sales & Orders */}
        <div>
          <button
            onClick={() => toggleGroup('sales')}
            className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
          >
            <span>{t('nav_sales_group')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.sales ? 'rotate-180' : ''}`} />
          </button>
          {expandedGroups.sales && (
            <div className="space-y-1">
              <NavLink to="/pos" className={linkClass}>
                <ShoppingCart className="w-4 h-4" />
                <span className="flex-1">{t('nav_pos')}</span>
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                  LIVE
                </span>
              </NavLink>
              <NavLink to="/sales" className={linkClass}>
                <Receipt className="w-4 h-4" />
                <span>{t('nav_sales')}</span>
              </NavLink>
              <NavLink to="/customers" className={linkClass}>
                <Users className="w-4 h-4" />
                <span>{t('nav_customers')}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Group: Finance */}
        <div>
          <button
            onClick={() => toggleGroup('finance')}
            className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
          >
            <span>{t('nav_finance_group')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.finance ? 'rotate-180' : ''}`} />
          </button>
          {expandedGroups.finance && (
            <div className="space-y-1">
              <NavLink to="/expenses" className={linkClass}>
                <CreditCard className="w-4 h-4" />
                <span>{t('nav_expenses')}</span>
              </NavLink>
              <NavLink to="/payments" className={linkClass}>
                <ArrowLeftRight className="w-4 h-4" />
                <span>{t('nav_payments')}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Group: Reports & Analytics */}
        <div>
          <button
            onClick={() => toggleGroup('reports')}
            className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
          >
            <span>{t('nav_reports_group')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.reports ? 'rotate-180' : ''}`} />
          </button>
          {expandedGroups.reports && (
            <div className="space-y-1">
              <NavLink to="/reports" className={linkClass}>
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t('nav_reports')}</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Group: Administration */}
        {isSuperAdminOrAdmin && (
          <div>
            <button
              onClick={() => toggleGroup('admin')}
              className="w-full flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-2"
            >
              <span>{t('nav_admin_group')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedGroups.admin ? 'rotate-180' : ''}`} />
            </button>
            {expandedGroups.admin && (
              <div className="space-y-1">
                <NavLink to="/users" className={linkClass}>
                  <UserCheck className="w-4 h-4" />
                  <span>{t('nav_users')}</span>
                </NavLink>
                <NavLink to="/audit-logs" className={linkClass}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('nav_audit')}</span>
                </NavLink>
                <NavLink to="/settings" className={linkClass}>
                  <Settings className="w-4 h-4" />
                  <span>{t('nav_settings')}</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Status Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Khmer Style Fashion</span>
            <span className="block text-[10px]">Phnom Penh, Cambodia</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
