import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart2, ShoppingBag, Users,
  Tag, Star, Wand2, UserCog, Settings, LogOut,
  Menu, X, Bell, ChevronRight, Truck, RotateCcw,
  CreditCard, Receipt, FileText, Headphones, Ticket,
  Megaphone, Globe, PieChart, Zap, AlertTriangle,
  Layers, Warehouse, Building2, MessageCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useAdminAuth from '@/hooks/useAdminAuth';
import RequirePermission from '@/components/auth/RequirePermission';
import useAuthStore from '@/store/authStore';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  sales: 'Sales Manager',
  finance: 'Finance',
  shipping: 'Shipping & Logistics',
  inventory: 'Inventory Manager',
  support: 'Support Agent',
  marketing: 'Digital Marketing',
  packer: 'Packer',
};

const ROLE_COLORS = {
  super_admin: 'from-violet-500 to-purple-600',
  manager: 'from-violet-500 to-purple-600',
  sales: 'from-blue-500 to-cyan-600',
  finance: 'from-emerald-500 to-green-600',
  shipping: 'from-amber-500 to-orange-600',
  inventory: 'from-rose-500 to-pink-600',
  support: 'from-sky-500 to-blue-600',
  marketing: 'from-fuchsia-500 to-violet-600',
  packer: 'from-slate-500 to-gray-600',
};

function NavItem({ to, icon, label, end = false, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-accent/15 text-accent border border-accent/20'
            : 'text-white/55 hover:text-white hover:bg-white/6 border border-transparent'
        }`
      }
    >
      <span className="shrink-0 opacity-80 group-[.active]:opacity-100">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="ml-auto shrink-0 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div className="mb-3">
      <p className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white/20">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function InactivityTimer({ onWarning, onLogout }) {
  useEffect(() => {
    let warningTimer, logoutTimer;
    const reset = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      warningTimer = setTimeout(onWarning, 25 * 60 * 1000);
      logoutTimer  = setTimeout(onLogout,  30 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [onWarning, onLogout]);
  return null;
}

export default function AdminLayout() {
  const { role, loading, can } = useAdminAuth();
  const { signOut, profile } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!role) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const roleGradient = ROLE_COLORS[role] || ROLE_COLORS.support;
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const sidebar = (
    <aside className="w-64 bg-[#0D0D0D] border-r border-white/[0.06] flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="LYM|LYN" className="h-7 w-7 shrink-0 brightness-0 invert" />
          <div className="font-display font-black text-xl tracking-tighter text-white">
            LYM<span className="text-accent px-0.5">|</span>LYN
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 ml-9">
          <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${roleGradient} shrink-0`} />
          <p className="text-[11px] text-white/30 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav — role-scoped */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        
        {/* Overview — visible to all except packer */}
        {role !== 'packer' && (
          <NavSection label="Overview">
            <NavItem to="/admin" end icon={<LayoutDashboard size={15} />} label="Dashboard" />
          </NavSection>
        )}

        {/* Products & Inventory */}
        {(can('products.manage') || can('stock.manage') || can('catalog.view')) && (
          <NavSection label="Catalogue">
            {can('products.manage') && <NavItem to="/admin/products" icon={<Package size={15} />} label="Products" />}
            {can('stock.manage') && <NavItem to="/admin/inventory" icon={<Warehouse size={15} />} label="Stock & Inventory" />}
            {can('categories.manage') && <NavItem to="/admin/categories" icon={<Layers size={15} />} label="Categories" />}
            {can('catalog.view') && !can('products.manage') && (
              <NavItem to="/admin/marketing/catalog-feed" icon={<Globe size={15} />} label="Live Catalog Feed" />
            )}
          </NavSection>
        )}

        {/* Orders & Fulfillment */}
        {can('orders.view') && (
          <NavSection label="Orders">
            <NavItem to="/admin/orders" icon={<ShoppingBag size={15} />} label="Orders" />
            {can('fulfillment.manage') && <NavItem to="/admin/fulfillment" icon={<Truck size={15} />} label="Fulfillment" />}
            {can('returns.manage') && <NavItem to="/admin/returns" icon={<RotateCcw size={15} />} label="Returns" />}
            {can('carriers.manage') && <NavItem to="/admin/carriers" icon={<Building2 size={15} />} label="Carriers" />}
          </NavSection>
        )}

        {/* Finance */}
        {(can('payments.view') || can('refunds.approve') || can('refunds.request') || can('invoices.view')) && (
          <NavSection label="Finance">
            {can('payments.view') && <NavItem to="/admin/payments" icon={<CreditCard size={15} />} label="Payments" />}
            {can('refunds.approve') && <NavItem to="/admin/refunds" icon={<Receipt size={15} />} label="Refunds Queue" />}
            {can('refunds.request') && !can('refunds.approve') && <NavItem to="/admin/refunds/request" icon={<Receipt size={15} />} label="Request Refund" />}
            {can('invoices.view') && <NavItem to="/admin/invoices" icon={<FileText size={15} />} label="Invoices" />}
          </NavSection>
        )}

        {/* Customers & Support */}
        {(can('customers.view') || can('tickets.manage')) && (
          <NavSection label="Customers">
            {can('customers.view') && <NavItem to="/admin/customers" icon={<Users size={15} />} label="Customers" />}
            {can('tickets.manage') && <NavItem to="/admin/tickets" icon={<Ticket size={15} />} label="Support Tickets" />}
            {role !== 'support' && <NavItem to="/admin/reviews" icon={<Star size={15} />} label="Reviews" />}
          </NavSection>
        )}

        {/* Marketing & Growth */}
        {(can('discounts.manage') || can('campaigns.create') || can('coupons.view')) && (
          <NavSection label="Marketing">
            {can('discounts.manage') && <NavItem to="/admin/coupons" icon={<Tag size={15} />} label="Coupons" />}
            {can('campaigns.create') && (
              <>
                <NavItem to="/admin/marketing/campaigns" icon={<Megaphone size={15} />} label="WhatsApp Campaigns" />
                <NavItem to="/admin/marketing/segments" icon={<PieChart size={15} />} label="Segments" />
                <NavItem to="/admin/marketing/catalog-feed" icon={<Globe size={15} />} label="Catalog Feed" />
              </>
            )}
            {can('coupons.view') && !can('discounts.manage') && <NavItem to="/admin/marketing/coupons" icon={<Tag size={15} />} label="Coupons (View)" />}
            {(can('campaigns.create') || can('discounts.manage')) && <NavItem to="/admin/marketing/approvals" icon={<Zap size={15} />} label="Approvals" />}
            {can('coupon_requests.create') && <NavItem to="/admin/marketing/coupon-requests" icon={<MessageCircle size={15} />} label="Coupon Requests" />}
          </NavSection>
        )}

        {/* Analytics */}
        {(can('analytics.sales.view') || can('analytics.finance.view') || can('analytics.marketing.view')) && (
          <NavSection label="Analytics">
            {can('analytics.sales.view') && <NavItem to="/admin/analytics/sales" icon={<BarChart2 size={15} />} label="Sales" />}
            {can('analytics.finance.view') && <NavItem to="/admin/analytics/finance" icon={<BarChart2 size={15} />} label="Finance" />}
            {can('analytics.marketing.view') && <NavItem to="/admin/analytics/marketing" icon={<BarChart2 size={15} />} label="Marketing" />}
          </NavSection>
        )}

        {/* Try-On */}
        {can('products.manage') && (
          <NavSection label="AI Features">
            <NavItem to="/admin/tryon-assets" icon={<Wand2 size={15} />} label="Try-On Assets" />
          </NavSection>
        )}

        {/* Admin — super admin only */}
        {can('*') && (
          <NavSection label="Admin">
            <NavItem to="/admin/team" icon={<UserCog size={15} />} label="Team & Roles" />
            <NavItem to="/admin/audit-log" icon={<FileText size={15} />} label="Audit Log" />
            <NavItem to="/admin/settings" icon={<Settings size={15} />} label="Settings" />
          </NavSection>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2.5 mb-1 rounded-lg bg-white/[0.03]">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center shrink-0 shadow-lg`}>
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-[11px] text-white/30 truncate">{ROLE_LABELS[role] || role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-150 group"
        >
          <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#111111] flex text-white">
      <InactivityTimer
        onWarning={() => setShowInactiveWarning(true)}
        onLogout={handleSignOut}
      />

      {/* Inactivity warning modal */}
      {showInactiveWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl animate-scale-in text-center">
            <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-white mb-2">Still there?</h2>
            <p className="text-sm text-white/50 mb-6">Your session will expire in 5 minutes due to inactivity.</p>
            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2.5 bg-white/8 text-white/60 rounded-lg text-sm hover:bg-white/12 transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowInactiveWarning(false)}
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex flex-col h-full animate-slide-in-left">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3.5 bg-[#0D0D0D] border-b border-white/[0.06] sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/50 hover:text-white transition-colors p-1"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb / title */}
          <div className="hidden lg:flex items-center gap-2.5 text-sm text-white/30">
            <img src="/logo.svg" alt="LYM|LYN" className="h-5 w-5 brightness-0 invert opacity-60" />
            <span className="font-display font-bold text-white/70 tracking-tight">LYM<span className="text-accent">|</span>LYN</span>
            <ChevronRight size={14} />
            <span className="text-white/50">{ROLE_LABELS[role] || 'Admin'}</span>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/6 transition-all">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleGradient} flex items-center justify-center shadow-lg`}>
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
