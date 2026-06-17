import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Package, LogOut, Check } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';

const BODY_TYPES = ['slim', 'average', 'heavy'];
const FIT_PREFS = ['regular', 'oversized'];
const GENDERS = ['male', 'female', 'unisex'];

export default function Account() {
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', gender: '', height_cm: '', weight_kg: '', body_type: '', fit_preference: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
        body_type: profile.body_type || '',
        fit_preference: profile.fit_preference || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      setOrdersLoading(true);
      supabase
        .from('orders')
        .select('*, order_items(*, product_variants(*, products(name)))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setOrders(data || []))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({ ...form, height_cm: Number(form.height_cm) || null, weight_kg: Number(form.weight_kg) || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusColors = {
    pending: 'bg-muted/20 text-muted',
    paid: 'bg-blue-50 text-blue-600',
    shipped: 'bg-amber-50 text-amber-600',
    delivered: 'bg-green-50 text-green-600',
    cancelled: 'bg-red-50 text-red-600',
  };

  return (
    <div className="container-site py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold text-ink mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: <User size={16} /> },
              { id: 'orders', label: 'Orders', icon: <Package size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors
                  ${activeTab === tab.id
                    ? 'bg-ink text-white'
                    : 'text-muted hover:text-ink hover:bg-border/50'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left text-muted hover:text-accent transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="card space-y-5">
              <h2 className="font-display text-2xl font-bold text-ink">Profile</h2>
              <p className="text-sm text-muted">These details pre-fill the virtual try-on form.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="input-label">Full Name</label>
                  <input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="phone" className="input-label">Phone</label>
                  <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
                </div>
              </div>

              <div>
                <label className="input-label">Gender</label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })}
                      className={`px-4 py-2 text-xs font-medium border capitalize transition-all
                        ${form.gender === g ? 'bg-ink text-white border-ink' : 'border-border text-muted hover:border-ink hover:text-ink'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height_cm" className="input-label">Height (cm)</label>
                  <input id="height_cm" type="number" min={100} max={230} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="input" placeholder="175" />
                </div>
                <div>
                  <label htmlFor="weight_kg" className="input-label">Weight (kg)</label>
                  <input id="weight_kg" type="number" min={30} max={200} value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="input" placeholder="70" />
                </div>
              </div>

              <div>
                <label className="input-label">Body Type</label>
                <div className="flex gap-2">
                  {BODY_TYPES.map((bt) => (
                    <button key={bt} type="button" onClick={() => setForm({ ...form, body_type: bt })}
                      className={`px-4 py-2 text-xs font-medium border capitalize transition-all
                        ${form.body_type === bt ? 'bg-ink text-white border-ink' : 'border-border text-muted hover:border-ink hover:text-ink'}`}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Fit Preference</label>
                <div className="flex gap-2">
                  {FIT_PREFS.map((fp) => (
                    <button key={fp} type="button" onClick={() => setForm({ ...form, fit_preference: fp })}
                      className={`px-4 py-2 text-xs font-medium border capitalize transition-all
                        ${form.fit_preference === fp ? 'bg-ink text-white border-ink' : 'border-border text-muted hover:border-ink hover:text-ink'}`}>
                      {fp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-8">
                  {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : 'Save Profile'}
                </button>
                {saved && <span className="text-sm text-accent animate-fade-in">Profile updated!</span>}
              </div>
            </form>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink">Orders</h2>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-24 bg-border animate-pulse" />)}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted text-sm">No orders yet. Go shop!</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="card">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`badge capitalize ${statusColors[order.status] || 'bg-border'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="text-sm flex justify-between text-muted">
                          <span>{item.product_variants?.products?.name} · {item.product_variants?.color_name} · {item.product_variants?.size} × {item.quantity}</span>
                          <span className="font-medium text-ink">₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="divider mt-4 pt-3 flex justify-between text-sm font-semibold">
                      <span className="text-muted">Total</span>
                      <span className="text-ink">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
