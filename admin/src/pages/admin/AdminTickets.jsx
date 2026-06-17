import { useState } from 'react';
import { Ticket, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

// Demo data — in production this would come from a /api/admin/tickets endpoint
const DEMO_TICKETS = [
  { id: 't1', subject: 'Order not received after 10 days', status: 'open', created_at: '2026-06-15T10:00:00Z', customer: 'Rahul Sharma', order_id: 'ORD-001' },
  { id: 't2', subject: 'Received wrong color variant', status: 'pending', created_at: '2026-06-14T09:00:00Z', customer: 'Priya Kapoor', order_id: 'ORD-002' },
  { id: 't3', subject: 'Request for exchange in size', status: 'closed', created_at: '2026-06-10T08:00:00Z', customer: 'Arjun Mehta', order_id: 'ORD-003' },
  { id: 't4', subject: 'Refund not processed yet', status: 'open', created_at: '2026-06-16T11:00:00Z', customer: 'Neha Gupta', order_id: 'ORD-004' },
];

const STATUS = {
  open:    { label: 'Open',    cls: 'bg-red-900/20 text-red-400',    icon: <AlertCircle size={12} /> },
  pending: { label: 'Pending', cls: 'bg-amber-900/20 text-amber-400', icon: <Clock size={12} /> },
  closed:  { label: 'Closed',  cls: 'bg-emerald-900/20 text-emerald-400', icon: <CheckCircle2 size={12} /> },
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState(DEMO_TICKETS);
  const [filter, setFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [note, setNote] = useState('');

  const filtered = filter ? tickets.filter((t) => t.status === filter) : tickets;

  const changeStatus = (id, status) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (selectedTicket?.id === id) setSelectedTicket((p) => ({ ...p, status }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Ticket size={22} className="text-accent" /> Support Tickets
        </h1>
        <p className="text-sm text-white/40 mt-0.5">{tickets.filter((t) => t.status === 'open').length} open tickets</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'open', 'pending', 'closed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${filter === s ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((t) => {
            const st = STATUS[t.status];
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`w-full text-left bg-[#1A1A1A] border rounded-xl p-4 transition-all ${selectedTicket?.id === t.id ? 'border-accent' : 'border-white/5 hover:border-white/10'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.icon} {st.label}</span>
                  <span className="text-[11px] text-white/30">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                <p className="text-xs text-white/40 mt-0.5">{t.customer} · #{t.order_id}</p>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-white/30 text-center py-8">No tickets found.</p>}
        </div>

        {/* Detail panel */}
        {selectedTicket ? (
          <div className="lg:col-span-3 bg-[#1A1A1A] border border-white/5 rounded-xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[selectedTicket.status].cls}`}>
                  {STATUS[selectedTicket.status].icon} {STATUS[selectedTicket.status].label}
                </span>
                <span className="text-xs text-white/30">#{selectedTicket.order_id}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{selectedTicket.subject}</h2>
              <p className="text-sm text-white/50 mt-1">Customer: <span className="text-white">{selectedTicket.customer}</span></p>
            </div>

            {/* Notes area */}
            <div>
              <label className="block text-xs text-white/40 mb-2 uppercase tracking-widest">Internal Note</label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an internal note about this ticket..."
                className="w-full bg-[#111] border border-white/10 text-white text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-accent placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {['open', 'pending', 'closed'].map((s) => (
                <button key={s} onClick={() => changeStatus(selectedTicket.id, s)}
                  disabled={selectedTicket.status === s}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${selectedTicket.status === s ? 'bg-white/10 text-white/50 cursor-default' : 'bg-white/6 text-white hover:bg-white/12'}`}>
                  Mark {s}
                </button>
              ))}
              <button className="ml-auto px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors">
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 flex items-center justify-center bg-[#1A1A1A] border border-white/5 rounded-xl min-h-[200px]">
            <div className="text-center">
              <MessageSquare size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/30">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
