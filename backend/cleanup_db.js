const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  const { data: images } = await supabase.from('product_images').select('product_id');
  const imageProductIds = images.map(i => i.product_id);
  
  const { data: products } = await supabase.from('products').select('id');
  const allProductIds = products.map(p => p.id);
  
  const idsToDelete = allProductIds.filter(id => !imageProductIds.includes(id));
  
  if (idsToDelete.length > 0) {
    console.log(`Deleting ${idsToDelete.length} products without images...`);
    // Delete in chunks
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50);
      const { error } = await supabase.from('products').delete().in('id', chunk);
      if (error) console.error('Delete error:', error);
    }
    console.log('Cleanup complete.');
  } else {
    console.log('No cleanup needed.');
  }
}
cleanup();
