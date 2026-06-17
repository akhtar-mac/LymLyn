import { useEffect, useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

const EMPTY = { code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true };

export default function AdminCoupons() {
  useAdminAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.listCoupons().then((r) => setCoupons(r.coupons || [])).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, discount_value: parseFloat(form.discount_value), min_order_amount: parseFloat(form.min_order_amount || 0), max_uses: form.max_uses ? parseInt(form.max_uses) : null, expires_at: form.expires_at || null };
      const res = await adminApi.saveCoupon(payload);
      setCoupons((prev) => { const idx = prev.findIndex(c => c.id === res.coupon.id); return idx >= 0 ? prev.map((c, i) => i === idx ? res.coupon : c) : [res.coupon, ...prev]; });
      setShowForm(false); setForm(EMPTY);
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Coupons</h1>
          <p className="text-sm text-white/40 mt-0.5">{coupons.length} coupons</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">{form.id ? 'Edit' : 'New'} Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[['code', 'Code (e.g. SAVE20)', 'text', true], ['discount_value', 'Discount Value', 'number', true], ['min_order_amount', 'Min Order (₹)', 'number', false], ['max_uses', 'Max Uses (blank = unlimited)', 'number', false]].map(([field, label, type, req]) => (
              <div key={field}>
                <label className="block text-xs text-white/40 mb-1">{label}</label>
                <input type={type} required={req} value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-white/40 mb-1">Type</label>
              <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent">
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Expires At (optional)</label>
              <input type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="coupon_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
            <label htmlFor="coupon_active" className="text-sm text-white">Active</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-dark disabled:opacity-50">
              {saving && <Loader size={12} className="animate-spin" />} Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 text-white/50 text-xs rounded-lg hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl divide-y divide-white/5">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-mono font-bold text-white">{c.code}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {c.discount_type === 'percent' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                  {c.min_order_amount > 0 && ` · min ₹${c.min_order_amount}`}
                  {c.max_uses && ` · ${c.uses_count}/${c.max_uses} used`}
                  {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString('en-IN')}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-900/30 text-green-400' : 'bg-white/10 text-white/30'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => { setForm({ ...c, expires_at: c.expires_at ? c.expires_at.split('T')[0] : '' }); setShowForm(true); }}
                  className="text-xs text-white/30 hover:text-white">Edit</button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && <div className="py-12 text-center text-white/30 text-sm">No coupons yet.</div>}
        </div>
      )}
    </div>
  );
}
