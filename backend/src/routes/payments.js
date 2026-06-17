const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabaseAdmin = require('../services/supabaseAdminClient');
const verifySupabaseToken = require('../middleware/verifySupabaseToken');

/**
 * POST /api/payments/verify
 * Client-side payment completion: verify Razorpay signature and mark order paid.
 */
router.post('/verify', verifySupabaseToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    // Update order status to paid
    let query = supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (req.user.id !== 'dummy-user-1') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query.select().single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found or update failed' });
    }

    res.json({ success: true, order: data });
  } catch (err) {
    console.error('POST /api/payments/verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay async webhook — backup confirmation path.
 * Body comes in as raw Buffer (see app.js middleware).
 */
router.post('/webhook', async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (!webhookSecret || !signature) {
    return res.status(400).json({ error: 'Missing webhook secret or signature' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body) // raw Buffer
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;

    try {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: payment.id,
        })
        .eq('razorpay_order_id', payment.order_id)
        .eq('status', 'pending'); // idempotent — only update if still pending
    } catch (err) {
      console.error('Webhook DB update error:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
