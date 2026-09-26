import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import WishlistButton from '../components/products/WishlistButton';
import PriceTag from '../components/products/PriceTag';
import StarRating from '../components/products/StarRating';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchProductReviews, submitReview, deleteReviewApi, Review } from '../services/api';

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
  stock?: number;
}

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [product, setProduct]           = useState<Product | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [added, setAdded]               = useState(false);
  const [isZoomed, setIsZoomed]         = useState(false);
  const [zoomPos, setZoomPos]           = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Reviews
  const { user } = useAuth();
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [ratingInput, setRatingInput]   = useState(5);
  const [reviewText, setReviewText]     = useState('');
  const [reviewError, setReviewError]   = useState<string | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSuccess, setReviewSuccess]= useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data);
        setSelectedSize(data.sizes?.[0] || 'One Size');
        setSelectedAngle(0); // reset the gallery when navigating between products
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    if (id) {
      fetchProductReviews(id).then(setReviews).catch(() => setReviews([]));
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
    addToCart({ productId: product.id, name: product.name, price: product.price,
      image: product.image, quantity: 1, size: selectedSize });
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || reviewSaving) return;
    setReviewSaving(true);
    setReviewError(null);
    setReviewSuccess(false);
    try {
      await submitReview(id, { rating: ratingInput, text: reviewText });
      setReviewText('');
      setRatingInput(5);
      setReviews(await fetchProductReviews(id));
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!id) return;
    try {
      await deleteReviewApi(id, reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      // leave the list as-is
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-8 py-16 animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="w-32 h-4 bg-border rounded mb-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-6">
            {/* Image skeleton */}
            <div className="aspect-[3/4] bg-surface rounded-2xl w-full"></div>
            
            {/* Details skeleton */}
            <div className="flex flex-col justify-center">
              <div className="w-24 h-3 bg-border rounded mb-4"></div>
              <div className="w-3/4 h-12 bg-surface rounded mb-4"></div>
              <div className="w-32 h-8 bg-surface rounded mb-6"></div>
              
              <div className="space-y-3 mb-8">
                <div className="w-full h-4 bg-surface rounded"></div>
                <div className="w-full h-4 bg-surface rounded"></div>
                <div className="w-5/6 h-4 bg-surface rounded"></div>
              </div>
              
              <div className="w-full h-14 bg-surface rounded-full mb-8"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full h-4 bg-border rounded"></div>
                <div className="w-full h-4 bg-border rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-8 py-32 text-center">
          <h1 className="text-4xl text-ink mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Product not found
          </h1>
          <Link to="/shop" className="btn-primary">Back to Shop</Link>
        </div>
      </Layout>
    );
  }

  // Gallery of angles — fall back to the single image for older products.
  const gallery = product.images?.length ? product.images : [product.image];

  return (
    <Layout>
      <Seo
        title={product.name}
        description={
          product.description?.slice(0, 155) ||
          `${product.name} — premium ${product.category} by LuxeFashion. Free worldwide shipping and 30-day returns.`
        }
        path={`/product/${product.id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: gallery,
          description: product.description || undefined,
          category: product.category,
          ...(product.ratingCount
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: product.ratingAvg,
                  reviewCount: product.ratingCount,
                },
              }
            : {}),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price:
              product.salePrice && product.salePrice > 0 && product.salePrice < product.price
                ? product.salePrice
                : product.price,
            availability:
              product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          },
        }}
      />
      <div className="max-w-7xl mx-auto px-8 py-16">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted" style={{ fontFamily: 'var(--font-body)' }}>
          <ol className="flex items-center gap-2">
            <li><Link to="/shop" className="hover:text-ink transition-colors">Shop</Link></li>
            <li><span className="opacity-40">/</span></li>
            <li className="capitalize"><Link to={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-ink transition-colors">{product.category}</Link></li>
            <li><span className="opacity-40">/</span></li>
            <li className="text-ink truncate max-w-[200px]" aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-6">

          {/* Gallery — main angle + clickable thumbnails for the other angles */}
          <div>
            <div 
              className="aspect-[3/4] overflow-hidden rounded-2xl bg-surface relative md:cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <WishlistButton productId={product.id} className="absolute top-3 right-3 z-10" />
              <img
                key={gallery[selectedAngle]}
                src={gallery[selectedAngle]}
                alt={`${product.name} — angle ${selectedAngle + 1}`}
                className={`w-full h-full object-cover animate-fade-in transition-transform duration-[400ms] ease-out ${isZoomed ? 'scale-[2.2]' : 'scale-100'}`}
                style={{
                  transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center'
                }}
              />
              <button
                type="button"
                className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-ink px-4 py-2 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                style={{ fontFamily: 'var(--font-body)' }}
                onClick={() => {
                  const dialog = document.getElementById('gallery-modal') as HTMLDialogElement;
                  if (dialog) dialog.showModal();
                }}
                aria-label="Open full screen gallery"
              >
                View Fullscreen
              </button>
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedAngle(i)}
                    aria-label={`View angle ${i + 1}`}
                    aria-pressed={selectedAngle === i}
                    className={`snap-start w-20 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                      selectedAngle === i
                        ? 'border-ink'
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <span
              className="text-xs uppercase tracking-widest text-muted mb-4"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {product.category}
            </span>

            <h1
              className="text-4xl md:text-5xl text-ink mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <PriceTag price={product.price} salePrice={product.salePrice} large />
              {(product.ratingCount ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <StarRating value={product.ratingAvg || 0} />
                  <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                    {(product.ratingAvg || 0).toFixed(1)} ({product.ratingCount})
                  </span>
                </span>
              )}
            </div>

            <p className="text-muted leading-relaxed mb-8 text-sm"
              style={{ fontFamily: 'var(--font-body)' }}>
              {product.description || 'Premium quality clothing from LuxeFashion. Crafted with the finest fabrics for lasting comfort and effortless style.'}
            </p>

            {/* Size selector */}
            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest text-ink"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  Select Size
                </h3>
                <button
                  onClick={() => dialogRef.current?.showModal()}
                  className="text-xs underline underline-offset-4 text-muted hover:text-ink transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className="min-w-12 px-4 py-2.5 rounded-full text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                    style={{
                      fontFamily : 'var(--font-body)',
                      border     : '1.5px solid',
                      borderColor: selectedSize === size ? '#000' : '#E5E5E5',
                      background : selectedSize === size ? '#000' : 'transparent',
                      color      : selectedSize === size ? '#fff' : '#6F6F6F',
                      cursor     : 'pointer',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                Fits true to size. Model is 6'1" wearing size M.
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn-primary w-full !py-4 !text-base"
            >
              Add to Cart
            </button>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
              <div className="flex items-center gap-2"><span>↩</span> Free returns within 30 days</div>
              <div className="flex items-center gap-2"><span>⚡</span> Fast worldwide shipping</div>
              <div className="flex items-center gap-2"><span>✦</span> Premium quality guarantee</div>
              <div className="flex items-center gap-2"><span>🔒</span> Secure checkout</div>
            </div>
          </div>
        </div>

        <dialog
          ref={dialogRef}
          className="backdrop:bg-black/40 backdrop:backdrop-blur-sm p-0 rounded-2xl shadow-2xl border border-border open:animate-in open:fade-in open:zoom-in-95 m-auto"
          onClick={(e) => {
            if (e.target === dialogRef.current) dialogRef.current.close();
          }}
        >
          <div className="w-[90vw] max-w-lg p-8 bg-surface">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-ink" style={{ fontFamily: 'var(--font-display)' }}>Size Guide</h2>
              <button 
                onClick={() => dialogRef.current?.close()}
                className="text-muted hover:text-ink transition-colors text-xl leading-none"
                aria-label="Close size guide"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" style={{ fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-3 font-normal">Size</th>
                    <th className="pb-3 font-normal">Chest (in)</th>
                    <th className="pb-3 font-normal">Waist (in)</th>
                    <th className="pb-3 font-normal">Length (in)</th>
                  </tr>
                </thead>
                <tbody className="text-ink">
                  <tr className="border-b border-border/50">
                    <td className="py-4 font-medium">S</td><td className="py-4">36-38</td><td className="py-4">29-31</td><td className="py-4">27</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 font-medium">M</td><td className="py-4">39-41</td><td className="py-4">32-34</td><td className="py-4">28</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-4 font-medium">L</td><td className="py-4">42-44</td><td className="py-4">35-37</td><td className="py-4">29</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium">XL</td><td className="py-4">45-48</td><td className="py-4">38-41</td><td className="py-4">30</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </dialog>

        {/* Full Screen Gallery Modal */}
        <dialog
          id="gallery-modal"
          className="backdrop:bg-black/90 p-0 m-0 w-full h-full max-w-none max-h-none bg-transparent open:animate-in open:fade-in"
          onClick={(e) => {
            const dialog = document.getElementById('gallery-modal') as HTMLDialogElement;
            if (e.target === dialog) dialog.close();
          }}
        >
          <div className="w-full h-full flex flex-col p-4 md:p-8 relative">
            <button
              onClick={() => (document.getElementById('gallery-modal') as HTMLDialogElement)?.close()}
              className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close gallery"
            >
              ✕
            </button>
            <div className="flex-1 flex items-center justify-center min-h-0 relative">
              <img
                src={gallery[selectedAngle]}
                alt={`${product.name} — angle ${selectedAngle + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-4 mt-6 overflow-x-auto pb-4 justify-start md:justify-center snap-x snap-mandatory">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setSelectedAngle(i)}
                    aria-label={`View angle ${i + 1}`}
                    aria-pressed={selectedAngle === i}
                    className={`snap-start w-20 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      selectedAngle === i
                        ? 'border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </dialog>

        {/* ── Reviews ── */}
        <section className="mt-24 border-t border-border pt-16">
          <h2 className="text-3xl text-ink mb-10" style={{ fontFamily: 'var(--font-display)' }}>
            Reviews {reviews.length > 0 && <span className="text-muted text-2xl">({reviews.length})</span>}
          </h2>

          {user ? (
            <form onSubmit={handleReviewSubmit} className="max-w-2xl mb-14 space-y-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRatingInput(i)}
                    aria-label={'Rate ' + i + ' out of 5 stars'}
                    className={`text-2xl leading-none transition-colors ${
                      i <= ratingInput ? 'text-ink' : 'text-border'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                required
                placeholder="How's the fit, fabric, and quality?"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white text-ink
                  placeholder:text-muted focus:outline-none focus:border-ink transition-colors resize-none"
              />
              {reviewError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {reviewError}
                </p>
              )}
              {reviewSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-in fade-in">
                  Thanks for your review! It has been posted below.
                </p>
              )}
              <button type="submit" disabled={reviewSaving}
                className="btn-primary !py-2.5 !px-6 !text-sm disabled:opacity-50">
                {reviewSaving ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted mb-14" style={{ fontFamily: 'var(--font-body)' }}>
              <Link to="/account" className="text-ink underline underline-offset-4 hover:opacity-60 transition-opacity">
                Sign in
              </Link>{' '}
              to write a review.
            </p>
          )}

          <div className="space-y-8 max-w-2xl">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                No reviews yet — be the first to share your thoughts.
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                        {r.authorName}
                      </span>
                      <StarRating value={r.rating} />
                      {r.verifiedPurchase && (
                        <span className="text-[11px] uppercase tracking-wide text-muted"
                          style={{ fontFamily: 'var(--font-body)' }}>
                          Verified purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted" style={{ fontFamily: 'var(--font-body)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {user?.uid === r.userId && (
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="text-xs text-red-600 hover:opacity-70 transition-opacity"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                    {r.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Animated Cart Toast */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          added ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        }`}
      >
        <div className="bg-ink text-surface px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 min-w-[320px] justify-between border border-white/10">
          <div className="flex items-center gap-4">
            <img src={product.image} alt="" className="w-10 h-10 object-cover rounded-full" />
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>Added to cart</p>
              <p className="text-xs text-surface/70 mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>{product.name} - {selectedSize}</p>
            </div>
          </div>
          <Link to="/cart" className="text-sm font-medium text-surface hover:text-white underline underline-offset-4" style={{ fontFamily: 'var(--font-body)' }}>
            View Cart
          </Link>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-border p-4 z-40 md:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink truncate max-w-[140px]" style={{ fontFamily: 'var(--font-display)' }}>
              {product.name}
            </span>
            <span className="text-sm text-ink font-medium" style={{ fontFamily: 'var(--font-body)' }}>
              ${product.price}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="btn-primary !py-3 !px-8 flex-shrink-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default ProductDetail;
