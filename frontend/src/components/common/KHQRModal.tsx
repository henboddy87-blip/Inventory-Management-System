import React from 'react';
import { Modal } from './Modal';
import { QrCode, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface KHQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (reference: string) => void;
  amountUSD: number;
  invoiceNumber: string;
}

export const KHQRModal: React.FC<KHQRModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  amountUSD,
  invoiceNumber
}) => {
  const { exchangeRate } = useCurrency();
  const amountKHR = Math.round(amountUSD * exchangeRate);
  const khqrRef = `KHQR-${Date.now().toString().slice(-8)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bakong KHQR Payment (បាគង)" maxWidth="md">
      <div className="flex flex-col items-center text-center">
        {/* Bakong KHQR Badge */}
        <div className="w-full bg-linear-to-r from-red-600 to-rose-700 text-white rounded-xl p-3 shadow-md mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black tracking-tighter">
              KH
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-100">National Bank of Cambodia</p>
              <p className="text-sm font-bold">KHQR Standard</p>
            </div>
          </div>
          <ShieldCheck className="w-6 h-6 text-white/80" />
        </div>

        {/* Merchant & Invoice Details */}
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Merchant: <strong className="text-slate-800 dark:text-white">Khmer Style Fashion Co., Ltd.</strong>
        </div>
        <div className="text-xs font-mono text-slate-400 mb-4">
          Invoice Ref: {invoiceNumber}
        </div>

        {/* Stylized QR Code Container */}
        <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 flex flex-col items-center">
          <div className="relative w-48 h-48 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white">
            {/* SVG Bakong QR Mockup */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
              <rect x="5" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
              <rect x="12" y="12" width="11" height="11" fill="white" />
              <rect x="70" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
              <rect x="77" y="12" width="11" height="11" fill="white" />
              <rect x="5" y="70" width="25" height="25" fill="none" stroke="white" strokeWidth="6" />
              <rect x="12" y="77" width="11" height="11" fill="white" />
              {/* Data modules */}
              <circle cx="45" cy="15" r="3" />
              <circle cx="55" cy="15" r="3" />
              <circle cx="45" cy="25" r="3" />
              <circle cx="55" cy="25" r="3" />
              <circle cx="15" cy="45" r="3" />
              <circle cx="25" cy="45" r="3" />
              <circle cx="15" cy="55" r="3" />
              <circle cx="25" cy="55" r="3" />
              <circle cx="40" cy="40" r="4" fill="#ef4444" />
              <circle cx="60" cy="40" r="4" fill="#ef4444" />
              <circle cx="40" cy="60" r="4" fill="#ef4444" />
              <circle cx="60" cy="60" r="4" fill="#ef4444" />
              <circle cx="50" cy="50" r="5" fill="#f59e0b" />
              <circle cx="80" cy="50" r="3" />
              <circle cx="70" cy="65" r="3" />
              <circle cx="85" cy="75" r="3" />
              <circle cx="70" cy="85" r="3" />
              <circle cx="85" cy="85" r="3" />
              <circle cx="45" cy="75" r="3" />
              <circle cx="55" cy="85" r="3" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                KHQR
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Scan with ABA, Wing, Acleda, or any Bakong App</p>
        </div>

        {/* Dual Currency Display */}
        <div className="mt-4 grid grid-cols-2 gap-3 w-full">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 block">Amount in USD</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              ${amountUSD.toFixed(2)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 block">Amount in Riel (៛)</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400">
              ៛{amountKHR.toLocaleString('en-US')}
            </span>
          </div>
        </div>

        {/* Confirm Action */}
        <div className="mt-6 flex items-center space-x-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmPayment(khqrRef)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Payment</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
