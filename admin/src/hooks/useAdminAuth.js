import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

const ALL_ROLES = ['super_admin', 'manager', 'sales', 'finance', 'shipping', 'inventory', 'support', 'marketing', 'packer'];

/**
 * useAdminAuth — enforces admin gate and exposes role + capability helpers.
 * Redirects non-admins to /login immediately.
 */
export default function useAdminAuth() {
  const { user, profile, loading } = useAuthStore();
  const navigate = useNavigate();
  const role = profile?.admin_role || null;

  useEffect(() => {
    if (!loading && (!user || !role || !ALL_ROLES.includes(role))) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, role, navigate]);

  /** Check one specific capability against the permission matrix */
  const can = (capability) => hasPermission(role, capability);

  /** Legacy helpers kept for backward compat with existing pages */
  const isSuperAdmin = role === 'super_admin' || role === 'manager';
  const isManager    = isSuperAdmin || role === 'sales' || role === 'inventory';
  const isSupport    = role === 'support';
  const isPacker     = role === 'packer' || role === 'shipping';

  return { user, profile, role, loading, can, isSuperAdmin, isManager, isSupport, isPacker };
}
