const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../services/supabaseAdminClient');

/**
 * GET /api/products
 * List products with optional filters: category, garment_type, is_active
 */
router.get('/', async (req, res) => {
  try {
    const { category, garment_type, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories ( id, name, slug ),
        product_variants ( id, color_name, color_hex, size, stock_qty, sku ),
        product_images ( id, image_url, image_type, sort_order, variant_id )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category) query = query.eq('categories.slug', category);
    if (garment_type) query = query.eq('garment_type', garment_type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ products: data });
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:slug
 * Single product by slug with full variant and image data
 */
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories ( id, name, slug ),
        product_variants ( id, color_name, color_hex, size, stock_qty, sku ),
        product_images ( id, image_url, image_type, sort_order, variant_id )
      `)
      .eq('slug', req.params.slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: data });
  } catch (err) {
    console.error('GET /api/products/:slug error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
