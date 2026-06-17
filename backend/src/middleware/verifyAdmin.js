const supabaseAdmin = require('../services/supabaseAdminClient');

/**
 * Middleware: check that the authenticated user has is_admin = true on their profile.
 * Must run AFTER verifySupabaseToken (requires req.user).
 */
async function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin verification error:', err);
    return res.status(500).json({ error: 'Admin verification failed' });
  }
}

module.exports = verifyAdmin;
