import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, DollarSign, Building } from 'lucide-react';
import { apiClient } from '../../api/client';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'Khmer Style Fashion',
    default_currency: 'USD',
    exchange_rate_khr: '4100',
    khqr_merchant_name: 'KHMER STYLE FASHION CO LTD',
    khqr_account_id: 'khmerstyle@aba',
    business_phone: '+855 23 888 999',
    business_address: 'Building 45, Street 271, Phnom Penh, Cambodia',
    tax_rate_percent: '10'
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get<Array<{ key: string; value: string }>>('/settings');
      if (res.data.length > 0) {
        const map: Record<string, string> = { ...settings };
        res.data.forEach((s) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      }
    } catch {
      // ignore
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      for (const [k, v] of Object.entries(settings)) {
        await apiClient.put(`/settings/${k}`, { value: v });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <span>System Settings & Cambodian Localization</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business profile, Bakong KHQR merchant identifiers, and USD/KHR exchange rates
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Card 1: Business Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Store & Business Profile</span>
            </h3>
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-2.5 py-1">
              <img src="/inventory.png" alt="System Logo" className="w-6 h-6 object-contain" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Official Brand Logo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1">Business Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Hotline Phone</label>
              <input
                type="text"
                value={settings.business_phone}
                onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Business Address</label>
              <input
                type="text"
                value={settings.business_address}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Currency & KHQR */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Currency & Bakong KHQR Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1">Exchange Rate (៛ KHR per 1 USD)</label>
              <input
                type="number"
                value={settings.exchange_rate_khr}
                onChange={(e) => setSettings({ ...settings, exchange_rate_khr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-red-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard market rate in Cambodia (approx 4,100 KHR)</span>
            </div>

            <div>
              <label className="block font-medium mb-1">Standard VAT Tax Rate (%)</label>
              <input
                type="number"
                value={settings.tax_rate_percent}
                onChange={(e) => setSettings({ ...settings, tax_rate_percent: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Bakong KHQR Merchant Name</label>
              <input
                type="text"
                value={settings.khqr_merchant_name}
                onChange={(e) => setSettings({ ...settings, khqr_merchant_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border uppercase"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Bakong Merchant Account ID</label>
              <input
                type="text"
                value={settings.khqr_account_id}
                onChange={(e) => setSettings({ ...settings, khqr_account_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
