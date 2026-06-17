import { useEffect, useState } from 'react';
import { Truck, Package, MapPin, CheckCircle2 } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

export default function AdminFulfillment() {
  const { role } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  useEffect(() => {
    setLoading(true);
    adminApi.listOrders({ status: 'paid' })
      .then((r) => setOrders(r.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkShipped = async (orderId) => {
    setUpdating(orderId);
    try {
      const res = await adminApi.updateOrderStatus(orderId, 'shipped');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      alert(err.message);
    }
    setUpdating(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Fulfillment Queue</h1>
        <p className="text-sm text-white/40 mt-0.5">{orders.length} orders awaiting shipment</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm mt-1">No orders awaiting fulfillment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-white/40">{order.id.slice(0,8).toUpperCase()}</span>
                    <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full font-medium">Ready to Pack</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{order.profiles?.full_name || 'Guest'}</p>
                  {order.shipping_address && (
                    <p className="text-xs text-white/40 flex items-center gap-1.5 mb-3">
                      <MapPin size={11} />
                      {order.shipping_address.line1}, {order.shipping_address.city} — {order.shipping_address.pincode}
                    </p>
                  )}
                  <div className="space-y-1">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-white/50">
                        <Package size={11} />
                        {item.product_variants?.products?.name} · {item.product_variants?.color_name} · {item.product_variants?.size} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <p className="text-base font-bold text-white text-right">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                  <input
                    type="text"
                    placeholder="Tracking number"
                    value={trackingInputs[order.id] || ''}
                    onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                    className="bg-[#111] border border-white/10 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-accent placeholder:text-white/20 w-48"
                  />
                  <button
                    onClick={() => handleMarkShipped(order.id)}
                    disabled={updating === order.id}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    <Truck size={13} />
                    {updating === order.id ? 'Updating...' : 'Mark as Shipped'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
