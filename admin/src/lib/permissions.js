/**
 * PERMISSION MATRIX
 * Each role maps to an array of capability strings.
 * 'super_admin' gets the wildcard '*' which bypasses all checks.
 */
export const PERMISSIONS = {
  super_admin: ['*'],
  sales: [
    'orders.view', 'orders.update_status', 'customers.view',
    'discounts.manage', 'analytics.sales.view', 'coupon_requests.fulfill',
  ],
  finance: [
    'payments.view', 'refunds.approve', 'payouts.manage',
    'invoices.view', 'analytics.finance.view', 'orders.view',
  ],
  shipping: [
    'orders.view', 'fulfillment.manage', 'carriers.manage',
    'returns.manage', 'shipping.tracking.update',
  ],
  inventory: [
    'products.manage', 'stock.manage', 'variants.manage',
    'inventory.alerts.view', 'suppliers.manage', 'categories.manage',
  ],
  support: [
    'orders.view', 'customers.view', 'refunds.request', 'tickets.manage',
  ],
  marketing: [
    'campaigns.create', 'campaigns.send_small', 'campaigns.request_approval',
    'coupons.view', 'customers.segment_view', 'catalog.view',
    'analytics.marketing.view', 'coupon_requests.create',
  ],
  // Legacy roles kept for backward compatibility
  manager: ['*'],
  packer: ['orders.view', 'fulfillment.manage'],
};

/**
 * hasPermission — pure function, no hooks.
 * @param {string|null} role  The staff member's role string
 * @param {string} capability  The capability to check (e.g. 'orders.view')
 * @returns {boolean}
 */
export function hasPermission(role, capability) {
  if (!role) return false;
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(capability);
}

export default PERMISSIONS;
