const { createClient } = require('@supabase/supabase-js');

// Lazy init — client is created on first use, not at module load.
// This prevents a crash when SUPABASE_URL is not yet set in .env.
let _client = null;

function getAdminClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        '[supabaseAdminClient] Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Copy backend/.env.example to backend/.env and fill in your Supabase credentials.'
      );
    }
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

// Proxy so callers can still write `supabaseAdmin.from(...)` etc.
module.exports = new Proxy({}, {
  get(_, prop) {
    return getAdminClient()[prop];
  },
});
