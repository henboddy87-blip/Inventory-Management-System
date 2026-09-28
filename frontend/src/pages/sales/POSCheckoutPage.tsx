import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  CreditCard, DollarSign, QrCode, Building2, User,
  CheckCircle2, Printer, Sparkles
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Product, Customer, Warehouse, Sale } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { KHQRModal } from '../../components/common/KHQRModal';
import { InvoiceModal } from '../../components/common/InvoiceModal';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

export const POSCheckoutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney, exchangeRate } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'KHQR' | 'Bank Transfer' | 'Card'>('Cash');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isKHQROpen, setIsKHQROpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [pRes, cRes, wRes, catRes] = await Promise.all([
        apiClient.get('/products?limit=100'),
        apiClient.get<Customer[]>('/customers'),
        apiClient.get<Warehouse[]>('/warehouses'),
        apiClient.get('/categories/all')
      ]);
      setProducts(pRes.data.items);
      setCustomers(cRes.data);
      setWarehouses(wRes.data);
      setCategories(catRes.data);
      if (wRes.data.length > 0) setSelectedWarehouseId(wRes.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product, quantity: 1, unit_price: product.selling_price, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price) - curr.discount, 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount);
  const totalKHR = Math.round(grandTotal * exchangeRate);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (paymentMethod === 'KHQR') {
      setIsKHQROpen(true);
    } else {
      processSaleTransaction();
    }
  };

  const processSaleTransaction = async (khqrRef?: string) => {
    setLoading(true);
    try {
      const payload = {
        customer_id: selectedCustomerId,
        warehouse_id: selectedWarehouseId,
        discount_amount: Number(overallDiscount),
        tax_amount: 0.0,
        paid_amount: grandTotal,
        payment_method: paymentMethod,
        khqr_reference: khqrRef || undefined,
        items: cart.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount
        }))
      };

      const res = await apiClient.post<Sale>('/sales', payload);
      setCompletedSale(res.data);
      clearCart();
      setIsKHQROpen(false);
      setIsInvoiceOpen(true);
      loadInitialData(); // Refresh product inventory counts
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.khmer_name && p.khmer_name.includes(search)) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    const matchesCat = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left: Product Catalog Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 overflow-hidden">
        {/* Top Controls: Search & Category Pills */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan barcode or type name/SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
              />
            </div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(String(c.id))}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === String(c.id)
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {language === 'kh' && c.khmer_name ? c.khmer_name : c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const inStock = (p.total_stock || 0) > 0;
              return (
                <button
                  key={p.id}
                  disabled={!inStock}
                  onClick={() => inStock && addToCart(p)}
                  className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    inStock
                      ? 'bg-slate-50/50 hover:bg-blue-50/40 dark:bg-slate-800/40 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 hover:shadow-xs cursor-pointer'
                      : 'opacity-50 bg-slate-100 dark:bg-slate-900 border-dashed cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        {p.sku}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {inStock ? `${p.total_stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-2">
                      {p.name}
                    </h4>
                    {p.khmer_name && (
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-1 mt-0.5">
                        {p.khmer_name}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      ${p.selling_price.toFixed(2)}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout Panel */}
      <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col">
        {/* Customer Selector */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Customer (អតិថិជន)
          </label>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
          >
            <option value="">Walk-in Customer (អតិថិជនទូទៅ)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.khmer_name ? `(${c.khmer_name})` : ''} - {c.customer_type}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span>Order Cart ({cart.length})</span>
          </span>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-[11px] text-rose-500 hover:underline">
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-10">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <p>No items in cart</p>
              <p className="text-[10px] text-slate-500">Tap items on the left to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">${item.unit_price.toFixed(2)} each</p>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Methods Selector */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Payment Method (វិធីសាស្ត្រទូទាត់)
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={`p-2 rounded-xl border flex items-center space-x-2 font-medium transition-all ${
                paymentMethod === 'Cash'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('KHQR')}
              className={`p-2 rounded-xl border flex items-center space-x-2 font-medium transition-all ${
                paymentMethod === 'KHQR'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400 font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <QrCode className="w-4 h-4 text-red-500" />
              <span>Bakong KHQR</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Bank Transfer')}
              className={`p-2 rounded-xl border flex items-center space-x-2 font-medium transition-all ${
                paymentMethod === 'Bank Transfer'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>Bank Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Card')}
              className={`p-2 rounded-xl border flex items-center space-x-2 font-medium transition-all ${
                paymentMethod === 'Card'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span>Card</span>
            </button>
          </div>
        </div>

        {/* Totals & Checkout Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 items-center">
            <span>Discount ($):</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={overallDiscount}
              onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border rounded text-right font-medium"
            />
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-1">
            <span>Total USD:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-red-600 dark:text-red-400">
            <span>Total Riel (៛):</span>
            <span>៛{totalKHR.toLocaleString('en-US')}</span>
          </div>

          <button
            type="button"
            disabled={loading || cart.length === 0}
            onClick={handleCheckout}
            className="w-full mt-3 py-3 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Checkout ({formatMoney(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* Bakong KHQR Modal */}
      <KHQRModal
        isOpen={isKHQROpen}
        onClose={() => setIsKHQROpen(false)}
        onConfirmPayment={(ref) => processSaleTransaction(ref)}
        amountUSD={grandTotal}
        invoiceNumber={`INV-${Date.now().toString().slice(-6)}`}
      />

      {/* Invoice Modal after checkout */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={completedSale}
      />
    </div>
  );
};
