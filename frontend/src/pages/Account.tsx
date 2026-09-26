import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import { fetchOrdersByUser, Order } from '../services/api';

const friendlyError = (err: unknown): string => {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password is too weak (minimum 6 characters).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'No account found with that email.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
    case 'auth/admin-restricted-operation':
      return 'Email/password sign-in is not enabled. Enable it in the Firebase console (Authentication → Sign-in method → Email/Password).';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed';
  }
};

const inputClass =
  'w-full border border-border rounded-xl px-4 py-3 text-sm bg-white text-ink ' +
  'placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink transition-colors font-body';
const labelClass = 'block text-xs uppercase tracking-widest text-ink font-medium mb-2 font-body';

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-muted before:bg-muted',
  processing: 'text-ink before:bg-ink',
  shipped: 'text-ink before:bg-ink',
  delivered: 'text-ink font-medium before:bg-ink',
  cancelled: 'text-muted line-through before:bg-border',
};

const Icons = {
  ChevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  Package: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted mb-6">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  )
};

// Expandable order row component
function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-white">
      {/* Summary Header (Clickable) */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 text-left hover:bg-surface/50 transition-colors focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-[-2px]"
      >
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 font-body text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">Order</p>
            <p className="font-medium text-ink">#{order.id?.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">Date</p>
            <p className="text-ink">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">Total</p>
            <p className="font-medium text-ink">${order.totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted mb-1">Status</p>
            <p className={`capitalize flex items-center gap-2 before:content-[''] before:block before:w-1.5 before:h-1.5 before:rounded-full ${STATUS_STYLES[order.status || 'pending'] || STATUS_STYLES.pending}`}>
              {order.status || 'pending'}
            </p>
          </div>
        </div>
        
        <div className={`text-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          {Icons.ChevronDown}
        </div>
      </button>

      {/* Expanded Details */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-border/50 ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 bg-surface/30">
          <h4 className="text-xs uppercase tracking-widest text-muted mb-4 font-body">Items</h4>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.productId}-${item.size}`} className="flex items-center gap-4">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-20 object-cover rounded-lg border border-border bg-surface"
                />
                <div className="flex-grow min-w-0 font-body">
                  <h3 className="text-sm font-medium text-ink truncate">{item.productName}</h3>
                  <p className="text-sm text-muted">Size: {item.size}</p>
                </div>
                <div className="text-sm font-body text-right">
                  <p className="text-muted">Qty: {item.quantity}</p>
                  <p className="text-ink font-medium">${(item.productPrice * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8 font-body text-sm">
             <div>
               <h4 className="text-xs uppercase tracking-widest text-muted mb-2">Shipping Address</h4>
               <p className="text-ink leading-relaxed">
                 {order.shippingAddress.name}<br/>
                 {order.shippingAddress.address}<br/>
                 {order.shippingAddress.city}, {order.shippingAddress.zipCode}<br/>
                 {order.shippingAddress.country}
               </p>
             </div>
             <div>
               <h4 className="text-xs uppercase tracking-widest text-muted mb-2">Contact</h4>
               <p className="text-ink leading-relaxed">
                 {order.shippingAddress.email}<br/>
                 {order.shippingAddress.phone}
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Account() {
  const { user, role, loading, signIn, signInWithGoogle, signUp, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real order history for the signed-in user.
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    let cancelled = false;
    fetchOrdersByUser(user.uid)
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
          setOrdersError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOrdersError(err instanceof Error ? err.message : 'Failed to load orders');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleGoogleSignIn = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setMessage(
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
          ? 'Sign-in popup was closed before completing.'
          : friendlyError(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name.trim());
      }
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setMessage(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-40">
          <div className="w-8 h-8 border-[1.5px] border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // ── Signed-in: profile + real order history ──────────────────────────────
  if (user) {
    const firstName = user.displayName?.split(' ')[0] || 'there';
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-8 py-20">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl text-ink font-display">
              Welcome, <em className="text-muted italic">{firstName}.</em>
            </h1>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12 border-b border-border mb-12">
            <div className="flex items-center gap-6">
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}`
                }
                alt={user.displayName || 'Profile'}
                className="w-16 h-16 rounded-full border border-border object-cover"
              />
              <div>
                <h2 className="text-xl text-ink mb-1 font-display">
                  {user.displayName || 'LuxeFashion Member'}
                </h2>
                <div className="flex items-center gap-3 font-body">
                  <p className="text-sm text-muted">{user.email}</p>
                  <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    role === 'admin' ? 'bg-ink text-white' : 'bg-surface text-muted border border-border'
                  }`}>
                    {role || 'customer'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {role === 'admin' && (
                <Link to="/admin" className="btn-primary py-2.5 px-6 text-sm">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary py-2.5 px-6 text-sm">
                Log Out
              </button>
            </div>
          </div>

          {/* Order history */}
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl text-ink font-display">
              Order History
            </h2>
            {orders && orders.length > 0 && (
              <p className="text-xs uppercase tracking-widest text-muted font-body">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </p>
            )}
          </div>

          {ordersError ? (
            <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 font-body">{ordersError}</p>
          ) : orders === null ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-[1.5px] border-ink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              {Icons.Package}
              <h3 className="text-2xl text-ink font-display mb-2">No orders yet</h3>
              <p className="text-muted text-sm mb-8 font-body max-w-sm">
                Your purchase history is currently empty. Explore our collection to find your next favorite piece.
              </p>
              <Link to="/shop" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ── Signed-out: login / register ───────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-md mx-auto px-8 py-20">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl text-ink mb-4 font-display">
            {mode === 'login' ? (
              <>Welcome <em className="text-muted italic">back.</em></>
            ) : (
              <>Join <em className="text-muted italic">LuxeFashion.</em></>
            )}
          </h1>
          <p className="text-muted text-sm leading-relaxed font-body">
            {mode === 'login'
              ? 'Sign in to track orders and check out faster.'
              : 'Create an account to track orders and check out faster.'}
          </p>
        </div>

        <div className="border border-border bg-white rounded-3xl p-8 shadow-sm">
          {/* Mode toggle — accessible tablist */}
          <div className="flex bg-surface rounded-full p-1 mb-8" role="tablist" aria-label="Authentication mode">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ink font-body ${
                  mode === m ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label htmlFor="account-name" className={labelClass}>Name</label>
                <input
                  id="account-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label htmlFor="account-email" className={labelClass}>Email</label>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="account-password" className={labelClass}>Password</label>
              <input
                id="account-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className={inputClass}
              />
            </div>

            {message && (
              <p className="text-sm text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 font-body">
                {message}
              </p>
            )}

            <button type="submit" disabled={submitting}
              className="btn-primary w-full py-4 disabled:opacity-50">
              {submitting
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <span className="flex-grow h-px bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted font-body">
              or
            </span>
            <span className="flex-grow h-px bg-border" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="btn-secondary w-full py-3.5 disabled:opacity-50 flex items-center justify-center gap-3 font-body"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"/>
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <Seo
          title="Account"
          description="Sign in to your LuxeFashion account to track orders and manage your wishlist."
          path="/account"
          noindex
        />
      </div>
    </Layout>
  );
}

export default Account;
