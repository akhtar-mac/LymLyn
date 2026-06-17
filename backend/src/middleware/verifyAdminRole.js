/**
 * requireRole(...allowedRoles) — factory that returns middleware
 * checking req.user.admin_role is in the allowed set.
 * Must run AFTER verifySupabaseToken (which populates req.user).
 *
 * Usage:
 *   router.post('/products', requireRole('super_admin','manager'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.admin_role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: role || 'none',
      });
    }
    next();
  };
}

module.exports = { requireRole };
