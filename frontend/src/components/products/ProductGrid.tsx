import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useCart } from '../../contexts/CartContext';
import WishlistButton from './WishlistButton';
import PriceTag, { isOnSale } from './PriceTag';
import StarRating from './StarRating';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  sizes: string[];
  category: string;
  description?: string;
  salePrice?: number;
  ratingAvg?: number;
  ratingCount?: number;
  createdAt?: string;
}

interface ProductGridProps {
  activeSort?: string;
  activeFilters?: { brands: string[]; categories: string[] };
  query?: string;
}

const BRANDS = ['Luxe Minimal', 'Studio C', 'Aethel', 'Oversize Archive'];

// Products added within the last 14 days get a "NEW" badge.
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const isNewProduct = (p: Product): boolean => {
  if (!p.createdAt) return false;
  const created = new Date(p.createdAt).getTime();
  return Number.isFinite(created) && Date.now() - created < NEW_WINDOW_MS;
};

const ProductGrid = ({ activeSort = 'newest', activeFilters, query }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const { addToCart }           = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // We fetch everything and filter/sort locally for the mockup
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        let data: Product[] = await response.json();

        // Inject mock brands and sub-categories
        data = data.map((p, i) => {
          let cat = 'Tops';
          if (p.name.includes('Jeans') || p.name.includes('Trousers')) cat = 'Bottoms';
          else if (p.category === 'footwear') cat = 'Shoes';
          else if (p.category === 'accessories') cat = 'Accessories';
          else if (p.name.includes('Coat')) cat = 'Outerwear';

          return {
            ...p,
            brand: BRANDS[i % BRANDS.length],
            subCategory: cat
          };
        });

        // 1. Search
        if (query) {
          const fuse = new Fuse(data, {
            keys: [{ name: 'name', weight: 2 }, { name: 'category', weight: 1 }, { name: 'description', weight: 0.5 }],
            threshold: 0.35,
            ignoreLocation: true,
          });
          data = fuse.search(query).map((r) => r.item);
        }

        // 2. Filter
        if (activeFilters) {
          if (activeFilters.brands.length > 0) {
            data = data.filter(p => activeFilters.brands.includes((p as any).brand));
          }
          if (activeFilters.categories.length > 0) {
            // Also support top-level routing categories ('men', 'women') as fallback
            data = data.filter(p => 
              activeFilters.categories.includes((p as any).subCategory) ||
              activeFilters.categories.includes(p.category)
            );
          }
        }

        // 3. Sort
        data.sort((a, b) => {
          if (activeSort === 'price-asc') return a.price - b.price;
          if (activeSort === 'price-desc') return b.price - a.price;
          if (activeSort === 'rating') return (b.ratingAvg || 0) - (a.ratingAvg || 0);
          // default: newest
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeSort, activeFilters, query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-[1.5px] border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-muted text-sm" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-muted text-sm" style={{ fontFamily: 'var(--font-body)' }}>
          {query ? `No products match "${query}".` : 'No products found in this category.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        // Gallery of angles — fall back to the single image for older products.
        const gallery = product.images?.length ? product.images : [product.image];
        return (
        <div key={product.id} className="card group flex flex-col relative">

          <WishlistButton productId={product.id} className="absolute top-3 right-3 z-10" />

          {/* Image — hover swaps to the second angle with a crossfade */}
          <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-[3/4]">
            <img
              src={gallery[0]}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            {gallery.length > 1 && (
              <img
                src={gallery[1]}
                alt={`${product.name} — another angle`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100
                  transition-all duration-700 group-hover:scale-105"
              />
            )}
            {/* Category badge */}
            <span
              className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-white/90 text-ink capitalize"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {product.category}
            </span>
            {/* SALE badge (sits under the category badge) */}
            {isOnSale(product.price, product.salePrice) && (
              <span
                className="absolute top-12 left-3 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full bg-red-600 text-white uppercase"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Sale
              </span>
            )}
            {/* NEW badge for recently added products */}
            {isNewProduct(product) && (
              <span
                className="absolute top-3 right-14 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full bg-ink text-white uppercase"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                New
              </span>
            )}

            {/* Angle dots — highlight follows the hover image swap */}
            {gallery.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {gallery.slice(0, 3).map((src, i) => (
                  <span
                    key={src}
                    className={`w-1.5 h-1.5 rounded-full shadow transition-colors duration-300 ${
                      i === 0
                        ? 'bg-white group-hover:bg-white/40'
                        : i === 1
                          ? 'bg-white/40 group-hover:bg-white'
                          : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="p-5 flex flex-col flex-grow">
            <Link
              to={`/product/${product.id}`}
              className="text-base text-ink hover:opacity-60 transition-opacity mb-1 leading-snug"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.name}
            </Link>

            {(product.ratingCount ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 mb-1">
                <StarRating value={product.ratingAvg || 0} />
                <span className="text-[11px] text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                  ({product.ratingCount})
                </span>
              </span>
            )}
            <div className="flex items-center justify-between mt-2 mb-4">
              <PriceTag price={product.price} salePrice={product.salePrice} />
              <div className="flex gap-1">
                {product.sizes.slice(0, 3).map((size) => (
                  <span
                    key={size}
                    className="text-[11px] px-1.5 py-0.5 border border-border text-muted rounded"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-2 relative">
              {/* Default state button */}
              <div tabIndex={0} className="w-full h-10 border-[1.5px] border-ink text-ink flex items-center justify-center text-sm font-medium transition-colors lg:group-hover:bg-ink lg:group-hover:text-surface focus-within:bg-ink focus-within:text-surface rounded-full cursor-pointer relative overflow-hidden group/quickadd">
                <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 lg:group-hover:-translate-y-full group-focus-within/quickadd:-translate-y-full pointer-events-none">
                  Quick Add
                </span>
                
                {/* Size selector reveals on hover inside the button footprint */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-ink text-surface translate-y-full transition-transform duration-300 lg:group-hover:translate-y-0 group-focus-within/quickadd:translate-y-0 px-2">
                  {product.sizes.slice(0, 4).map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          quantity: 1,
                          size: size,
                        });
                      }}
                      className="text-xs px-2 py-1.5 rounded hover:bg-white/20 transition-colors focus:outline-none focus:bg-white/20"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {size}
                    </button>
                  ))}
                  {product.sizes.length > 4 && <span className="text-xs px-1 pointer-events-none">...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
