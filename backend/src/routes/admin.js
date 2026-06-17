const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../services/supabaseAdminClient');
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const { requireRole } = require('../middleware/verifyAdminRole');

// All admin routes require auth
router.use(verifySupabaseToken);

// Shorthand role sets
const SUPER = ['super_admin'];
const MANAGERS = ['super_admin', 'manager'];
const SUPPORT_UP = ['super_admin', 'manager', 'support'];
const ALL_ADMIN = ['super_admin', 'manager', 'support', 'packer'];

// ─── Audit log helper ────────────────────────────────────────────────────────
async function writeAudit(adminId, action, targetTable, targetId, details) {
  try {
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
    });
  } catch (e) {
    console.error('Audit log write failed:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/products', requireRole(...MANAGERS), async (req, res) => {
  const { product, variants } = req.body;
  try {
    let productData;
    if (product.id) {
      const { data, error } = await supabaseAdmin.from('products').update(product).eq('id', product.id).select().single();
      if (error) throw error;
      productData = data;
    } else {
      const { data, error } = await supabaseAdmin.from('products').insert(product).select().single();
      if (error) throw error;
      productData = data;
    }
    if (variants?.length) {
      const { error } = await supabaseAdmin.from('product_variants')
        .upsert(variants.map((v) => ({ ...v, product_id: productData.id })), { onConflict: 'sku' });
      if (error) throw error;
    }
    await writeAudit(req.user.id, product.id ? 'product.update' : 'product.create', 'products', productData.id, { name: productData.name });
    res.json({ product: productData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload-image', requireRole(...MANAGERS), async (req, res) => {
  const { product_id, variant_id, image_type, sort_order = 0, image_data, file_name } = req.body;
  if (!product_id || !image_data || !image_type || !file_name)
    return res.status(400).json({ error: 'Missing required fields' });
  try {
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const contentType = image_data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const storagePath = `products/${product_id}/${file_name}`;
    const { error: uploadError } = await supabaseAdmin.storage.from('product-images').upload(storagePath, buffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabaseAdmin.storage.from('product-images').getPublicUrl(storagePath);
    const { data, error } = await supabaseAdmin.from('product_images').insert({ product_id, variant_id: variant_id || null, image_url: publicUrl, image_type, sort_order }).select().single();
    if (error) throw error;
    res.json({ image: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/orders', requireRole(...ALL_ADMIN), async (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`*, profiles(full_name, phone), order_items(id, quantity, unit_price, product_variants(sku, color_name, size, products(name)))`)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ orders: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/orders/:id', requireRole(...ALL_ADMIN), async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  // Packers can only mark as shipped
  const role = req.user.admin_role;
  if (role === 'packer' && status !== 'shipped')
    return res.status(403).json({ error: 'Packers can only mark orders as shipped' });
  if (!allowed.includes(status))
    return res.status(400).json({ error: `Invalid status` });
  try {
    const { data: before } = await supabaseAdmin.from('orders').select('status').eq('id', req.params.id).single();
    const { data, error } = await supabaseAdmin.from('orders').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;
    await writeAudit(req.user.id, 'order.status_change', 'orders', req.params.id, { from: before?.status, to: status });
    res.json({ order: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/customers', requireRole(...SUPPORT_UP), async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabaseAdmin
      .from('profiles')
      .select(`id, full_name, phone, created_at, body_type, fit_preference`)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (search) query = query.ilike('full_name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ customers: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', requireRole(...SUPPORT_UP), async (req, res) => {
  const role = req.user.admin_role;
  try {
    const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    const { data: orders } = await supabaseAdmin.from('orders').select('id, status, total_amount, created_at').eq('user_id', req.params.id).order('created_at', { ascending: false });
    const orderCount = orders?.length || 0;
    const lifetimeValue = orders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
    res.json({
      profile,
      orders: orders || [],
      order_count: orderCount,
      // Support cannot see revenue — null it out
      lifetime_value: role === 'support' ? null : lifetimeValue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/inventory', requireRole(...MANAGERS), async (req, res) => {
  const { low_stock } = req.query;
  try {
    let query = supabaseAdmin
      .from('product_variants')
      .select(`id, sku, color_name, size, stock_qty, low_stock_threshold, products(id, name, slug)`)
      .order('stock_qty', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    const filtered = low_stock === 'true'
      ? data.filter((v) => v.stock_qty <= (v.low_stock_threshold || 5))
      : data;
    res.json({ variants: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/inventory/:variantId', requireRole(...MANAGERS), async (req, res) => {
  const { change_qty, reason, new_threshold } = req.body;
  try {
    if (new_threshold !== undefined) {
      await supabaseAdmin.from('product_variants').update({ low_stock_threshold: new_threshold }).eq('id', req.params.variantId);
    }
    if (change_qty !== undefined) {
      // Get current stock
      const { data: variant } = await supabaseAdmin.from('product_variants').select('stock_qty').eq('id', req.params.variantId).single();
      const newQty = Math.max(0, (variant?.stock_qty || 0) + change_qty);
      const { data, error } = await supabaseAdmin.from('product_variants').update({ stock_qty: newQty }).eq('id', req.params.variantId).select().single();
      if (error) throw error;
      // Write movement record
      await supabaseAdmin.from('inventory_movements').insert({ variant_id: req.params.variantId, change_qty, reason: reason || 'manual_adjustment', admin_id: req.user.id });
      await writeAudit(req.user.id, 'inventory.adjustment', 'product_variants', req.params.variantId, { change_qty, reason, new_qty: newQty });
      return res.json({ variant: data });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/:variantId/movements', requireRole(...MANAGERS), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory_movements')
      .select(`*, profiles(full_name)`)
      .eq('variant_id', req.params.variantId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ movements: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/coupons', requireRole(...MANAGERS), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ coupons: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', requireRole(...MANAGERS), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('coupons').upsert(req.body, { onConflict: 'id' }).select().single();
    if (error) throw error;
    await writeAudit(req.user.id, req.body.id ? 'coupon.update' : 'coupon.create', 'coupons', data.id, { code: data.code });
    res.json({ coupon: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/reviews', requireRole(...SUPPORT_UP), async (req, res) => {
  const { status } = req.query;
  try {
    let query = supabaseAdmin
      .from('reviews')
      .select(`*, profiles(full_name), products(name, slug)`)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ reviews: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reviews/:id', requireRole(...SUPPORT_UP), async (req, res) => {
  const { status } = req.body;
  if (!['published', 'hidden'].includes(status))
    return res.status(400).json({ error: 'status must be published or hidden' });
  try {
    const { data, error } = await supabaseAdmin.from('reviews').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;
    await writeAudit(req.user.id, `review.${status}`, 'reviews', req.params.id, {});
    res.json({ review: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM & ROLES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/team', requireRole(...SUPER), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, admin_role, created_at')
      .not('admin_role', 'is', null)
      .order('created_at');
    if (error) throw error;
    res.json({ team: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/team/:userId', requireRole(...SUPER), async (req, res) => {
  const { admin_role } = req.body;
  const validRoles = ['super_admin', 'manager', 'support', 'packer', null];
  if (!validRoles.includes(admin_role))
    return res.status(400).json({ error: 'Invalid admin_role' });
  try {
    const { data: before } = await supabaseAdmin.from('profiles').select('admin_role').eq('id', req.params.userId).single();
    const { data, error } = await supabaseAdmin.from('profiles').update({ admin_role }).eq('id', req.params.userId).select('id, full_name, admin_role').single();
    if (error) throw error;
    await writeAudit(req.user.id, 'role.assign', 'profiles', req.params.userId, { from: before?.admin_role, to: admin_role });
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit-log', requireRole(...SUPER), async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_audit_log')
      .select(`*, profiles(full_name)`)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (error) throw error;
    res.json({ log: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/analytics', requireRole(...MANAGERS), async (req, res) => {
  const { range = '30' } = req.query; // days
  const role = req.user.admin_role;
  try {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(range));

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, created_at, status')
      .gte('created_at', since.toISOString())
      .in('status', ['paid', 'shipped', 'delivered']);

    const revenue = orders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
    const orderCount = orders?.length || 0;
    const avgOrderValue = orderCount ? revenue / orderCount : 0;

    // Daily revenue breakdown
    const daily = {};
    (orders || []).forEach((o) => {
      const day = o.created_at.split('T')[0];
      daily[day] = (daily[day] || 0) + Number(o.total_amount);
    });

    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`id, total_amount, status, created_at, profiles(full_name)`)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: lowStock } = await supabaseAdmin
      .from('product_variants')
      .select(`id, sku, stock_qty, low_stock_threshold, products(name)`)
      .order('stock_qty', { ascending: true })
      .limit(10);

    const lowStockAlerts = (lowStock || []).filter((v) => v.stock_qty <= (v.low_stock_threshold || 5));

    res.json({
      // Support role cannot see revenue figures
      revenue: role === 'support' ? null : revenue,
      order_count: orderCount,
      avg_order_value: role === 'support' ? null : avgOrderValue,
      daily_revenue: role === 'support' ? null : daily,
      recent_orders: recentOrders || [],
      low_stock_alerts: lowStockAlerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
