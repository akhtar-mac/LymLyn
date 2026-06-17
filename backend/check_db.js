const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p, error: pe } = await supabase.from('products').select('*');
  console.log('Products:', p ? p.length : pe);
  const { data: v, error: ve } = await supabase.from('product_variants').select('*');
  console.log('Variants:', v ? v.length : ve);
  const { data: i, error: ie } = await supabase.from('product_images').select('*');
  console.log('Images:', i ? i.length : ie);
}
check();
