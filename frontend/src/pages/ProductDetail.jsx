import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Wand2, Check, Minus, Plus } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { productsApi } from '@/lib/api';
import TryOnModal from '@/components/tryon/TryOnModal';
import Skeleton from '@/components/ui/Skeleton';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    productsApi.getBySlug(slug)
      .then((res) => {
        setProduct(res.product);
        const colors = getColors(res.product?.product_variants);
        if (colors.length) setSelectedColor(colors[0].color_hex);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const getColors = (variants = []) =>
    [...new Map(variants.map((v) => [v.color_hex, v])).values()];

  const getSizesForColor = (colorHex) =>
    product?.product_variants?.filter((v) => v.color_hex === colorHex) || [];

  const getVariant = () =>
    product?.product_variants?.find(
      (v) => v.color_hex === selectedColor && v.size === selectedSize
    );

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    // 1. Auth Guard
    const { user, setAuthModal } = useAuthStore.getState();
    if (!user) {
      setAuthModal(true);
      return;
    }

    const variant = getVariant();
    if (!variant) return;

    const images = product.product_images || [];
    const img = images.find((i) => i.image_type === 'lifestyle') || images[0];

    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      colorName: variant.color_name,
      colorHex: variant.color_hex,
      size: variant.size,
      price: product.base_price,
      quantity,
      imageUrl: img?.image_url,
      slug: product.slug,
    });

    // 3. Open Drawer
    useCartStore.getState().setCartOpen(true);
  };

  if (loading) {
    return (
      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="w-full aspect-[3/4]" />
          <div className="space-y-6">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/5" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="pt-8 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            </div>
            <div className="pt-8 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="w-12 h-12" />
                <Skeleton className="w-12 h-12" />
                <Skeleton className="w-12 h-12" />
              </div>
            </div>
            <div className="pt-8 space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-site py-32 text-center">
        <h1 className="font-display text-3xl text-muted">Product not found</h1>
        <Link to="/products" className="btn-primary mt-8 inline-flex">Back to shop</Link>
      </div>
    );
  }

  const colors = getColors(product.product_variants);
  const sizesForColor = getSizesForColor(selectedColor);
  const images = product.product_images || [];
  const activeVariant = getVariant();
  const inStock = activeVariant ? activeVariant.stock_qty > 0 : false;

  return (
    <div className="container-site py-10 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link to="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-ink transition-colors">Products</Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
        {/* ── Image Gallery ── */}
        <div>
          <div className="relative aspect-[3/4] bg-surface overflow-hidden mb-3">
            {images[activeImage] ? (
              <img
                src={images[activeImage].image_url}
                alt={`${product.name} view ${activeImage + 1}`}
                className="w-full h-full object-cover animate-fade-in"
                key={activeImage}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted bg-border/30">
                No image
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setActiveImage((i) => Math.min(images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-20 overflow-hidden border-2 transition-all
                    ${activeImage === i ? 'border-ink' : 'border-transparent hover:border-border'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col">
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">
            {product.categories?.name}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mb-3">
            {product.name}
          </h1>
          <p className="font-sans text-2xl font-semibold text-ink mb-6">
            ₹{Number(product.base_price).toLocaleString('en-IN')}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted leading-relaxed mb-8">{product.description}</p>
          )}

          <div className="divider mb-6" />

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="mb-6">
              <label className="input-label">
                Colour — <span className="normal-case font-normal text-ink">
                  {colors.find((c) => c.color_hex === selectedColor)?.color_name}
                </span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((v) => (
                  <button
                    key={v.color_hex}
                    title={v.color_name}
                    style={{ backgroundColor: v.color_hex }}
                    onClick={() => { setSelectedColor(v.color_hex); setSelectedSize(null); }}
                    className={`w-8 h-8 rounded-full border-4 transition-all
                      ${selectedColor === v.color_hex
                        ? 'border-ink ring-2 ring-ink ring-offset-1'
                        : 'border-white hover:border-border'
                      }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="input-label">Size</label>
              <button className="text-xs text-muted underline hover:text-ink">Size guide</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((size) => {
                const variant = sizesForColor.find((v) => v.size === size);
                const available = variant && variant.stock_qty > 0;
                return (
                  <button
                    key={size}
                    disabled={!available}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 text-sm font-medium border transition-all relative
                      ${!available
                        ? 'border-border text-muted/40 cursor-not-allowed'
                        : selectedSize === size
                          ? 'border-ink bg-ink text-white'
                          : 'border-border text-ink hover:border-ink'
                      }`}
                  >
                    {size}
                    {!available && variant === undefined && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-full h-px bg-border/60 rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {sizeError && (
              <p className="text-xs text-accent mt-2 animate-fade-in">Please select a size</p>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="input-label">Quantity</label>
            <div className="flex items-center gap-3 w-fit border border-border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-border/50 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-medium text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-3 hover:bg-border/50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!inStock && !!selectedSize}
              className={`btn-primary w-full text-base py-4 ${addedFeedback ? 'bg-accent' : ''}`}
            >
              {addedFeedback ? (
                <><Check size={18} /> Added to cart</>
              ) : !selectedSize ? (
                <><ShoppingBag size={18} /> Add to Cart</>
              ) : !inStock ? (
                'Out of Stock'
              ) : (
                <><ShoppingBag size={18} /> Add to Cart</>
              )}
            </button>

            <button
              id="try-on-btn"
              className="btn-secondary w-full text-base py-4 flex items-center justify-center gap-2"
              onClick={() => setIsTryOnOpen(true)}
            >
              <Wand2 size={18} />
              Try It On
            </button>
          </div>

          <div className="divider mt-8" />

          {/* Product meta */}
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {product.fit_type && (
              <>
                <dt className="text-muted">Fit</dt>
                <dd className="capitalize text-ink font-medium">{product.fit_type}</dd>
              </>
            )}
            {product.garment_type && (
              <>
                <dt className="text-muted">Type</dt>
                <dd className="capitalize text-ink font-medium">{product.garment_type === 'tshirt' ? 'T-Shirt' : 'Lower'}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
      
      <TryOnModal 
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        product={product}
        selectedColor={selectedColor}
      />
    </div>
  );
}
