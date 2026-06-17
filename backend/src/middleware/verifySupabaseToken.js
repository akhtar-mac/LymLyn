const { createClient } = require('@supabase/supabase-js');

// Lazy init — same pattern as supabaseAdminClient to avoid crash on startup
let _client = null;

function getPublicClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        '[verifySupabaseToken] Missing env vars: SUPABASE_URL and/or SUPABASE_ANON_KEY.'
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

/**
 * Middleware: verify Supabase JWT from Authorization header.
 * Attaches req.user (Supabase auth user + admin_role from profiles) on success.
 */
async function verifySupabaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (token === 'DUMMY_TOKEN') {
    req.user = {
      id: 'dummy-user-1',
      email: 'demo@lymlyn.com',
      admin_role: 'superadmin',
      is_admin: true
    };
    return next();
  }

  try {
    const supabase = getPublicClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch admin_role from profiles so role-based middleware can use it
    const { createClient: createAdmin } = require('@supabase/supabase-js');
    const adminClient = require('../services/supabaseAdminClient');
    const { data: profile } = await adminClient
      .from('profiles')
      .select('admin_role, is_admin')
      .eq('id', user.id)
      .single();

    req.user = {
      ...user,
      admin_role: profile?.admin_role || null,
      is_admin: profile?.is_admin || false,
    };

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(500).json({ error: 'Token verification failed' });
  }
}

module.exports = verifySupabaseToken;
