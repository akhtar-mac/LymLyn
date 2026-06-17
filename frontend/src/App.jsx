import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import AuthModal from '@/components/auth/AuthModal';
import CartDrawer from '@/components/cart/CartDrawer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import useAuthStore from '@/store/authStore';

// Public pages
import Home from '@/pages/Home';
import ProductListing from '@/pages/ProductListing';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Account from '@/pages/Account';
import StaticPage from '@/pages/StaticPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Campaign attribution — capture UTM / campaign params on first load
  // Checkout reads sessionStorage['lymlyn_campaign'] and attaches to order payload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const campaign = params.get('campaign') || params.get('utm_campaign');
    const source   = params.get('utm_source');
    const medium   = params.get('utm_medium');
    if (campaign || source) {
      sessionStorage.setItem('lymlyn_campaign', JSON.stringify({ campaign, source, medium, ts: Date.now() }));
    }
  }, []);

  return (
    <>
      <ScrollToTop />
      <AuthModal />
      <CartDrawer />
      <Routes>
        {/* ── Public store ── */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductListing />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          
          {/* Footer static routes */}
          <Route path="about" element={<StaticPage title="About Us" />} />
          <Route path="returns" element={<StaticPage title="Returns & Exchanges" />} />
          <Route path="privacy" element={<StaticPage title="Privacy Policy" />} />
          <Route path="terms" element={<StaticPage title="Terms & Conditions" />} />
          
          <Route path="*" element={
            <div className="container-site py-32 text-center">
              <h1 className="font-display text-4xl text-ink">Page not found</h1>
            </div>
          } />
        </Route>
      </Routes>
    </>
  );
}
