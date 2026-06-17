/**
 * api.js — wrapper for all calls to the Node.js backend.
 * The Vite dev proxy routes /api → http://localhost:4000.
 * In production, set VITE_API_URL to your Render/Railway URL.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchWithAuth(path, options = {}) {
  const { supabase } = await import('./supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getBySlug: (slug) => fetchWithAuth(`/api/products/${slug}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (body) =>
    fetchWithAuth('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (body) =>
    fetchWithAuth('/api/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Admin — generic get/post/patch helpers ────────────────────────────────────
export const adminApi = {
  get: (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`${path}${qs ? `?${qs}` : ''}`);
  },
  post: (path, body) =>
    fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) =>
    fetchWithAuth(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) =>
    fetchWithAuth(path, { method: 'DELETE' }),

  // ── Products ──
  saveProduct: (body) =>
    fetchWithAuth('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  uploadImage: (body) =>
    fetchWithAuth('/api/admin/upload-image', { method: 'POST', body: JSON.stringify(body) }),

  // ── Orders ──
  listOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/orders${qs ? `?${qs}` : ''}`);
  },
  updateOrderStatus: (id, status) =>
    fetchWithAuth(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Customers ──
  listCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/customers${qs ? `?${qs}` : ''}`);
  },
  getCustomer: (id) => fetchWithAuth(`/api/admin/customers/${id}`),

  // ── Inventory ──
  listInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/inventory${qs ? `?${qs}` : ''}`);
  },
  adjustInventory: (variantId, body) =>
    fetchWithAuth(`/api/admin/inventory/${variantId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getMovements: (variantId) => fetchWithAuth(`/api/admin/inventory/${variantId}/movements`),

  // ── Coupons ──
  listCoupons: () => fetchWithAuth('/api/admin/coupons'),
  saveCoupon: (body) =>
    fetchWithAuth('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),

  // ── Reviews ──
  listReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
  },
  updateReview: (id, status) =>
    fetchWithAuth(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Team ──
  listTeam: () => fetchWithAuth('/api/admin/team'),
  setRole: (userId, admin_role) =>
    fetchWithAuth(`/api/admin/team/${userId}`, { method: 'PATCH', body: JSON.stringify({ admin_role }) }),

  // ── Audit log ──
  getAuditLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/admin/audit-log${qs ? `?${qs}` : ''}`);
  },

  // ── Analytics ──
  getAnalytics: (range = '30') => fetchWithAuth(`/api/admin/analytics?range=${range}`),
};
