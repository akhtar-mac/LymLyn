require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Adding address and tryon_photo_url to profiles table...');

  // Supabase REST doesn't allow raw SQL execution natively via JS client without RPC.
  // Instead of SQL, since we are doing this dynamically, we can use the backend Postgres connection 
  // or a hack: just insert a dummy profile to trigger postgREST schema cache? No, we can't alter tables via rest.
  // Wait, I can execute postgres queries via node-postgres since we have connection string, or just print instructions if not.
  // Let me check if there's pg module installed.
  
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL // usually provided in Supabase projects
    });
    
    // If DATABASE_URL is not present, we will construct it from SUPABASE_URL and DB password if possible, or fail gracefully.
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not found, skipping direct schema update. Please run this SQL in Supabase dashboard:');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tryon_photo_url TEXT;');
      process.exit(0);
    }

    await client.connect();
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tryon_photo_url TEXT;');
    await client.end();
    
    console.log('Successfully updated profiles schema.');
  } catch (err) {
    console.error('Could not run pg update, you may need to run this manually:', err.message);
    console.log('\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tryon_photo_url TEXT;');
  }
}

run();
