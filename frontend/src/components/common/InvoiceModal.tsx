import React from 'react';
import { Modal } from './Modal';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import { Sale } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Badge } from './Badge';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const { exchangeRate } = useCurrency();

  if (!sale) return null;

  const totalKHR = Math.round(sale.total_amount * exchangeRate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tax Invoice: ${sale.invoice_number}`} maxWidth="2xl">
      <div className="printable-invoice text-slate-800 dark:text-slate-200">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-start space-x-3.5">
            <img
              src="/inventory.png"
              alt="Company Logo"
              className="w-12 h-12 object-contain rounded-xl p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Khmer Style Fashion
              </h2>
              <p className="text-xs text-slate-500 font-sans">ខេមរា ស្ទីល ហ្វេសសិន (កម្ពុជា)</p>
              <p className="text-xs text-slate-500 mt-1">Building 45, Street 271, Phnom Penh, Cambodia</p>
              <p className="text-xs text-slate-500">Tel: +855 23 888 999 | Tax ID: K001-9018239</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
              Commercial Invoice
            </span>
            <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
              {sale.invoice_number}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Date: {new Date(sale.sale_date).toLocaleDateString()}
            </p>
            <div className="mt-2">
              <Badge status={sale.payment_status} />
            </div>
          </div>
        </div>

        {/* Customer & Warehouse Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <p className="text-slate-400 uppercase font-medium">Billed To (អតិថិជន):</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {sale.customer_name || 'Walk-in Customer'}
            </p>
            {sale.customer_phone && <p className="text-slate-500">Tel: {sale.customer_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-slate-400 uppercase font-medium">Fulfilled From (ឃ្លាំង):</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{sale.warehouse_name}</p>
            <p className="text-slate-500">Cashier: {sale.salesperson_name}</p>
            <p className="text-slate-500">Method: {sale.payment_method}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs my-4 border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-medium">
              <th className="py-2.5 px-3">Item & Description</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Discount</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sale.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5 px-3">
                  <p className="font-medium text-slate-900 dark:text-white">{it.product_name}</p>
                  {it.product_khmer_name && (
                    <p className="text-[11px] text-slate-400">{it.product_khmer_name}</p>
                  )}
                  <p className="text-[10px] font-mono text-slate-400">
                    SKU: {it.sku} {it.variant_label ? `(${it.variant_label})` : ''}
                  </p>
                </td>
                <td className="py-2.5 px-3 text-center font-semibold">{it.quantity}</td>
                <td className="py-2.5 px-3 text-right">${it.unit_price.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-rose-500">
                  {it.discount > 0 ? `-$${it.discount.toFixed(2)}` : '$0.00'}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-white">
                  ${it.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">${sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-${sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold text-slate-900 dark:text-white">
              <span>Total (USD):</span>
              <span>${sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-600 dark:text-red-400">
              <span>Total (KHR ៛):</span>
              <span>៛{totalKHR.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
              <span>Paid:</span>
              <span className="font-semibold text-emerald-600">${sale.paid_amount.toFixed(2)}</span>
            </div>
            {sale.due_amount > 0 && (
              <div className="flex justify-between text-amber-600 font-semibold text-[11px]">
                <span>Balance Due:</span>
                <span>${sale.due_amount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-400">
          <p>អរគុណចំពោះការគាំទ្រផលិតផលខ្មែរ! Thank you for supporting local business!</p>
          <p className="mt-0.5">Goods sold can be returned or exchanged within 7 days with valid invoice.</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
