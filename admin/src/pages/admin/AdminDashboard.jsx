import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

function StatCard({ label, value, sub, color = 'accent' }) {
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
      <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-3xl font-display font-bold ${color === 'accent' ? 'text-accent' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { isManager, role } = useAdminAuth();
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getAnalytics(range)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">Store overview</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((d) => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${range === d ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.revenue !== null && (
          <StatCard label="Revenue" value={`₹${Number(data?.revenue || 0).toLocaleString('en-IN')}`} sub={`Last ${range} days`} color="accent" />
        )}
        <StatCard label="Orders" value={data?.order_count || 0} sub={`Last ${range} days`} color="white" />
        {data?.avg_order_value !== null && (
          <StatCard label="Avg Order" value={`₹${Math.round(data?.avg_order_value || 0).toLocaleString('en-IN')}`} color="white" />
        )}
        <StatCard label="Low Stock Items" value={data?.low_stock_alerts?.length || 0} color={data?.low_stock_alerts?.length > 0 ? 'accent' : 'white'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {(data?.recent_orders || []).map((order) => (
              <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:opacity-80 transition-opacity">
                <div>
                  <p className="text-xs font-mono text-white/60">{order.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-sm text-white">{order.profiles?.full_name || 'Guest'}</p>
                </div>
                <div className="text-right">
                  {data?.revenue !== null && <p className="text-sm font-medium text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>}
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    order.status === 'paid' ? 'bg-blue-900/40 text-blue-400' :
                    order.status === 'shipped' ? 'bg-amber-900/40 text-amber-400' :
                    order.status === 'delivered' ? 'bg-green-900/40 text-green-400' :
                    'bg-white/10 text-white/50'
                  }`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent" /> Low Stock
            </h2>
            <Link to="/admin/inventory?filter=low" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.low_stock_alerts || []).slice(0, 8).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-white">{v.products?.name}</p>
                  <p className="text-white/40">{v.sku}</p>
                </div>
                <span className={`font-bold ${v.stock_qty === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {v.stock_qty} left
                </span>
              </div>
            ))}
            {(!data?.low_stock_alerts?.length) && (
              <p className="text-xs text-white/30">All variants well-stocked ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
