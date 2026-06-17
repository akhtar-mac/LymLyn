import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingBag, Shirt } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';

/**
 * ProductCard — used in grids throughout the site.
 * Props: product (full product object from Supabase/API)
 */
export default function ProductCard({ product }) {
  const [hoveredColor, setHoveredColor] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  // Gather unique colors across all variants
  const colors = product.product_variants
    ? [...new Map(
        product.product_variants.map((v) => [v.color_hex, v])
      ).values()]
    : [];

  // Pick the image to show — prefer lifestyle, else flat_front
  const activeColorHex = hoveredColor || colors[0]?.color_hex;
  const images = product.product_images || [];
  const displayImage =
    images.find((img) => img.image_type === 'lifestyle') ||
    images.find((img) => img.image_type === 'flat_front') ||
    null;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Auth Guard
    const { user, setAuthModal } = useAuthStore.getState();
    if (!user) {
      setAuthModal(true);
      return;
    }

    // 2. Add to Cart
    const variant = product.product_variants?.find(
      (v) => v.color_hex === activeColorHex && v.stock_qty > 0
    );
    if (!variant) return;

    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      colorName: variant.color_name,
      colorHex: variant.color_hex,
      size: variant.size,
      price: product.base_price,
      imageUrl: displayImage?.image_url,
      slug: product.slug,
    });

    // 3. Open Drawer
    useCartStore.getState().setCartOpen(true);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block relative"
      aria-label={product.name}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-surface overflow-hidden mb-4">
        {displayImage ? (
          <img
            src={displayImage.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted bg-border/30">
            <Shirt size={48} strokeWidth={1} />
          </div>
        )}

        {/* Quick-add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleQuickAdd}
            className={`w-full py-3 text-sm font-medium font-sans tracking-wide flex items-center justify-center gap-2 transition-colors
              ${addedFeedback
                ? 'bg-accent text-white'
                : 'bg-ink text-white hover:bg-accent'
              }`}
          >
            <ShoppingBag size={16} />
            {addedFeedback ? 'Added!' : 'Quick Add'}
          </button>
        </div>

        {/* Badges */}
        {product.compare_at_price > product.base_price ? (
          <div className="absolute top-3 left-3 badge bg-accent text-white text-xs px-3">
            Sale
          </div>
        ) : product.product_variants?.every((v) => v.stock_qty === 0) ? (
          <div className="absolute top-3 left-3 badge bg-muted/80 text-white text-xs px-3">
            Sold Out
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p className="font-sans text-xs text-muted uppercase tracking-widest">
          {product.categories?.name || (product.garment_type === 'tshirt' ? 'T-Shirt' : 'Lower')}
        </p>
        <h3 className="font-display text-base font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          {product.compare_at_price > product.base_price && (
            <p className="font-sans text-sm font-medium text-muted line-through">
              ₹{Number(product.compare_at_price).toLocaleString('en-IN')}
            </p>
          )}
          <p className={`font-sans text-sm font-medium ${product.compare_at_price > product.base_price ? 'text-accent' : 'text-ink'}`}>
            ₹{Number(product.base_price).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {colors.slice(0, 6).map((v) => (
              <button
                key={v.color_hex}
                title={v.color_name}
                aria-label={v.color_name}
                style={{ backgroundColor: v.color_hex }}
                onMouseEnter={() => setHoveredColor(v.color_hex)}
                onMouseLeave={() => setHoveredColor(null)}
                onClick={(e) => { e.preventDefault(); setHoveredColor(v.color_hex); }}
                className={`w-4 h-4 rounded-full border-2 transition-all
                  ${activeColorHex === v.color_hex
                    ? 'border-ink scale-110'
                    : 'border-transparent hover:border-muted'
                  }`}
              />
            ))}
            {colors.length > 6 && (
              <span className="text-xs text-muted self-center">+{colors.length - 6}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
