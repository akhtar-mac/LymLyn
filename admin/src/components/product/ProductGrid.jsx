import ProductCard from './ProductCard';

/**
 * ProductGrid — renders a responsive grid of ProductCards.
 * Props:
 *   products: array of product objects
 *   loading: boolean
 *   columns: 2 | 3 | 4 (default 3)
 */
export default function ProductGrid({ products = [], loading = false, columns = 3 }) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3';

  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-4 md:gap-8`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-border mb-4" />
            <div className="h-3 bg-border rounded w-1/3 mb-2" />
            <div className="h-4 bg-border rounded w-2/3 mb-2" />
            <div className="h-3 bg-border rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl text-muted">No products found</p>
        <p className="text-sm text-muted mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-8`}>
      {products.map((product, i) => (
        <div
          key={product.id}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
