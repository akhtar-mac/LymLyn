import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

export default function AdminCustomers() {
  const { role } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminApi.listCustomers(search ? { search } : {})
      .then((r) => setCustomers(r.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const loadDetail = async (id) => {
    setSelected(id);
    const res = await adminApi.getCustomer(id);
    setDetail(res);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Customers</h1>
        <p className="text-sm text-white/40 mt-0.5">{customers.length} loaded</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full bg-[#1A1A1A] border border-white/10 text-white text-sm pl-8 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-accent placeholder:text-white/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-white/5">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadDetail(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${selected === c.id ? 'bg-white/5' : ''}`}
                >
                  <p className="text-sm font-medium text-white">{c.full_name || 'No name'}</p>
                  <p className="text-xs text-white/30 mt-0.5">{c.phone || 'No phone'}</p>
                </button>
              ))}
              {customers.length === 0 && (
                <div className="py-12 text-center text-white/30 text-sm">No customers found.</div>
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {detail ? (
            <div className="space-y-4">
              {/* Profile card */}
              <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
                <h2 className="text-lg font-display font-bold text-white mb-4">{detail.profile?.full_name || 'No name'}</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Phone', value: detail.profile?.phone },
                    { label: 'Gender', value: detail.profile?.gender },
                    { label: 'Body Type', value: detail.profile?.body_type },
                    { label: 'Fit Pref', value: detail.profile?.fit_preference },
                    { label: 'Orders', value: detail.order_count },
                    ...(detail.lifetime_value !== null ? [{ label: 'Lifetime Value', value: `₹${Number(detail.lifetime_value).toLocaleString('en-IN')}` }] : []),
                  ].filter(item => item.value).map(item => (
                    <div key={item.label}>
                      <dt className="text-xs text-white/30 mb-0.5">{item.label}</dt>
                      <dd className="text-white capitalize">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Order history */}
              <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Order History</h3>
                <div className="space-y-2">
                  {detail.orders?.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                      <div>
                        <span className="font-mono text-white/40">{o.id.slice(0,8).toUpperCase()}</span>
                        <span className="text-white/30 ml-2">{new Date(o.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {detail.lifetime_value !== null && (
                          <span className="font-medium text-white">₹{Number(o.total_amount).toLocaleString('en-IN')}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full capitalize ${
                          o.status === 'delivered' ? 'bg-green-900/30 text-green-400' :
                          o.status === 'shipped' ? 'bg-amber-900/30 text-amber-400' :
                          'bg-white/10 text-white/50'
                        }`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                  {!detail.orders?.length && <p className="text-white/30 text-xs">No orders yet.</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-xl h-64 flex items-center justify-center">
              <p className="text-white/20 text-sm">Select a customer to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
