import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Pages
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { WarehousesPage } from './pages/warehouses/WarehousesPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { StockMovementsPage } from './pages/inventory/StockMovementsPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { POSCheckoutPage } from './pages/sales/POSCheckoutPage';
import { SalesPage } from './pages/sales/SalesPage';
import { SuppliersPage } from './pages/partners/SuppliersPage';
import { CustomersPage } from './pages/partners/CustomersPage';
import { ExpensesPage } from './pages/finance/ExpensesPage';
import { PaymentsPage } from './pages/finance/PaymentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/users/UsersPage';
import { AuditLogsPage } from './pages/system/AuditLogsPage';
import { SettingsPage } from './pages/system/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Route */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected Application Routes */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/warehouses" element={<WarehousesPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/inventory/movements" element={<StockMovementsPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/pos" element={<POSCheckoutPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
