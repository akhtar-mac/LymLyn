import usePermission from '@/hooks/usePermission';

/**
 * RequirePermission — conditionally renders children based on RBAC capability.
 *
 * Props:
 *   capability {string}   — e.g. 'orders.view'
 *   fallback  {ReactNode} — optional element to show if denied (default: null)
 *
 * Usage:
 *   <RequirePermission capability="refunds.approve">
 *     <ApproveRefundButton />
 *   </RequirePermission>
 *
 *   // With a "read-only" fallback:
 *   <RequirePermission capability="products.manage" fallback={<span className="text-muted">View only</span>}>
 *     <EditProductButton />
 *   </RequirePermission>
 */
export default function RequirePermission({ capability, fallback = null, children }) {
  const { can } = usePermission(capability);
  return can ? children : fallback;
}
