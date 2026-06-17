import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

const STATUS_STYLES = {
  paid: { icon: <CheckCircle2 size={14} />, cls: 'text-emerald-400 bg-emerald-900/20' },
  pending: { icon: <Clock size={14} />, cls: 'text-amber-400 bg-amber-900/20' },
  failed: { icon: <XCircle size={14} />, cls: 'text-red-400 bg-red-900/20' },
  refunded: { icon: <AlertCircle size={14} />, cls: 'text-blue-400 bg-blue-900/20' },
};

export default function AdminPayments() {
  const { can } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.listOrders({ limit: 100 })
      .then((r) => setOrders(r.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const paidOrders = orders.filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status));
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Payments</h1>
        <p className="text-sm text-white/40 mt-0.5">Transaction log and payment gateway status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp size={20} />, color: 'text-emerald-400' },
          { label: 'Paid Orders', value: paidOrders.length, icon: <CheckCircle2 size={20} />, color: 'text-blue-400' },
          { label: 'Pending', value: orders.filter((o) => o.status === 'pending').length, icon: <Clock size={20} />, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <CreditCard size={15} className="text-accent" /> Transaction Log
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading transactions...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((order) => {
              const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              return (
                <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-xs font-mono text-white/40">{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-white font-medium">{order.profiles?.full_name || 'Guest'}</p>
                    <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-white">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${style.cls}`}>
                      {style.icon} {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
