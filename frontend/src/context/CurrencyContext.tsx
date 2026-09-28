import React, { createContext, useContext, useState } from 'react';

export type Currency = 'USD' | 'KHR';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (c: Currency) => void;
  formatMoney: (amountInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('sme_currency') as Currency) || 'USD';
  });
  const [exchangeRate] = useState<number>(4100); // 4,100 KHR per 1 USD

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('sme_currency', c);
  };

  const formatMoney = (amountInUSD: number): string => {
    if (isNaN(amountInUSD) || amountInUSD === null || amountInUSD === undefined) {
      return currency === 'USD' ? '$0.00' : '៛0';
    }

    if (currency === 'KHR') {
      const khrAmount = Math.round(amountInUSD * exchangeRate);
      return `៛${khrAmount.toLocaleString('en-US')}`;
    } else {
      return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, setCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
