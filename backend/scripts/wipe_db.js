const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function wipe() {
  console.log('Wiping database...');
  // We just delete everything from products since cascading deletes will handle product_images and product_variants
  const { data: products, error: pErr } = await supabase.from('products').select('id');
  if (pErr) {
    console.error('Error fetching products:', pErr);
    process.exit(1);
  }

  if (products && products.length > 0) {
    const ids = products.map(p => p.id);
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      await supabase.from('products').delete().in('id', chunk);
    }
    console.log(`Deleted ${products.length} products (cascaded to variants and images).`);
  } else {
    console.log('No products found to delete.');
  }

  console.log('Wipe complete.');
}

wipe();
