import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === '000' || !supabaseAnonKey || supabaseAnonKey === '000') {
  console.warn(
    '[Supabase] Missing env vars. Copy admin/.env.example to admin/.env and fill in your Supabase credentials.'
  );
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseAnonKey = 'placeholder-anon-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
