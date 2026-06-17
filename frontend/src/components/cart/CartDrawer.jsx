import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '@/store/cartStore';

export default function CartDrawer() {
  const { items, cartOpen, setCartOpen, removeItem, updateQuantity } = useCartStore();
  // Compute inline — Zustand getter-style computed values are NOT reactive when destructured
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const navigate = useNavigate();

  if (!cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-bg shadow-2xl z-[101] flex flex-col animate-slide-in-right border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-2xl font-bold text-ink">Your Cart</h2>
          <button 
            onClick={() => setCartOpen(false)}
            className="p-2 -mr-2 text-muted hover:text-ink transition-colors rounded-full hover:bg-surface"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-muted mb-4">
                <ShoppingBag size={24} />
              </div>
              <h3 className="font-display text-xl font-medium text-ink">Your cart is empty</h3>
              <p className="text-sm text-muted">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => {
                  setCartOpen(false);
                  navigate('/products');
                }}
                className="btn-secondary mt-8"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4 group">
                  <Link 
                    to={`/products/${item.slug}`} 
                    onClick={() => setCartOpen(false)}
                    className="w-20 h-24 bg-surface rounded-md overflow-hidden shrink-0"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-border text-muted">
                        No Image
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link 
                          to={`/products/${item.slug}`}
                          onClick={() => setCartOpen(false)} 
                          className="font-display text-sm font-semibold text-ink hover:text-accent line-clamp-1 pr-4"
                        >
                          {item.name}
                        </Link>
                        <button 
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted hover:text-accent transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-muted mt-1 uppercase tracking-wider">
                        {item.colorName} / {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border rounded-md bg-surface">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-border/50 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-ink">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-border/50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-sans text-sm font-semibold text-ink">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-surface/50">
            <div className="flex items-center justify-between mb-4">
              <span className="font-sans text-sm font-medium text-muted">Subtotal</span>
              <span className="font-sans text-lg font-bold text-ink">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-muted mb-6">Shipping and taxes calculated at checkout.</p>
            <button 
              onClick={() => {
                setCartOpen(false);
                navigate('/checkout'); // Or wherever checkout goes
              }}
              className="btn-primary w-full py-4 text-base flex justify-center items-center gap-2"
            >
              Secure Checkout <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
