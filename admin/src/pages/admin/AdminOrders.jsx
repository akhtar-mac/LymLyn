import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Filter } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

const STATUS_OPTIONS = ['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const STATUS_STYLES = {
  pending: 'bg-white/10 text-white/50',
  paid: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-amber-900/30 text-amber-400',
  delivered: 'bg-green-900/30 text-green-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

export default function AdminOrders() {
  const { role } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('paid');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminApi.listOrders(filter ? { status: filter } : {})
      .then((r) => setOrders(r.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const res = await adminApi.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: res.order.status } : o));
    } catch (err) {
      alert(err.message);
    }
    setUpdating(null);
  };

  const canCancel = ['super_admin', 'manager'].includes(role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Orders</h1>
        <p className="text-sm text-white/40 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${filter === s ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-white/40">{order.id.slice(0,8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_STYLES[order.status] || 'bg-white/10 text-white/50'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{order.profiles?.full_name || 'Guest'}</p>
                  <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>

                  {/* Items — packer-friendly */}
                  <div className="mt-2 space-y-0.5">
                    {order.order_items?.map((item) => (
                      <p key={item.id} className="text-xs text-white/40">
                        {item.product_variants?.products?.name} · {item.product_variants?.color_name} · {item.product_variants?.size} × {item.quantity}
                      </p>
                    ))}
                  </div>

                  {/* Shipping address (for packer) */}
                  {order.shipping_address && (
                    <p className="text-xs text-white/30 mt-2 leading-relaxed">
                      📦 {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.pincode}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Only show amount to non-packers */}
                  {role !== 'packer' && (
                    <p className="text-base font-bold text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  )}

                  {/* Packer: only show "Mark Shipped" */}
                  {role === 'packer' ? (
                    order.status === 'paid' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'shipped')}
                        disabled={updating === order.id}
                        className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
                      >
                        {updating === order.id ? 'Updating...' : 'Mark Shipped'}
                      </button>
                    )
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updating === order.id}
                      className="bg-[#111] border border-white/10 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-accent capitalize"
                    >
                      {STATUS_OPTIONS.filter(Boolean).map((s) => {
                        if (s === 'cancelled' && !canCancel) return null;
                        return <option key={s} value={s} className="capitalize">{s}</option>;
                      })}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && !loading && (
            <div className="text-center py-16 text-white/30 text-sm">No orders found.</div>
          )}
        </div>
      )}
    </div>
  );
}
