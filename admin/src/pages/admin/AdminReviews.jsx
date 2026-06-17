import { useEffect, useState } from 'react';
import { Eye, EyeOff, Star } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

export default function AdminReviews() {
  useAdminAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.listReviews(filter ? { status: filter } : {})
      .then((r) => setReviews(r.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const toggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
    try {
      const res = await adminApi.updateReview(id, newStatus);
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: res.review.status } : r));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Reviews</h1>
        <p className="text-sm text-white/40 mt-0.5">Moderation queue</p>
      </div>

      <div className="flex gap-2">
        {[['', 'All'], ['published', 'Published'], ['hidden', 'Hidden']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === val ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`bg-[#1A1A1A] border rounded-xl p-4 ${r.status === 'hidden' ? 'border-white/5 opacity-60' : 'border-white/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'} />)}
                    </div>
                    <span className="text-xs text-white/30">{r.profiles?.full_name || 'Anonymous'}</span>
                    <span className="text-xs text-white/20">on</span>
                    <span className="text-xs text-accent">{r.products?.name}</span>
                  </div>
                  {r.title && <p className="text-sm font-medium text-white">{r.title}</p>}
                  {r.body && <p className="text-xs text-white/50 mt-1 leading-relaxed">{r.body}</p>}
                  <p className="text-xs text-white/20 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <button
                  onClick={() => toggle(r.id, r.status)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    r.status === 'published'
                      ? 'bg-white/5 text-white/40 hover:bg-red-900/30 hover:text-red-400'
                      : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                  }`}
                >
                  {r.status === 'published' ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                </button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="py-16 text-center text-white/30 text-sm">No reviews found.</div>
          )}
        </div>
      )}
    </div>
  );
}
