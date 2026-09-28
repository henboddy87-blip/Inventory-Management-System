import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, MapPin, Edit2, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Customer } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Modal } from '../../components/common/Modal';

export const CustomersPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [khmerName, setKhmerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('Phnom Penh');
  const [customerType, setCustomerType] = useState<'Retail' | 'Wholesale' | 'VIP' | 'Business'>('Retail');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const CAMBODIA_PROVINCES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Kandal', 'Preah Sihanouk',
    'Kampot', 'Kampong Cham', 'Kampong Chhnang', 'Kampong Speu', 'Kampong Thom'
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Customer[]>('/customers');
      setCustomers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        khmer_name: khmerName,
        phone,
        email: email || undefined,
        address,
        province,
        customer_type: customerType,
        credit_limit: Number(creditLimit)
      };
      if (editingId) {
        await apiClient.put(`/customers/${editingId}`, payload);
      } else {
        await apiClient.post('/customers', payload);
      }
      setIsOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Customer Profiles & Credit Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Retail buyers, wholesale clients, VIP members, and accounts receivable credit limits
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setName('');
            setKhmerName('');
            setPhone('');
            setEmail('');
            setAddress('');
            setProvince('Phnom Penh');
            setCustomerType('Retail');
            setCreditLimit(0);
            setIsOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {customers.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h3>
                  {c.khmer_name && (
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{c.khmer_name}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  c.customer_type === 'Wholesale' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  c.customer_type === 'VIP' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  c.customer_type === 'Business' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {c.customer_type}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 my-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.address || c.province}</span>
                </div>
              </div>

              {/* Credit Status */}
              {c.current_credit > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2 mb-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">Unpaid Credit: {formatMoney(c.current_credit)}</span>
                    <span className="text-[10px] block opacity-80">Credit limit: {formatMoney(c.credit_limit)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Lifetime Sales</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {formatMoney(c.total_sales_amount || 0)} ({c.total_sales_count || 0} orders)
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingId(c.id);
                  setName(c.name);
                  setKhmerName(c.khmer_name || '');
                  setPhone(c.phone);
                  setEmail(c.email || '');
                  setAddress(c.address || '');
                  setProvince(c.province);
                  setCustomerType(c.customer_type);
                  setCreditLimit(c.credit_limit);
                  setIsOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Customer' : 'Add Customer'} maxWidth="md">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Sokha Chan"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Khmer Name (ឈ្មោះជាភាសាខ្មែរ)</label>
            <input
              type="text"
              value={khmerName}
              onChange={(e) => setKhmerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="ឧ. ចាន់ សុខា"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                placeholder="+855 12 345 678"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Customer Type</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="VIP">VIP</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Province *</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                {CAMBODIA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Credit Limit ($)</label>
            <input
              type="number"
              step="50"
              min="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
