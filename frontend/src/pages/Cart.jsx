import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const { user, setAuthModal } = useAuthStore();

  if (items.length === 0) {
    return (
      <div className="container-site py-32 text-center animate-fade-in">
        <ShoppingBag size={64} strokeWidth={1} className="mx-auto text-muted mb-6" />
        <h1 className="font-display text-3xl font-bold text-ink mb-3">Your cart is empty</h1>
        <p className="text-muted text-sm mb-8">Add something you love.</p>
        <Link to="/products" className="btn-primary px-8">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-site py-10 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-10">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-0 divide-y divide-border">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 py-6 animate-fade-in">
              {/* Thumbnail */}
              <div className="w-24 h-28 md:w-28 md:h-36 shrink-0 bg-surface overflow-hidden border border-border">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-border/30" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <Link
                    to={`/products/${item.slug}`}
                    className="font-display text-base font-semibold text-ink hover:text-accent transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Remove item"
                    className="text-muted hover:text-accent transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-4 mt-1.5 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-border"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    {item.colorName}
                  </span>
                  <span>Size: {item.size}</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Quantity */}
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-2 hover:bg-border/50 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-2 hover:bg-border/50 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <span className="font-sans font-semibold text-sm text-ink">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="font-display text-xl font-bold text-ink mb-6">Order Summary</h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal ({items.length} items)</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className="text-accent font-medium">Free</span>
              </div>
            </div>

            <div className="divider mb-5" />

            <div className="flex justify-between font-display text-lg font-bold text-ink mb-6">
              <span>Total</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {user ? (
              <Link to="/checkout" id="checkout-btn" className="btn-primary w-full py-4 text-base">
                Checkout <ArrowRight size={18} />
              </Link>
            ) : (
              <button
                id="checkout-login-btn"
                onClick={() => setAuthModal(true)}
                className="btn-primary w-full py-4 text-base"
              >
                Log in to Checkout <ArrowRight size={18} />
              </button>
            )}

            <Link to="/products" className="btn-ghost w-full mt-3 text-xs">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
