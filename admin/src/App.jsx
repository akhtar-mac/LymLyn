import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import useAuthStore from '@/store/authStore';

// Admin pages (lazy-loaded — only fetched when accessed)
const Login            = lazy(() => import('@/pages/Login'));
const AdminDashboard   = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts    = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminOrders      = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminInventory   = lazy(() => import('@/pages/admin/AdminInventory'));
const AdminCustomers   = lazy(() => import('@/pages/admin/AdminCustomers'));
const AdminCoupons     = lazy(() => import('@/pages/admin/AdminCoupons'));
const AdminReviews     = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminTryOnAssets = lazy(() => import('@/pages/admin/AdminTryOnAssets'));
const AdminTeam        = lazy(() => import('@/pages/admin/AdminTeam'));
const AdminSettings    = lazy(() => import('@/pages/admin/AdminSettings'));
// New role pages
const AdminPayments    = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminFulfillment = lazy(() => import('@/pages/admin/AdminFulfillment'));
const AdminTickets     = lazy(() => import('@/pages/admin/AdminTickets'));
const AdminCampaigns   = lazy(() => import('@/pages/admin/AdminCampaigns'));
const AdminCatalogFeed = lazy(() => import('@/pages/admin/AdminCatalogFeed'));

const AF = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const S = ({ children }) => <Suspense fallback={<AF />}>{children}</Suspense>;

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<S><AdminDashboard /></S>} />
          <Route path="products" element={<S><AdminProducts /></S>} />
          <Route path="orders" element={<S><AdminOrders /></S>} />
          <Route path="inventory" element={<S><AdminInventory /></S>} />
          <Route path="customers" element={<S><AdminCustomers /></S>} />
          <Route path="coupons" element={<S><AdminCoupons /></S>} />
          <Route path="reviews" element={<S><AdminReviews /></S>} />
          <Route path="tryon-assets" element={<S><AdminTryOnAssets /></S>} />
          <Route path="team" element={<S><AdminTeam /></S>} />
          <Route path="settings" element={<S><AdminSettings /></S>} />
          {/* Finance */}
          <Route path="payments" element={<S><AdminPayments /></S>} />
          {/* Shipping */}
          <Route path="fulfillment" element={<S><AdminFulfillment /></S>} />
          {/* Support */}
          <Route path="tickets" element={<S><AdminTickets /></S>} />
          {/* Marketing */}
          <Route path="marketing/campaigns" element={<S><AdminCampaigns /></S>} />
          <Route path="marketing/catalog-feed" element={<S><AdminCatalogFeed /></S>} />
          <Route path="*" element={
            <div className="text-center py-20">
              <p className="text-white/30 text-sm">Page not found or not yet built.</p>
            </div>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
}
