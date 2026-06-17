import { useEffect, useState } from 'react';
import { Plus, Loader, AlertTriangle, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

export default function AdminInventory() {
  useAdminAuth();
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowOnly, setLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState(null); // variantId being adjusted
  const [form, setForm] = useState({ change_qty: '', reason: 'restock', new_threshold: '' });
  const [saving, setSaving] = useState(false);
  const [movements, setMovements] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminApi.listInventory(lowOnly ? { low_stock: 'true' } : {})
      .then((r) => setVariants(r.variants || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lowOnly]);

  const handleAdjust = async (variantId) => {
    setSaving(true);
    try {
      const body = {};
      if (form.change_qty) body.change_qty = parseInt(form.change_qty);
      if (form.reason) body.reason = form.reason;
      if (form.new_threshold) body.new_threshold = parseInt(form.new_threshold);
      const res = await adminApi.adjustInventory(variantId, body);
      setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, ...res.variant } : v));
      setAdjusting(null);
      setForm({ change_qty: '', reason: 'restock', new_threshold: '' });
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const loadMovements = async (variantId) => {
    const res = await adminApi.getMovements(variantId);
    setMovements({ variantId, data: res.movements });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Inventory</h1>
          <p className="text-sm text-white/40 mt-0.5">{variants.length} variants</p>
        </div>
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
            lowOnly ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          <AlertTriangle size={14} /> Low Stock Only
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs text-white/30 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-xs text-white/30 font-medium hidden sm:table-cell">SKU</th>
                <th className="text-center px-4 py-3 text-xs text-white/30 font-medium">Stock</th>
                <th className="text-center px-4 py-3 text-xs text-white/30 font-medium hidden md:table-cell">Threshold</th>
                <th className="text-right px-4 py-3 text-xs text-white/30 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {variants.map((v) => {
                const isLow = v.stock_qty <= (v.low_stock_threshold || 5);
                return (
                  <tr key={v.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{v.products?.name}</p>
                      <p className="text-white/40 text-xs">{v.color_name} · {v.size}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-white/40">{v.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${v.stock_qty === 0 ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400'}`}>
                        {v.stock_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="text-xs text-white/30">{v.low_stock_threshold || 5}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => loadMovements(v.id)}
                          className="text-xs text-white/30 hover:text-white transition-colors"
                        >
                          History
                        </button>
                        <button
                          onClick={() => setAdjusting(adjusting === v.id ? null : v.id)}
                          className="text-xs text-accent hover:text-accent-dark transition-colors"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {variants.length === 0 && (
            <div className="py-16 text-center text-white/30 text-sm">No variants found.</div>
          )}
        </div>
      )}

      {/* Adjust panel */}
      {adjusting && (
        <div className="bg-[#1A1A1A] border border-accent/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Adjust: {variants.find(v => v.id === adjusting)?.sku}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Change Qty (±)</label>
              <input type="number" value={form.change_qty} onChange={e => setForm({...form, change_qty: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent"
                placeholder="+10 or -3" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Reason</label>
              <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent">
                {['restock','manual_adjustment','return'].map(r => <option key={r} value={r} className="capitalize">{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">New Threshold (optional)</label>
              <input type="number" value={form.new_threshold} onChange={e => setForm({...form, new_threshold: e.target.value})}
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-accent"
                placeholder="5" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAdjust(adjusting)} disabled={saving}
              className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-dark disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader size={12} className="animate-spin" />} Save
            </button>
            <button onClick={() => setAdjusting(null)} className="px-4 py-2 bg-white/5 text-white/50 text-xs rounded-lg hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Movement history panel */}
      {movements && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Movement History</h3>
            <button onClick={() => setMovements(null)} className="text-xs text-white/30 hover:text-white">Close</button>
          </div>
          <div className="space-y-2">
            {movements.data?.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <div>
                  <span className={`font-bold ${m.change_qty > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.change_qty > 0 ? '+' : ''}{m.change_qty}
                  </span>
                  <span className="text-white/30 ml-2 capitalize">{m.reason?.replace('_', ' ')}</span>
                  {m.profiles?.full_name && <span className="text-white/20 ml-2">by {m.profiles.full_name}</span>}
                </div>
                <span className="text-white/20">{new Date(m.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
            {!movements.data?.length && <p className="text-white/30 text-xs">No movements recorded yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
