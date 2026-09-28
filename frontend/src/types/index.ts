export type RoleName = 'super_admin' | 'admin' | 'manager' | 'staff' | 'accountant';

export interface Role {
  id: number;
  name: RoleName;
  display_name: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  role_id: number;
  role: Role;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  khmer_name?: string;
  description?: string;
  parent_id?: number | null;
  status: boolean;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  khmer_name?: string;
  description?: string;
  logo?: string;
  status: boolean;
}

export interface Unit {
  id: number;
  name: string;
  symbol: string;
  khmer_name?: string;
  is_default: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  khmer_name?: string;
  location: string;
  province: string;
  phone?: string;
  manager_name?: string;
  is_default: boolean;
  status: boolean;
  total_products?: number;
  total_quantity?: number;
  inventory_value?: number;
}

export interface ProductVariant {
  id?: number;
  product_id?: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  cost_price?: number;
  selling_price?: number;
  status?: boolean;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  khmer_name?: string;
  description?: string;
  category_id: number;
  category?: Category;
  brand_id?: number;
  brand?: Brand;
  unit_id?: number;
  unit?: Unit;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  min_stock: number;
  max_stock?: number;
  image_url?: string;
  has_variants: boolean;
  status: boolean;
  is_deleted: boolean;
  variants?: ProductVariant[];
  total_stock?: number;
  stock_status?: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
}

export interface WarehouseStockItem {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  product_id: number;
  product_name: string;
  product_khmer_name?: string;
  sku: string;
  barcode?: string;
  variant_id?: number;
  variant_size?: string;
  variant_color?: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  cost_price: number;
  selling_price: number;
  inventory_value: number;
  stock_status: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  variant_id?: number;
  variant_label?: string;
  warehouse_id: number;
  warehouse_name: string;
  movement_type: string;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  reference_number?: string;
  user_name?: string;
  movement_date: string;
  note?: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  source_warehouse_id: number;
  source_warehouse_name: string;
  destination_warehouse_id: number;
  destination_warehouse_name: string;
  transfer_date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  notes?: string;
  created_by_name: string;
  approved_by_name?: string;
  created_at: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    variant_id?: number;
    variant_label?: string;
    quantity: number;
  }>;
}

export interface Supplier {
  id: number;
  company_name: string;
  khmer_company_name?: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  province: string;
  tax_id?: string;
  payment_terms?: string;
  notes?: string;
  status: boolean;
  total_purchases_count?: number;
  total_purchases_amount?: number;
}

export interface Customer {
  id: number;
  name: string;
  khmer_name?: string;
  phone: string;
  email?: string;
  address?: string;
  province: string;
  customer_type: 'Retail' | 'Wholesale' | 'VIP' | 'Business';
  credit_limit: number;
  current_credit: number;
  notes?: string;
  status: boolean;
  total_sales_count?: number;
  total_sales_amount?: number;
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  variant_id?: number;
  variant_label?: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  discount: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  warehouse_id: number;
  warehouse_name: string;
  purchase_date: string;
  expected_date?: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_cost: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid';
  purchase_status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  notes?: string;
  created_by_name: string;
  created_at: string;
  items: PurchaseItem[];
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_khmer_name?: string;
  sku: string;
  variant_id?: number;
  variant_label?: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount: number;
  subtotal: number;
  profit: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  warehouse_id: number;
  warehouse_name: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'KHQR' | 'Card' | 'Other';
  payment_status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Refunded';
  status: 'Completed' | 'Returned' | 'Cancelled';
  khqr_reference?: string;
  notes?: string;
  salesperson_name: string;
  created_at: string;
  items: SaleItem[];
}

export interface ExpenseCategory {
  id: number;
  name: string;
  khmer_name?: string;
  description?: string;
}

export interface Expense {
  id: number;
  category_id: number;
  category_name: string;
  category_khmer_name?: string;
  amount: number;
  description: string;
  payment_method: string;
  expense_date: string;
  receipt_url?: string;
  user_name: string;
  created_at: string;
}

export interface Payment {
  id: number;
  transaction_type: 'Sale' | 'Purchase' | 'Expense';
  reference_id: number;
  reference_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  notes?: string;
  recorded_by_name: string;
  created_at: string;
}

export interface DashboardData {
  kpis: {
    total_sales: number;
    total_purchases: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    operating_expenses: number;
    net_profit: number;
    net_margin_percent: number;
    inventory_value: number;
    total_products_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    pending_po_count: number;
    receivables_amount: number;
    payables_amount: number;
  };
  sales_trend: Array<{
    date: string;
    sales: number;
    purchases: number;
    profit: number;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    khmer_name?: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
  }>;
  category_breakdown: Array<{
    category_id: number;
    name: string;
    khmer_name?: string;
    sales_amount: number;
    percentage: number;
  }>;
  recent_transactions: Array<{
    id: number;
    transaction_number: string;
    type: 'Sale' | 'Purchase' | 'Expense';
    party_name: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

export interface Notification {
  id: number;
  title: string;
  khmer_title?: string;
  message: string;
  khmer_message?: string;
  notification_type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  ip_address?: string;
  description: string;
  timestamp: string;
}
