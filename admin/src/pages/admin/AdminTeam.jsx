import { useEffect, useState } from 'react';
import { Search, Shield, UserX } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';

const ROLES = ['super_admin', 'manager', 'support', 'packer'];
const ROLE_COLORS = { super_admin: 'bg-accent/20 text-accent', manager: 'bg-blue-900/30 text-blue-400', support: 'bg-purple-900/30 text-purple-400', packer: 'bg-amber-900/30 text-amber-400' };
const ROLE_LABELS = { super_admin: 'Super Admin', manager: 'Manager', support: 'Support', packer: 'Packer' };

export default function AdminTeam() {
  useAdminAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    adminApi.listTeam().then((r) => setTeam(r.team || [])).finally(() => setLoading(false));
  }, []);

  const loadAudit = async () => {
    const res = await adminApi.getAuditLog({ limit: 50 });
    setAuditLog(res.log || []);
    setShowAudit(true);
  };

  const handleRoleChange = async (userId, role) => {
    setSaving(userId);
    try {
      const res = await adminApi.setRole(userId, role || null);
      setTeam((prev) => prev.map((m) => m.id === userId ? { ...m, admin_role: res.profile.admin_role } : m));
    } catch (err) { alert(err.message); }
    setSaving(null);
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this user\'s admin access?')) return;
    setSaving(userId);
    try {
      await adminApi.setRole(userId, null);
      setTeam((prev) => prev.filter((m) => m.id !== userId));
    } catch (err) { alert(err.message); }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Team & Roles</h1>
          <p className="text-sm text-white/40 mt-0.5">{team.length} admin user{team.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={loadAudit} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 text-xs font-medium rounded-lg hover:text-white hover:bg-white/10">
          <Shield size={14} /> Audit Log
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl divide-y divide-white/5">
          {team.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-white">{member.full_name || 'No name'}</p>
                <p className="text-xs text-white/30">{member.phone || 'No phone'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[member.admin_role] || 'bg-white/10 text-white/50'}`}>
                  {ROLE_LABELS[member.admin_role] || member.admin_role}
                </span>
                <select
                  value={member.admin_role || ''}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={saving === member.id}
                  className="bg-[#111] border border-white/10 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-accent"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={saving === member.id}
                  className="text-white/20 hover:text-red-400 transition-colors"
                  title="Remove admin access"
                >
                  <UserX size={16} />
                </button>
              </div>
            </div>
          ))}
          {team.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No admin users yet.</div>
          )}
        </div>
      )}

      {/* Audit log drawer */}
      {showAudit && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Shield size={14} className="text-accent" /> Audit Log</h2>
            <button onClick={() => setShowAudit(false)} className="text-xs text-white/30 hover:text-white">Close</button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between text-xs py-2 border-b border-white/5">
                <div>
                  <span className="text-accent font-mono">{entry.action}</span>
                  {entry.profiles?.full_name && <span className="text-white/30 ml-2">by {entry.profiles.full_name}</span>}
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <p className="text-white/20 mt-0.5">{JSON.stringify(entry.details)}</p>
                  )}
                </div>
                <span className="text-white/20 shrink-0 ml-4">{new Date(entry.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
            {auditLog.length === 0 && <p className="text-white/30 text-xs">No audit entries yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
