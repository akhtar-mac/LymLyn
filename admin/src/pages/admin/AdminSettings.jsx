import { useState } from 'react';
import { Check } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';

export default function AdminSettings() {
  useAdminAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    tax_rate: '18',
    shipping_fee: '99',
    free_shipping_threshold: '999',
    store_email: '',
    store_phone: '',
    store_address: '',
  });

  const handleSave = (e) => {
    e.preventDefault();
    // In V1 this would write to a store_settings table; placeholder for now
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-0.5">Store-level configuration</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-lg">
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Pricing</h2>
          {[
            ['tax_rate', 'GST Rate (%)', 'number'],
            ['shipping_fee', 'Flat Shipping Fee (₹)', 'number'],
            ['free_shipping_threshold', 'Free Shipping Above (₹)', 'number'],
          ].map(([field, label, type]) => (
            <div key={field}>
              <label className="block text-xs text-white/40 mb-1">{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent" />
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Contact Info</h2>
          {[
            ['store_email', 'Store Email', 'email'],
            ['store_phone', 'Store Phone', 'tel'],
            ['store_address', 'Store Address', 'text'],
          ].map(([field, label, type]) => (
            <div key={field}>
              <label className="block text-xs text-white/40 mb-1">{label}</label>
              <input type={type} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${saved ? 'bg-green-600 text-white' : 'bg-accent text-white hover:bg-accent-dark'}`}>
            {saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
