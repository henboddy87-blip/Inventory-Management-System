import React, { useState, useEffect } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Supplier } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Modal } from '../../components/common/Modal';

export const SuppliersPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [khmerName, setKhmerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('Phnom Penh');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [taxId, setTaxId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const CAMBODIA_PROVINCES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Kandal', 'Preah Sihanouk',
    'Kampot', 'Kampong Cham', 'Kampong Chhnang', 'Kampong Speu', 'Kampong Thom'
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Supplier[]>('/suppliers');
      setSuppliers(res.data);
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
        company_name: companyName,
        khmer_company_name: khmerName,
        contact_person: contactPerson,
        phone,
        email: email || undefined,
        address,
        province,
        payment_terms: paymentTerms,
        tax_id: taxId
      };
      if (editingId) {
        await apiClient.put(`/suppliers/${editingId}`, payload);
      } else {
        await apiClient.post('/suppliers', payload);
      }
      setIsOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving supplier');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <span>Suppliers Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vendor profiles, Cambodian tax references, contact channels, and purchase history
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setCompanyName('');
            setKhmerName('');
            setContactPerson('');
            setPhone('');
            setEmail('');
            setAddress('');
            setProvince('Phnom Penh');
            setPaymentTerms('Net 30');
            setTaxId('');
            setIsOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.company_name}</h3>
                  {s.khmer_company_name && (
                    <p className="text-xs text-slate-400 font-sans mt-0.5">{s.khmer_company_name}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                  {s.payment_terms || 'Net 30'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 my-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{s.phone} {s.contact_person ? `(${s.contact_person})` : ''}</span>
                </div>
                {s.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{s.address || s.province}</span>
                </div>
                {s.tax_id && (
                  <p className="text-[10px] text-slate-400 font-mono">Tax ID: {s.tax_id}</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Purchased</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {formatMoney(s.total_purchases_amount || 0)} ({s.total_purchases_count || 0} POs)
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingId(s.id);
                  setCompanyName(s.company_name);
                  setKhmerName(s.khmer_company_name || '');
                  setContactPerson(s.contact_person || '');
                  setPhone(s.phone);
                  setEmail(s.email || '');
                  setAddress(s.address || '');
                  setProvince(s.province);
                  setPaymentTerms(s.payment_terms || 'Net 30');
                  setTaxId(s.tax_id || '');
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingId ? 'Edit Supplier' : 'Add Supplier'} maxWidth="md">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Khmer Company Name</label>
            <input
              type="text"
              value={khmerName}
              onChange={(e) => setKhmerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
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
            <label className="block font-medium mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Tax ID / VAT #</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
