import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, Plus, Phone, MapPin, User, Boxes, DollarSign } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Warehouse } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Modal } from '../../components/common/Modal';

export const WarehousesPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [khmerName, setKhmerName] = useState('');
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('Phnom Penh');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const CAMBODIA_PROVINCES = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Kandal', 'Preah Sihanouk',
    'Kampot', 'Kampong Cham', 'Kampong Chhnang', 'Kampong Speu', 'Kampong Thom',
    'Kep', 'Koh Kong', 'Kratie', 'Mondulkiri', 'Odar Meanchey', 'Pailin',
    'Preah Vihear', 'Prey Veng', 'Pursat', 'Ratanakiri', 'Stung Treng',
    'Svay Rieng', 'Takeo', 'Tboung Khmum'
  ];

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Warehouse[]>('/warehouses');
      setWarehouses(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/warehouses', {
        name,
        khmer_name: khmerName,
        location,
        province,
        phone,
        manager_name: managerName,
        is_default: isDefault
      });
      setIsOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating warehouse');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <WarehouseIcon className="w-6 h-6 text-blue-600" />
            <span>Warehouses & Locations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-depot stock locations across Phnom Penh and Cambodian provinces
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setKhmerName('');
            setLocation('');
            setProvince('Phnom Penh');
            setPhone('');
            setManagerName('');
            setIsDefault(false);
            setIsOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse</span>
        </button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((w) => (
          <div
            key={w.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between"
          >
            {w.is_default && (
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200">
                Primary Depot
              </span>
            )}

            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{w.name}</h3>
                  {w.khmer_name && (
                    <p className="text-xs text-slate-400 font-sans">{w.khmer_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 my-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{w.location}, {w.province}</span>
                </div>
                {w.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{w.phone}</span>
                  </div>
                )}
                {w.manager_name && (
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Manager: {w.manager_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Stock Stats */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Quantity In Stock</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {w.total_quantity || 0} units
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Inventory Value</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatMoney(w.inventory_value || 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Warehouse Depot" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Warehouse Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Central Warehouse"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Khmer Name (ឈ្មោះជាភាសាខ្មែរ)</label>
            <input
              type="text"
              value={khmerName}
              onChange={(e) => setKhmerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="ឧ. ឃ្លាំងកណ្តាល ភ្នំពេញ"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Province (ខេត្ត/រាជធានី) *</label>
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
          <div>
            <label className="block font-medium mb-1">Street Address & Location *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              placeholder="e.g. Street 271, Sangkat Boeng Tumpun"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                placeholder="+855 23 888 111"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Manager Name</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                placeholder="e.g. Dara Sam"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultWh"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isDefaultWh" className="font-medium text-slate-700 dark:text-slate-300">
              Set as Default Receiving Warehouse
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              Create Warehouse
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
