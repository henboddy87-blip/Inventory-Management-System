import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Search, DollarSign, Calendar } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Payment } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export const PaymentsPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Payment[]>('/finance/payments');
      setPayments(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(p =>
    p.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.notes && p.notes.toLowerCase().includes(search.toLowerCase())) ||
    p.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            <span>Payments Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cash inflows and disbursements audit trail across sales, supplier POs, and operating costs
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">Payment Date</th>
                <th className="py-3 px-4 font-semibold font-mono">Reference #</th>
                <th className="py-3 px-4 font-semibold">Transaction Flow</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4 font-semibold text-right">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading payment ledger...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isInflow = p.transaction_type === 'Sale';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {p.reference_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isInflow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isInflow ? '↑ Customer Inflow (Sale)' : '↓ Outflow (' + p.transaction_type + ')'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {p.payment_method}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span className={isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                          {isInflow ? `+${formatMoney(p.amount)}` : `-${formatMoney(p.amount)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {p.recorded_by_name}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
