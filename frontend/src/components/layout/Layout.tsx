import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { subscribeNewsletter } from '../../services/api';
import SearchBar from './SearchBar';



const SHOP_CATEGORIES = [
  { label: 'All Collections', to: '/shop' },
  { label: 'Men', to: '/shop/men' },
  { label: 'Women', to: '/shop/women' },
  { label: 'Accessories', to: '/shop/accessories' },
  { label: 'Footwear', to: '/shop/footwear' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAdmin } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  // Newsletter signup (footer) — posts to /api/newsletter and shows feedback.
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<
    { kind: 'idle' } | { kind: 'sending' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string }
  >({ kind: 'idle' });

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newsletterStatus.kind === 'sending') return;
    setNewsletterStatus({ kind: 'sending' });
    try {
      const res = await subscribeNewsletter(newsletterEmail);
      setNewsletterStatus({ kind: 'ok', text: res.message });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Subscription failed — please try again.',
      });
    }
  };

  // Close the mobile menu on navigation, smooth-scroll to hash targets
  // (works from any page), and reset scroll to top on plain navigation.
  useEffect(() => {
    setMenuOpen(false);
    if (location.hash) {
      const id = location.hash.slice(1);
      // Wait a frame so the target page has rendered before scrolling.
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash]);

  // Subtle shadow-on-scroll
  useEffect(() => {
    const onScroll = () => {
      if (!headerRef.current) return;
      headerRef.current.style.borderBottomColor = window.scrollY > 10 ? '#E5E5E5' : 'transparent';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu with Escape (keyboard accessibility).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Skip link — first focusable element for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]
          focus:bg-ink focus:text-white focus:px-4 focus:py-2 focus:rounded-full text-sm"
      >
        Skip to content
      </a>

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-transparent transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="text-xl sm:text-2xl tracking-tight select-none text-ink font-display"
          >
            LuxeFashion<sup className="text-xs align-super">®</sup>
          </Link>

          {/* Centre links */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Shop Dropdown */}
            <div
              className="relative py-2"
              onMouseEnter={() => setShopDropdownOpen(true)}
              onMouseLeave={() => setShopDropdownOpen(false)}
            >
              <Link
                to="/shop"
                className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <span>Shop</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180 text-ink' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {/* Dropdown Menu */}
              <div
                className={`absolute top-full -left-4 w-48 bg-white border border-border rounded-2xl shadow-xl py-2 z-50 transition-all duration-200 ${
                  shopDropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                {SHOP_CATEGORIES.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setShopDropdownOpen(false)}
                    className="block px-5 py-2.5 text-xs text-muted hover:text-ink hover:bg-surface transition-colors font-body"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/#collections"
              className="text-sm text-muted hover:text-ink transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Collections
            </Link>
            <Link
              to="/#story"
              className="text-sm text-muted hover:text-ink transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Our Story
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Search */}
            <SearchBar />

            {/* Wishlist */}
            <Link to="/wishlist" className="relative text-ink hover:opacity-70 transition-opacity p-1" aria-label="View wishlist">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-ink text-white text-[10px] font-semibold
                  min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart icon */}
            <Link to="/cart" className="relative text-ink hover:opacity-70 transition-opacity p-1" aria-label="View cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-ink text-white text-[10px] font-semibold
                  min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:inline-block text-sm text-muted hover:text-ink transition-colors font-body"
              >
                Admin
              </Link>
            )}
            <Link
              to="/account"
              className="hidden md:inline-block text-sm text-muted hover:text-ink transition-colors font-body"
            >
              Account
            </Link>

            {/* CTA */}
            <Link to="/shop?sort=new" className="btn-primary !py-2 !px-5 !text-sm hidden md:inline-flex">
              New Arrivals
            </Link>

            {/* Mobile menu toggle (44x44px touch target) */}
            <button
              type="button"
              className="md:hidden text-ink hover:opacity-70 transition-opacity p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ink"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu full-screen overlay ─────────────────────────────────
           Rendered OUTSIDE <header> so its z-index resolves against the document
           root stacking context, not the header's sticky z-50 context.  ───── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] bg-white flex flex-col justify-between overflow-y-auto animate-fade-in">
          {/* Mobile Header Bar */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-border flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="text-xl sm:text-2xl tracking-tight select-none text-ink font-display"
            >
              LuxeFashion<sup className="text-xs align-super">®</sup>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-ink p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ink"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Links */}
          <div className="px-6 sm:px-8 py-6 flex-1">
            {/* Shop Accordion / Dropdown */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setMobileShopOpen(!mobileShopOpen)}
                className="w-full flex items-center justify-between text-3xl text-ink font-display py-2"
              >
                <span>Shop</span>
                <svg className={`w-5 h-5 text-muted transition-transform duration-200 ${mobileShopOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileShopOpen && (
                <div className="pl-3 mt-3 space-y-3 border-l-2 border-border font-body">
                  {SHOP_CATEGORIES.map(({ label, to }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="block text-base text-muted hover:text-ink transition-colors py-1"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Link
                to="/#collections"
                onClick={() => setMenuOpen(false)}
                className="block text-3xl text-ink font-display py-2 hover:opacity-70 transition-opacity"
              >
                Collections
              </Link>
              <Link
                to="/#story"
                onClick={() => setMenuOpen(false)}
                className="block text-3xl text-ink font-display py-2 hover:opacity-70 transition-opacity"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-8 py-8 border-t border-border bg-surface/40 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="text-xs uppercase tracking-widest text-ink hover:opacity-60 transition-opacity font-body font-medium"
              >
                Account
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="text-xs uppercase tracking-widest text-ink hover:opacity-60 transition-opacity font-body font-medium"
              >
                Wishlist ({wishlistCount})
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="text-xs uppercase tracking-widest text-ink hover:opacity-60 transition-opacity font-body font-medium"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
            <Link
              to="/shop?sort=new"
              onClick={() => setMenuOpen(false)}
              className="btn-primary w-full py-4 text-center mt-2"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      )}

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-grow">{children}</main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            {/* Brand */}
            <div>
              <p className="text-2xl tracking-tight text-ink mb-3"
                style={{ fontFamily: 'var(--font-display)' }}>
                LuxeFashion<sup className="text-xs align-super">®</sup>
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Premium clothing for the modern wardrobe. Quality fabrics, clean silhouettes.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-ink mb-5 font-body font-medium">Shop</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><Link to="/shop" className="hover:text-ink transition-colors">All Collections</Link></li>
                <li><Link to="/shop/men" className="hover:text-ink transition-colors">Men</Link></li>
                <li><Link to="/shop/women" className="hover:text-ink transition-colors">Women</Link></li>
                <li><Link to="/shop/accessories" className="hover:text-ink transition-colors">Accessories</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-ink mb-5 font-body font-medium">Support</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><Link to="/info/faq" className="hover:text-ink transition-colors">FAQ</Link></li>
                <li><Link to="/info/shipping-returns" className="hover:text-ink transition-colors">Shipping & Returns</Link></li>
                <li><Link to="/info/size-guide" className="hover:text-ink transition-colors">Size Guide</Link></li>
                <li><a href="mailto:support@luxefashion.com" className="hover:text-ink transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-ink mb-5 font-body font-medium">Stay in the Loop</h4>
              <p className="text-sm text-muted mb-4">New arrivals, editorial drops, and exclusive access.</p>
              <form className="flex" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterStatus.kind !== 'idle') setNewsletterStatus({ kind: 'idle' });
                  }}
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="flex-grow min-w-0 text-sm border border-border rounded-l-full px-4 py-2 focus:outline-none
                    focus:border-ink bg-white placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus.kind === 'sending'}
                  className="bg-ink text-white text-sm px-4 py-2 rounded-r-full hover:opacity-80 transition-opacity
                    disabled:opacity-50"
                >
                  {newsletterStatus.kind === 'sending' ? '…' : 'Join'}
                </button>
              </form>
              {newsletterStatus.kind === 'ok' && (
                <p className="text-xs text-ink mt-3">{newsletterStatus.text}</p>
              )}
              {newsletterStatus.kind === 'error' && (
                <p className="text-xs text-red-600 mt-3">{newsletterStatus.text}</p>
              )}
            </div>
          </div>

          <div className="divider mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4
            text-xs text-muted">
            <p>© 2025 LuxeFashion. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/info/privacy" className="hover:text-ink transition-colors">Privacy</Link>
              <Link to="/info/terms" className="hover:text-ink transition-colors">Terms</Link>
              <Link to="/info/cookies" className="hover:text-ink transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
