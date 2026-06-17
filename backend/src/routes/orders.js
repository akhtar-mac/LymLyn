const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const supabaseAdmin = require('../services/supabaseAdminClient');
const verifySupabaseToken = require('../middleware/verifySupabaseToken');

// Lazy Razorpay client — instantiated on first use so the server starts without keys in .env
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in backend/.env');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

/**
 * POST /api/orders
 * Create order in DB + Razorpay order. Requires auth.
 * Body: { items: [{ variant_id, quantity, unit_price }], shipping_address }
 */
router.post('/', verifySupabaseToken, async (req, res) => {
  const { items, shipping_address } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // Validate each variant and check stock
  for (const item of items) {
    const { data: variant, error } = await supabaseAdmin
      .from('product_variants')
      .select('id, stock_qty, sku')
      .eq('id', item.variant_id)
      .single();

    if (error || !variant) {
      return res.status(400).json({ error: `Variant ${item.variant_id} not found` });
    }
    if (variant.stock_qty < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for SKU ${variant.sku}` });
    }
  }

  const total_amount = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  try {
    const razorpay = getRazorpay();

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total_amount * 100),
      currency: 'INR',
      receipt: `lymlyn_${Date.now()}`,
    });

    // Create order record in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: req.user.id === 'dummy-user-1' ? null : req.user.id,
        status: 'pending',
        total_amount,
        razorpay_order_id: razorpayOrder.id,
        shipping_address,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.json({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
