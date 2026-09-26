import { FormEvent, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createPaymentIntent, validatePromo, ShippingAddress } from '../services/api';
import { paymentsConfigured, stripePromise } from '../config/stripe';
import ProductGrid from '../components/products/ProductGrid';

const inputClass =
  'w-full border border-border rounded-xl px-4 py-3 text-sm bg-white text-ink ' +
  'placeholder:text-muted focus:border-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const labelClass = 'block text-xs uppercase tracking-widest text-ink font-medium mb-2';

const EMPTY_ADDRESS: ShippingAddress = {
  name: '', email: '', phone: '', address: '', city: '', zipCode: '', country: '',
};

type Stage = 'cart' | 'checkout' | 'payment' | 'done';

const SVGIcons = {
  Lock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  ArrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  Minus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  CheckCircle: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
};

function PaymentForm({ total, onPaid }: { total: number; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || paying) return;
    setPaying(true);
    setError(null);

    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });

    if (result.error) {
      setError(result.error.message || 'Payment failed — please try again.');
      setPaying(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      onPaid();
    } else {
      setError('Payment was not completed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <PaymentElement />
      {error && (
        <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 font-body">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn-primary w-full py-4 disabled:opacity-50"
      >
        {paying ? 'Processing…' : 'Pay $' + total.toFixed(2)}
      </button>
      <div className="flex items-center justify-center gap-2 text-xs text-muted font-body">
        {SVGIcons.Lock} Payments are encrypted and processed securely by Stripe.
      </div>
    </form>
  );
}

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, total, itemCount } = useCart();
  const { user, signIn, signUp, loading: authLoading } = useAuth();

  const [stage, setStage] = useState<Stage>('cart');
  
  // Auth state for inline login/register
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [payableTotal, setPayableTotal] = useState(0);

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff: number; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);

  const setField = (key: keyof ShippingAddress, value: string) =>
    setAddress((a) => ({ ...a, [key]: value }));

  // Hydrate address if user changes
  useEffect(() => {
    if (user) {
      setAddress((a) => ({
        ...a,
        name: a.name || user.displayName || '',
        email: a.email || user.email || '',
      }));
    }
  }, [user]);

  const handleInlineAuth = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (authMode === 'login') {
        await signIn(authEmail, authPass);
      } else {
        await signUp(authEmail, authPass, authName);
      }
      // Success triggers user effect, we can naturally proceed
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const startCheckout = () => {
    setOrderError(null);
    setStage('checkout');
  };

  const startPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return; // Protected by UI
    setPlacing(true);
    setOrderError(null);
    try {
      const payment = await createPaymentIntent({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size })),
        shippingAddress: address,
        promoCode: appliedPromo?.code,
      });
      setClientSecret(payment.clientSecret);
      setPlacedOrderId(payment.orderId);
      setPayableTotal(payment.totalAmount);
      setStage('payment');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Could not start payment — please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handlePaid = () => {
    clearCart();
    setClientSecret(null);
    setAppliedPromo(null);
    setPromoError(null);
    setStage('done');
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code || promoApplying) return;
    setPromoApplying(true);
    setPromoError(null);
    try {
      const result = await validatePromo(code, total);
      setAppliedPromo({ code: result.code, percentOff: result.percentOff, discount: result.discount });
      setPromoInput('');
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Invalid promo code');
    } finally {
      setPromoApplying(false);
    }
  };

  const displayTotal = appliedPromo ? Math.max(0, total - appliedPromo.discount) : total;

  // ── Order placed ───────────────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-8 py-40 text-center">
          <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-ink text-surface flex items-center justify-center">
            {SVGIcons.CheckCircle}
          </div>
          <h1 className="text-4xl md:text-5xl text-ink mb-4 font-display">
            Thank you<em className="text-muted italic">.</em>
          </h1>
          <p className="text-muted mb-2 text-sm font-body">
            Your payment was successful — your order is confirmed.
          </p>
          {placedOrderId && (
            <p className="text-muted mb-10 text-sm font-body">
              Order reference: <span className="text-ink font-medium">#{placedOrderId.slice(0, 8).toUpperCase()}</span>
              {' '}— track it any time from your Account page.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
            <Link to="/account" className="btn-secondary">View Order History</Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl text-ink mb-4 font-display">
            Your Cart is Empty
          </h1>
          <p className="text-muted mb-10 text-sm font-body">
            Looks like you haven't added anything yet.
          </p>
          <div className="mb-20">
            <Link to="/shop" className="btn-primary inline-flex">
              Explore Collection
            </Link>
          </div>
        </div>
        
        {/* Engagement Grid for Empty State */}
        <div className="border-t border-border bg-surface pt-20 pb-28">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-2xl text-ink mb-8 font-display text-center">Trending Now</h2>
            <ProductGrid activeSort="rating" activeFilters={{ brands: [], categories: [] }} />
          </div>
        </div>
      </Layout>
    );
  }

  // ── Cart / checkout ────────────────────────────────────────────────────────
  return (
    <Layout>
      <Seo
        title="Your Cart"
        description="Review your selected pieces and check out securely."
        path="/cart"
        noindex
      />
      <div className="max-w-7xl mx-auto px-8 py-16">

        {/* Stepper Header */}
        <div className="mb-14 flex flex-col items-center">
          <div className="flex items-center gap-4 text-xs tracking-widest uppercase font-body mb-6">
            <span className={stage === 'cart' ? 'text-ink font-medium' : 'text-muted'}>1. Cart</span>
            <span className="w-8 h-px bg-border"></span>
            <span className={stage === 'checkout' ? 'text-ink font-medium' : 'text-muted'}>2. Shipping</span>
            <span className="w-8 h-px bg-border"></span>
            <span className={stage === 'payment' ? 'text-ink font-medium' : 'text-muted'}>3. Payment</span>
          </div>
          <h1 className="text-4xl md:text-5xl text-ink font-display">
            {stage === 'cart' ? 'Your Cart' : stage === 'checkout' ? 'Checkout' : 'Payment'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {stage === 'cart' ? (
            /* ── Cart items ─────────────────────────────────────────────── */
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-ink font-body">Item</span>
                <span className="text-sm font-medium text-ink font-body">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              </div>
              
              {cart.map((item) => (
                <div key={item.id}
                  className="flex items-center gap-6 py-6 border-b border-border/50">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-28 h-36 object-cover rounded-xl flex-shrink-0 bg-surface"
                  />
                  <div className="flex-grow min-w-0 flex flex-col justify-between h-36 py-1">
                    <div>
                      <h3 className="text-lg text-ink mb-1 truncate font-display">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted mb-3 font-body">
                        Size: {item.size}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 rounded-full border border-border text-ink hover:bg-surface transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ink"
                          aria-label="Decrease quantity"
                        >{SVGIcons.Minus}</button>
                        <span className="w-4 text-center text-sm font-body">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 rounded-full border border-border text-ink hover:bg-surface transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ink"
                          aria-label="Increase quantity"
                        >{SVGIcons.Plus}</button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted hover:text-ink transition-colors text-xs font-body underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="h-36 py-1 flex items-start">
                    <p className="text-base font-medium text-ink font-body">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : stage === 'checkout' ? (
            <div className="lg:col-span-2">
              {/* ── Shipping & Auth form ────────────────────────────────────────── */}
              <button
                type="button"
                onClick={() => setStage('cart')}
                className="text-sm text-muted hover:text-ink transition-colors mb-8 inline-flex items-center gap-2 font-body"
              >
                {SVGIcons.ArrowLeft} Back to Cart
              </button>

              {!user && !authLoading ? (
                <div className="bg-surface rounded-2xl p-8 border border-border">
                  <h2 className="text-2xl text-ink mb-2 font-display">Account Required</h2>
                  <p className="text-muted text-sm mb-6 font-body">Please sign in or register to complete your order securely.</p>
                  
                  <div className="flex gap-4 mb-6 border-b border-border pb-2">
                    <button 
                      onClick={() => { setAuthMode('login'); setAuthError(null); }}
                      className={`text-sm font-medium font-body px-2 pb-2 border-b-2 transition-colors ${authMode === 'login' ? 'text-ink border-ink' : 'text-muted border-transparent hover:text-ink'}`}
                    >Sign In</button>
                    <button 
                      onClick={() => { setAuthMode('register'); setAuthError(null); }}
                      className={`text-sm font-medium font-body px-2 pb-2 border-b-2 transition-colors ${authMode === 'register' ? 'text-ink border-ink' : 'text-muted border-transparent hover:text-ink'}`}
                    >Register</button>
                  </div>

                  <form onSubmit={handleInlineAuth} className="space-y-4">
                    {authMode === 'register' && (
                      <div>
                        <label htmlFor="auth-name" className={labelClass}>Full Name</label>
                        <input id="auth-name" type="text" autoComplete="name" required className={inputClass} value={authName} onChange={e => setAuthName(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label htmlFor="auth-email" className={labelClass}>Email</label>
                      <input id="auth-email" type="email" autoComplete="email" required className={inputClass} value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="auth-pass" className={labelClass}>Password</label>
                      <input id="auth-pass" type="password" autoComplete="current-password" required className={inputClass} value={authPass} onChange={e => setAuthPass(e.target.value)} />
                    </div>
                    
                    {authError && (
                      <p className="text-sm text-[#B91C1C] font-body bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">{authError}</p>
                    )}

                    <button type="submit" disabled={isAuthenticating} className="btn-primary w-full py-3 mt-2">
                      {isAuthenticating ? 'Authenticating...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>
                </div>
              ) : (
                <form id="checkout-form" onSubmit={startPayment} className="space-y-5">
                  <h2 className="text-xl text-ink mb-6 font-display border-b border-border pb-4">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="ship-name" className={labelClass}>Full Name</label>
                      <input id="ship-name" autoComplete="name" className={inputClass} required
                        value={address.name} onChange={(e) => setField('name', e.target.value)}
                        placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label htmlFor="ship-email" className={labelClass}>Email</label>
                      <input id="ship-email" type="email" autoComplete="email" className={inputClass} required
                        value={address.email} onChange={(e) => setField('email', e.target.value)}
                        placeholder="you@example.com" />
                    </div>
                    <div>
                      <label htmlFor="ship-phone" className={labelClass}>Phone</label>
                      <input id="ship-phone" type="tel" autoComplete="tel" className={inputClass} required
                        value={address.phone} onChange={(e) => setField('phone', e.target.value)}
                        placeholder="+1 555 000 0000" />
                    </div>
                    <div>
                      <label htmlFor="ship-country" className={labelClass}>Country</label>
                      <input id="ship-country" autoComplete="country-name" className={inputClass} required
                        value={address.country} onChange={(e) => setField('country', e.target.value)}
                        placeholder="United States" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="ship-address" className={labelClass}>Street Address</label>
                      <input id="ship-address" autoComplete="street-address" className={inputClass} required
                        value={address.address} onChange={(e) => setField('address', e.target.value)}
                        placeholder="123 Main Street, Apt 4" />
                    </div>
                    <div>
                      <label htmlFor="ship-city" className={labelClass}>City</label>
                      <input id="ship-city" autoComplete="address-level2" className={inputClass} required
                        value={address.city} onChange={(e) => setField('city', e.target.value)}
                        placeholder="New York" />
                    </div>
                    <div>
                      <label htmlFor="ship-zip" className={labelClass}>ZIP / Postal Code</label>
                      <input id="ship-zip" autoComplete="postal-code" className={inputClass} required
                        value={address.zipCode} onChange={(e) => setField('zipCode', e.target.value)}
                        placeholder="10001" />
                    </div>
                  </div>

                  {orderError && (
                    <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 font-body">
                      {orderError}
                    </p>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* ── Payment (Stripe) ─────────────────────────────────────────── */
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setStage('checkout')}
                className="text-sm text-muted hover:text-ink transition-colors mb-8 inline-flex items-center gap-2 font-body"
              >
                {SVGIcons.ArrowLeft} Back to Address
              </button>

              <h2 className="text-xl text-ink mb-2 font-display">
                Payment Details
              </h2>
              <p className="text-sm text-muted mb-8 font-body">
                Shipping to {address.name}, {address.address}, {address.city}, {address.country}
              </p>

              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#000000' } } }}>
                  <PaymentForm total={payableTotal} onPaid={handlePaid} />
                </Elements>
              ) : (
                <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 font-body">
                  Payments are currently unavailable. Please check back later.
                </p>
              )}
            </div>
          )}
          {/* ── Order summary ──────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-2xl p-6 sticky top-28 bg-surface/50">
              <h2 className="text-xl text-ink mb-6 font-display">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-ink">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="text-ink">Free</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between">
                    <span className="text-muted">Promo ({appliedPromo.code})</span>
                    <span className="text-ink">-{'$' + appliedPromo.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Taxes</span>
                  <span className="text-ink">Calculated at checkout</span>
                </div>
              </div>
              <div className="divider my-5 h-px bg-border w-full" />
              <div className="flex justify-between text-base font-medium mb-6 font-body">
                <span className="text-ink">Total</span>
                <span className="text-ink">${displayTotal.toFixed(2)}</span>
              </div>

              {/* Promo code — hidden on the payment stage (already priced in) */}
              {stage !== 'payment' && (
                <div className="mb-6">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between text-sm border border-border rounded-xl px-4 py-3 font-body bg-white">
                      <span className="text-ink font-medium">
                        {appliedPromo.code} (−{appliedPromo.percentOff}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedPromo(null)}
                        className="text-xs text-muted hover:text-ink transition-colors underline underline-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          if (promoError) setPromoError(null);
                        }}
                        placeholder="Promo code"
                        aria-label="Promo code"
                        className="flex-grow min-w-0 border border-border rounded-xl px-4 py-2 text-sm bg-white text-ink placeholder:text-muted focus:border-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink font-body"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoApplying || !promoInput.trim()}
                        className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
                      >
                        {promoApplying ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs text-[#B91C1C] mt-2 font-body">
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              {stage === 'cart' ? (
                <>
                  <button onClick={startCheckout} className="btn-primary w-full py-4">
                    Proceed to Checkout
                  </button>
                </>
              ) : stage === 'checkout' ? (
                <>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={placing || !paymentsConfigured || !user}
                    className="btn-primary w-full py-4 disabled:opacity-50"
                  >
                    {placing ? 'Preparing Payment…' : 'Continue to Payment'}
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted text-center font-body">
                  Complete your purchase with the secure card form.
                </p>
              )}

              {/* Trust Reassurance Signals */}
              <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-1 gap-4 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-ink">{SVGIcons.Lock}</span>
                  <span className="text-xs font-medium text-ink font-body">Secure Checkout</span>
                  <span className="text-[11px] text-muted font-body">256-bit encryption</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs font-medium text-ink font-body">Complimentary Shipping & Returns</span>
                  <span className="text-[11px] text-muted font-body">30-day effortless returns policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Cart;
