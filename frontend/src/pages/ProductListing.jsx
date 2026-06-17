import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { productsApi } from '@/lib/api';

const FILTER_TYPES = [
  { label: 'All', value: '' },
  { label: 'T-Shirts', value: 'tshirt' },
  { label: 'Lowers', value: 'lower' },
];

const FIT_TYPES = [
  { label: 'Any Fit', value: '' },
  { label: 'Regular', value: 'regular' },
  { label: 'Oversized', value: 'oversized' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeType = searchParams.get('type') || '';
  const activeFit = searchParams.get('fit') || '';
  const activeGender = searchParams.get('gender') || '';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeType) params.garment_type = activeType;
    if (activeFit) params.fit_type = activeFit;

    productsApi.list(params)
      .then((res) => {
        let fetched = res.products || [];
        
        // Gender filter
        if (activeGender === 'female') {
          fetched = fetched.filter(p => p.name.toLowerCase().includes('womens') || p.name.toLowerCase().includes("women's"));
        } else if (activeGender === 'male') {
          fetched = fetched.filter(p => !p.name.toLowerCase().includes('womens') && !p.name.toLowerCase().includes("women's"));
        }

        // Search text filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          fetched = fetched.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }

        setProducts(fetched);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeType, activeFit, activeGender, searchQuery]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const activeFiltersCount = [activeType, activeFit, activeGender].filter(Boolean).length;

  return (
    <div className="container-site py-10 md:py-16">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">Catalogue</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink capitalize">
          {searchQuery ? (
            <>Search: <span className="text-accent">{searchQuery}</span></>
          ) : (
            <>
              {activeGender === 'female' ? "Women's " : activeGender === 'male' ? "Men's " : ""}
              {activeType === 'tshirt' ? 'T-Shirts' : activeType === 'lower' ? 'Lowers' : 'Collection'}
            </>
          )}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="flex items-center gap-1.5 text-xs text-muted font-medium">
          <SlidersHorizontal size={14} /> Filters
        </span>

        {FILTER_TYPES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter('type', f.value)}
            className={`px-4 py-2 text-xs font-medium tracking-wide border transition-all duration-200
              ${activeType === f.value
                ? 'bg-ink text-white border-ink'
                : 'bg-surface text-muted border-border hover:border-ink hover:text-ink'
              }`}
          >
            {f.label}
          </button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        {FIT_TYPES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter('fit', f.value)}
            className={`px-4 py-2 text-xs font-medium tracking-wide border transition-all duration-200
              ${activeFit === f.value
                ? 'bg-ink text-white border-ink'
                : 'bg-surface text-muted border-border hover:border-ink hover:text-ink'
              }`}
          >
            {f.label}
          </button>
        ))}

        {activeFiltersCount > 0 && (
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-dark transition-colors ml-2"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted mb-6">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      )}

      <ProductGrid products={products} loading={loading} columns={3} />
    </div>
  );
}
