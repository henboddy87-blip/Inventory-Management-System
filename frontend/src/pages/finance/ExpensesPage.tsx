import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Expense, ExpenseCategory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Modal } from '../../components/common/Modal';

export const ExpensesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    loadCategories();
    fetchExpenses();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get<ExpenseCategory[]>('/finance/categories');
      setCategories(res.data);
      if (res.data.length > 0) setCategoryId(res.data[0].id);
    } catch {
      // ignore
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Expense[]>('/finance/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/finance/expenses', {
        category_id: categoryId,
        amount: Number(amount),
        description,
        payment_method: paymentMethod
      });
      setIsOpen(false);
      setAmount(0);
      setDescription('');
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record expense');
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>{t('nav_expenses')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store operations, rent, utilities, staff salaries, marketing, and operational cost accounting
          </p>
        </div>

        <button
          onClick={() => {
            setAmount(0);
            setDescription('');
            setPaymentMethod('Cash');
            setIsOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Total Operating Expenses</p>
          <h2 className="text-2xl font-black mt-0.5">{formatMoney(totalExpense)}</h2>
        </div>
        <div className="text-xs text-blue-100 text-right">
          <p>{expenses.length} expense transactions recorded</p>
          <p className="opacity-80">Categorized for Net Profit calculations</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Expense Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Payment Method</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No expenses recorded yet.</td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(e.expense_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {language === 'kh' && e.category_khmer_name ? e.category_khmer_name : e.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {e.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {e.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {e.user_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Operational Expense" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Expense Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.khmer_name ? `(${c.khmer_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-base font-bold text-rose-600"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description / Memo *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Electric bill for store AC"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="KHQR">Bakong KHQR</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
