const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_URL === '000') {
  console.error('Missing real SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const QUERIES = [
  { term: 'folded t-shirt flat lay white background clothing product photography', type: 'tshirt', count: 4, fit: 'regular', gender: 'female' },
  { term: 'oversized tee folded flat lay white background clothing product', type: 'tshirt', count: 4, fit: 'oversized', gender: 'female' },
  { term: 'folded jeans trousers flat lay white background clothing product photography', type: 'lower', count: 4, fit: 'regular', gender: 'female' },
  { term: 'jacket folded flat lay white background clothing product photography', type: 'upper', count: 4, fit: 'regular', gender: 'female' }
];

async function fetchPexelsPhotos(query, perPage) {
  try {
    // Use orientation=square + content_filter=high to get clean product shots without people
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=square&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    const data = await res.json();
    return data.photos || [];
  } catch (error) {
    return [];
  }
}

async function seed() {
  console.log('--- Seeding Women\'s Products ---');
  
  // Ensure categories exist
  const { data: tCat } = await supabase.from('categories').upsert({ slug: 't-shirts', name: 'T-Shirts' }, { onConflict: 'slug' }).select().single();
  const { data: lCat } = await supabase.from('categories').upsert({ slug: 'lowers', name: 'Lowers' }, { onConflict: 'slug' }).select().single();
  const { data: jCat } = await supabase.from('categories').upsert({ slug: 'jackets', name: 'Jackets' }, { onConflict: 'slug' }).select().single();
  
  for (const q of QUERIES) {
    console.log(`Fetching ${q.count} photos for "${q.term}"...`);
    const photos = await fetchPexelsPhotos(q.term, q.count);
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const name = `${q.term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Style ${i+1}`;
      const slug = `${q.term.replace(/[^a-z0-9]+/gi, '-')}-style-${i+1}-${Math.random().toString(36).substring(2, 7)}`.toLowerCase();
      const basePrice = Math.floor(Math.random() * (2500 - 999) + 999);
      
      let categoryId = tCat.id;
      if (q.type === 'lower') categoryId = lCat.id;
      if (q.type === 'upper') categoryId = jCat.id;

      const { data: product, error: pErr } = await supabase.from('products').insert({
        category_id: categoryId,
        name,
        slug,
        description: `Premium ${q.term} specifically designed for women. High quality fabric and excellent fit.`,
        base_price: basePrice,
        garment_type: q.type === 'upper' ? 'tshirt' : q.type, // Fallback since garment_type check constraint might not allow 'upper'
        fit_type: q.fit,
        is_active: true
      }).select().single();

      if (pErr) continue;

      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: photo.src.large,
        image_type: 'lifestyle',
        sort_order: 1
      });

      const colors = [
        { name: 'Black', hex: '#000000' },
        { name: 'Pink', hex: '#FFC0CB' },
        { name: 'Beige', hex: '#F5F5DC' }
      ];
      
      const variants = colors.flatMap(c => 
        ['XS', 'S', 'M', 'L'].map(s => ({
          product_id: product.id,
          size: s,
          color_name: c.name,
          color_hex: c.hex,
          sku: `${slug}-${c.name.charAt(0)}-${s}`.toUpperCase(),
          stock_qty: Math.floor(Math.random() * 50) + 10
        }))
      );

      await supabase.from('product_variants').insert(variants);
      console.log(`  ✓ Inserted: ${name}`);
    }
  }
  console.log('Seed complete.');
}

seed();
