const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_URL === '000') {
  console.error('Missing real SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

if (!PEXELS_API_KEY || PEXELS_API_KEY === '000') {
  console.error('Missing real PEXELS_API_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const QUERIES = [
  { 
    term: "men t-shirt",
    type: 'tshirt', count: 1, fit: 'regular', namePrefix: "Men's Minimalist",
    images: ['/products/tshirt-front-offwhite.png', '/products/tshirt-back-offwhite.png']
  },
  {
    term: "women t-shirt",
    type: 'tshirt', count: 1, fit: 'regular', namePrefix: "Women's Minimalist",
    images: ['/products/womens-tshirt-offwhite.png']
  },
  {
    term: "men trousers",
    type: 'lower', count: 1, fit: 'regular', namePrefix: "Men's Minimalist",
    images: ['/products/mens-trousers-offwhite.png']
  },
  {
    term: "women trousers",
    type: 'lower', count: 1, fit: 'regular', namePrefix: "Women's Minimalist",
    images: ['/products/womens-trousers-offwhite.png']
  }
];

async function seed() {
  console.log('--- Seeding Products with Minimalist Off-White Garments ---');
  
  // 1. Ensure categories exist
  const { data: tCat, error: tErr } = await supabase.from('categories').upsert({ slug: 't-shirts', name: 'T-Shirts' }, { onConflict: 'slug' }).select().single();
  const { data: lCat, error: lErr } = await supabase.from('categories').upsert({ slug: 'lowers', name: 'Lowers' }, { onConflict: 'slug' }).select().single();
  const { data: aCat, error: aErr } = await supabase.from('categories').upsert({ slug: 'accessories', name: 'Accessories' }, { onConflict: 'slug' }).select().single();
  
  if (!tCat || !lCat || !aCat) {
    console.error("Failed to ensure categories exist", { tErr, lErr, aErr });
    process.exit(1);
  }

  for (const q of QUERIES) {
    console.log(`Creating ${q.count} items for "${q.term}"...`);
    
    let fetchedImages = q.images;
    
    for (let i = 0; i < q.count; i++) {
      const name = `${q.namePrefix} ${q.type === 'tshirt' ? 'T-Shirt' : 'Pants'}`;
      const slug = `${q.namePrefix.toLowerCase().replace(/[^a-z]/g, '')}-${q.type}-${Math.random().toString(36).substring(2, 7)}`;
      const basePrice = Math.floor(Math.random() * (2500 - 999) + 999);
      
      const categoryId = q.type === 'tshirt' ? tCat.id : q.type === 'lower' ? lCat.id : aCat.id;

      // 1. Insert product
      const { data: product, error: pErr } = await supabase.from('products').insert({
        category_id: categoryId,
        name,
        slug,
        description: `Premium minimalist ${q.term} featuring high quality fabric and an off-white aesthetic.`,
        base_price: basePrice,
        garment_type: q.type,
        fit_type: q.fit,
        is_active: true
      }).select().single();

      if (pErr) {
        console.error("Failed to insert product:", pErr);
        continue;
      }

      // 2. Insert product images
      for (let j = 0; j < fetchedImages.length; j++) {
        const { error: iErr } = await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: fetchedImages[j],
          image_type: 'lifestyle',
          sort_order: j
        });
        if (iErr) console.error("Failed to insert image:", iErr);
      }

      // Insert an explicit cutout type for Virtual Try-On using the primary image
      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: fetchedImages[0],
        image_type: 'cutout',
        sort_order: 99
      });


      // 3. Insert some variants (colors and sizes)
      const colors = [
        { name: 'Charcoal', hex: '#333333' }
      ];
      
      const sizes = ['S', 'M', 'L', 'XL'];
      const variants = [];

      for (const c of colors) {
        for (const s of sizes) {
          variants.push({
            product_id: product.id,
            size: s,
            color_name: c.name,
            color_hex: c.hex,
            sku: `${slug}-${c.name.charAt(0)}-${s}`.toUpperCase(),
            stock_qty: Math.floor(Math.random() * 50) + 10
          });
        }
      }

      const { error: vErr } = await supabase.from('product_variants').insert(variants);
      if (vErr) console.error("Failed to insert variants:", vErr);
      
      console.log(`  ✓ Inserted: ${name} with ${fetchedImages.length} images`);
    }
  }

  console.log('Seed complete. Check the database.');
}

seed().catch(console.error);
