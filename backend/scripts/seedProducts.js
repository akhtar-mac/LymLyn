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
    term: "men t-shirt flat lay white background clothing only",
    type: 'tshirt', count: 10, fit: 'regular', namePrefix: "Men's",
    images: ['/products/black-tshirt-v2.png', '/products/striped-tshirt-v2.png', '/products/graphic-tshirt-v2.png']
  },
  {
    term: "women t-shirt flat lay white background clothing product",
    type: 'tshirt', count: 10, fit: 'regular', namePrefix: "Women's",
    images: ['/products/womens-croptop-v2.png', '/products/womens-blouse-v2.png']
  },
  {
    term: "folded jeans flat lay clothing product photography white background",
    type: 'lower', count: 10, fit: 'regular', namePrefix: "Men's",
    images: ['/products/cargo-pants-v2.png', '/products/grey-joggers-v2.png']
  },
  {
    term: "women jeans trousers flat lay white background clothing product",
    type: 'lower', count: 10, fit: 'regular', namePrefix: "Women's",
    images: ['/products/womens-flared-jeans-v2.png', '/products/womens-skirt-v2.png']
  }
];

async function seed() {
  console.log('--- Seeding Products with Perfect AI Garments ---');
  
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
    
    // Fetch unique images from Pexels
    let fetchedImages = [];
    try {
      // Fetch clothing-only flat-lay photos from Pexels (no models/people)
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q.term)}&per_page=${q.count}&orientation=square`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      const pexelsData = await pexelsRes.json();
      if (pexelsData.photos && pexelsData.photos.length > 0) {
        fetchedImages = pexelsData.photos.map(p => p.src.large);
      }
    } catch (e) {
      console.error('Failed to fetch from Pexels for', q.term, e.message);
    }

    // Fallback if Pexels fails
    if (fetchedImages.length === 0) {
      fetchedImages = q.images;
    }
    
    for (let i = 0; i < q.count; i++) {
      const name = `${q.namePrefix} ${q.type === 'tshirt' ? 'T-Shirt' : 'Pants'} - Style ${i+1}`;
      const slug = `${q.namePrefix.toLowerCase().replace(/[^a-z]/g, '')}-${q.type}-style-${i+1}-${Math.random().toString(36).substring(2, 7)}`;
      const basePrice = Math.floor(Math.random() * (2500 - 999) + 999);
      
      const categoryId = q.type === 'tshirt' ? tCat.id : q.type === 'lower' ? lCat.id : aCat.id;
      
      // Assign a unique image if possible
      const selectedImage = fetchedImages[i] || fetchedImages[Math.floor(Math.random() * fetchedImages.length)];

      // 30% chance of being on sale
      const isDiscounted = Math.random() > 0.7;
      const compareAtPrice = isDiscounted ? Math.floor(basePrice * 1.3) : null;

      // 1. Insert product
      const { data: product, error: pErr } = await supabase.from('products').insert({
        category_id: categoryId,
        name,
        slug,
        description: `Premium ${q.term} featuring high quality fabric.`,
        base_price: basePrice,
        garment_type: q.type,
        fit_type: q.fit,
        is_active: true
      }).select().single();

      if (pErr) {
        console.error("Failed to insert product:", pErr);
        continue;
      }

      // 2. Insert product image
      const { error: iErr } = await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: selectedImage,
        image_type: 'lifestyle',
        sort_order: 1
      });

      // Insert an explicit cutout type for Virtual Try-On so it prefers this image
      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: selectedImage,
        image_type: 'cutout',
        sort_order: 2
      });

      if (iErr) console.error("Failed to insert image:", iErr);

      // 3. Insert some variants (colors and sizes)
      const colors = [
        { name: 'Primary', hex: '#000000' }
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
      
      console.log(`  ✓ Inserted: ${name}`);
    }
  }

  console.log('Seed complete. Check the database.');
}

seed().catch(console.error);
