import useAuthStore from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

/**
 * usePermission — checks if the current staff user has a specific capability.
 *
 * @param {string} capability  e.g. 'orders.view', 'products.manage'
 * @returns {{ can: boolean, role: string|null }}
 *
 * Usage:
 *   const { can } = usePermission('refunds.approve');
 *   if (can) { ... }
 */
export default function usePermission(capability) {
  const { profile } = useAuthStore();
  const role = profile?.admin_role || null;
  return {
    can: hasPermission(role, capability),
    role,
  };
}
