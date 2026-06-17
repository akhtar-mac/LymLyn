import { useState } from 'react';
import { Megaphone, Send, Users, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

const DEMO_CAMPAIGNS = [
  { id: 'c1', name: 'Flash Sale — June Lowers', status: 'sent', estimated_reach: 420, sent_at: '2026-06-15T10:00:00Z', template: 'flash_sale_announcement' },
  { id: 'c2', name: 'Abandoned Cart Reminder — Week 24', status: 'pending_approval', estimated_reach: 1240, created_at: '2026-06-16T09:00:00Z', template: 'abandoned_cart_reminder' },
  { id: 'c3', name: 'Back In Stock — Men\'s Cargo', status: 'draft', estimated_reach: 0, created_at: '2026-06-17T08:00:00Z', template: null },
];

const STATUS = {
  draft:            { cls: 'bg-white/10 text-white/50',         label: 'Draft' },
  pending_approval: { cls: 'bg-amber-900/20 text-amber-400',    label: 'Pending Approval' },
  approved:         { cls: 'bg-blue-900/20 text-blue-400',      label: 'Approved' },
  sending:          { cls: 'bg-violet-900/20 text-violet-400',  label: 'Sending' },
  sent:             { cls: 'bg-emerald-900/20 text-emerald-400',label: 'Sent' },
  failed:           { cls: 'bg-red-900/20 text-red-400',        label: 'Failed' },
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', template: '', segment: 'all', coupon: '' });

  const handleCreate = (e) => {
    e.preventDefault();
    const newCamp = {
      id: `c${Date.now()}`,
      name: form.name,
      status: 'draft',
      estimated_reach: 0,
      created_at: new Date().toISOString(),
      template: form.template,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    setCreating(false);
    setForm({ name: '', template: '', segment: 'all', coupon: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Megaphone size={22} className="text-accent" /> WhatsApp Campaigns
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Create and manage WhatsApp marketing campaigns</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Send size={14} /> New Campaign
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-[#1A1A1A] border border-accent/20 rounded-xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-widest">Campaign Name</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-accent placeholder:text-white/20"
                  placeholder="e.g. Flash Sale — July" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-widest">WhatsApp Template</label>
                <select value={form.template} onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-accent">
                  <option value="">Select approved template...</option>
                  <option value="flash_sale_announcement">Flash Sale Announcement (Approved ✓)</option>
                  <option value="abandoned_cart_reminder">Abandoned Cart Reminder (Approved ✓)</option>
                  <option value="back_in_stock">Back In Stock Alert (Pending...)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-widest">Customer Segment</label>
                <select value={form.segment} onChange={(e) => setForm((p) => ({ ...p, segment: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-accent">
                  <option value="all">All Opted-In Customers</option>
                  <option value="abandoned_cart">Abandoned Cart (Last 7 days)</option>
                  <option value="high_value">High Lifetime Value (&gt;₹5,000)</option>
                  <option value="no_order">Never Ordered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-widest">Attach Coupon (optional)</label>
                <input value={form.coupon} onChange={(e) => setForm((p) => ({ ...p, coupon: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-accent placeholder:text-white/20"
                  placeholder="COUPON10" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors">Save as Draft</button>
            </div>
          </form>
        </div>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map((camp) => {
          const st = STATUS[camp.status] || STATUS.draft;
          return (
            <div key={camp.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Megaphone size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{camp.name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {camp.estimated_reach > 0 ? `~${camp.estimated_reach.toLocaleString()} recipients` : 'Reach TBD'}
                  {camp.template && ` · Template: ${camp.template}`}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${st.cls}`}>{st.label}</span>
              <ChevronRight size={16} className="text-white/20 shrink-0" />
            </div>
          );
        })}
      </div>

      <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-400">WhatsApp Business Integration</p>
          <p className="text-xs text-amber-400/70 mt-1">Connect your Meta WhatsApp Business Account to start sending campaigns. Only opted-in customers will receive messages. Configure in Settings → WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}
