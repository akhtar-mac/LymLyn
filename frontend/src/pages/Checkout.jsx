import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader, Tag, X, MessageCircle } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { ordersApi } from '@/lib/api';

const INITIAL_ADDRESS = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export default function Checkout() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState(() => {
    let savedAddress = { ...INITIAL_ADDRESS };
    if (profile?.address) {
      try {
        const parsed = JSON.parse(profile.address);
        savedAddress = {
          ...savedAddress,
          line1: parsed.street || '',
          city: parsed.city || '',
          state: parsed.state || '',
          pincode: parsed.pincode || '',
        };
      } catch (e) {}
    }
    return {
      ...savedAddress,
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState(null); // { code, discount_percent, discount_amount }
  const [couponError, setCouponError] = useState('');

  // WhatsApp opt-in (required for Meta compliance)
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = couponData
    ? couponData.discount_percent
      ? Math.round(subtotal * couponData.discount_percent / 100)
      : (couponData.discount_amount || 0)
    : 0;
  const total = subtotal - discountAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone' || name === 'pincode') {
      finalValue = value.replace(/\D/g, ''); // strip non-digits
      if (name === 'phone' && finalValue.length > 13) finalValue = finalValue.slice(0, 13);
      if (name === 'pincode' && finalValue.length > 6) finalValue = finalValue.slice(0, 6);
    }
    setAddress((a) => ({ ...a, [name]: finalValue }));
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponData(null);
    try {
      const res = await fetch(`/api/discounts/validate?code=${encodeURIComponent(couponInput.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.message || 'Invalid coupon code.');
      setCouponData(data);
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const campaignRaw = sessionStorage.getItem('lymlyn_campaign');
      const campaignAttribution = campaignRaw ? JSON.parse(campaignRaw) : null;

      const orderPayload = {
        items: items.map((i) => ({
          variant_id: i.variantId,
          quantity: i.quantity,
          unit_price: i.price,
        })),
        shipping_address: address,
        coupon_code: couponData?.code || null,
        discount_amount: discountAmount,
        whatsapp_opt_in: whatsappOptIn,
        campaign_attribution: campaignAttribution,
      };

      const orderData = await ordersApi.create(orderPayload);

      // Load Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'LYM|LYN',
        description: 'Premium clothing order',
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: address.full_name,
          contact: address.phone,
        },
        theme: { color: '#A23B33' },
        handler: async (response) => {
          try {
            await ordersApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            navigate('/account?tab=orders&success=1');
          } catch {
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      // Razorpay Checkout.js must be loaded via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container-site py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold text-ink mb-10">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping form */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-display text-xl font-bold text-ink mb-6">Shipping Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="input-label">Full Name</label>
                <input id="full_name" name="full_name" required value={address.full_name} onChange={handleChange} className="input" placeholder="Ravi Sharma" />
              </div>
              <div>
                <label htmlFor="phone" className="input-label">Phone (WhatsApp)</label>
                <input
                  id="phone" name="phone" required
                  value={address.phone} onChange={handleChange}
                  className="input" placeholder="+91 98765 43210"
                  pattern="[+]?[0-9]{10,13}"
                  title="Enter a valid phone number (10-13 digits)"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="line1" className="input-label">Address Line 1</label>
              <input id="line1" name="line1" required value={address.line1} onChange={handleChange} className="input" placeholder="House/Flat no., Street, Area" />
            </div>
            <div className="mt-4">
              <label htmlFor="line2" className="input-label">Address Line 2 (optional)</label>
              <input id="line2" name="line2" value={address.line2} onChange={handleChange} className="input" placeholder="Landmark, Building name" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="city" className="input-label">City</label>
                <input id="city" name="city" required value={address.city} onChange={handleChange} className="input" placeholder="Mumbai" />
              </div>
              <div>
                <label htmlFor="state" className="input-label">State</label>
                <input id="state" name="state" required value={address.state} onChange={handleChange} className="input" placeholder="Maharashtra" />
              </div>
              <div>
                <label htmlFor="pincode" className="input-label">Pincode</label>
                <input id="pincode" name="pincode" required pattern="[0-9]{6}" value={address.pincode} onChange={handleChange} className="input" placeholder="400001" />
              </div>
            </div>
          </div>

          {/* WhatsApp Opt-In — required for Meta compliance */}
          <div className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border">
            <input
              type="checkbox"
              id="whatsapp_opt_in"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-accent shrink-0 cursor-pointer"
            />
            <label htmlFor="whatsapp_opt_in" className="text-sm text-muted leading-snug cursor-pointer">
              <span className="flex items-center gap-1.5 text-ink font-medium mb-0.5">
                <MessageCircle size={14} className="text-green-500" /> WhatsApp updates
              </span>
              Receive order updates and exclusive offers via WhatsApp. You can unsubscribe anytime by replying STOP.
            </label>
          </div>

          {error && (
            <p className="text-sm text-accent animate-fade-in">{error}</p>
          )}

          <button
            id="place-order-btn"
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
            {loading ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')} via Razorpay`}
          </button>
        </form>

        {/* Order summary */}
        <div className="card h-fit sticky top-24">
          <h2 className="font-display text-xl font-bold text-ink mb-5">Order ({items.length})</h2>
          <div className="space-y-4 mb-5">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-3">
                <div className="w-14 h-16 shrink-0 bg-border/30 overflow-hidden">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted">{item.colorName} · {item.size} · ×{item.quantity}</p>
                  <p className="text-sm font-semibold text-ink mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon code input */}
          <div className="mb-4">
            <label className="input-label mb-1.5 block">Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                placeholder="SUMMER10"
                className="input flex-1 uppercase"
                disabled={!!couponData}
              />
              {couponData ? (
                <button
                  type="button"
                  onClick={() => { setCouponData(null); setCouponInput(''); setCouponError(''); }}
                  className="px-3 py-2 text-muted hover:text-accent transition-colors"
                  aria-label="Remove coupon"
                >
                  <X size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="btn-secondary px-4 py-2 text-sm shrink-0 flex items-center gap-1.5"
                >
                  {couponLoading ? <Loader size={14} className="animate-spin" /> : <Tag size={14} />}
                  Apply
                </button>
              )}
            </div>
            {couponData && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                <Check size={12} /> {couponData.code} applied — saving ₹{discountAmount.toLocaleString('en-IN')}
              </p>
            )}
            {couponError && <p className="text-xs text-accent mt-1.5">{couponError}</p>}
          </div>

          <div className="divider mb-4" />

          <div className="space-y-2 text-sm mb-3">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon ({couponData?.code})</span>
                <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-accent font-medium">Free</span>
            </div>
          </div>

          <div className="divider mb-3" />
          <div className="flex justify-between font-display font-bold text-ink">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-muted mt-2">Inclusive of all taxes. Free shipping.</p>
        </div>
      </div>
    </div>
  );
}
