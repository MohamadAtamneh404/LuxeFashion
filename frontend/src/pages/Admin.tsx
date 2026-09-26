import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import Layout from '../components/layout/Layout';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../config/firebase';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  ProductInput,
} from '../services/api';

const CATEGORIES = ['men', 'women', 'accessories', 'footwear'];
const EMPTY: ProductInput = { name: '', price: 0, image: '', sizes: [], category: 'men', description: '', stock: 0, salePrice: 0 };

const inputClass =
  'w-full border border-border rounded-xl px-4 py-3 text-sm bg-white text-ink font-body ' +
  'placeholder:text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink transition-colors';
const labelClass = 'block text-xs uppercase tracking-widest text-ink font-medium mb-2 font-body';

const USD = '$';
const priceLabel = (p: Product): string =>
  p.salePrice && p.salePrice > 0 && p.salePrice < p.price
    ? USD + p.salePrice + ' (was ' + USD + p.price + ')'
    : USD + p.price;

const Icons = {
  Upload: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto mb-4 text-muted">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  EmptyBox: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto mb-4 text-muted">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  )
};

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalogue' | 'editor'>('catalogue');
  const [products, setProducts] = useState<Product[]>([]);
  const [listLoading, setListLoading] = useState(true);
  
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [sizesText, setSizesText] = useState('S,M,L');
  const [anglesText, setAnglesText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadProducts = async () => {
    setListLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to load products' });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadProducts();
  }, [isAdmin]);

  const set = (key: keyof ProductInput, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ kind: 'error', text: 'Please choose an image file (PNG, JPG, WebP…)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ kind: 'error', text: 'Image is too large — please use a file under 5 MB.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const snapshot = await uploadBytes(
        storageRef(storage, `products/${Date.now()}-${safeName}`),
        file,
      );
      const url = await getDownloadURL(snapshot.ref);
      set('image', url);
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? `Image upload failed: ${err.message}` : 'Image upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleImageFile(e.dataTransfer.files?.[0]);
  };

  const onFilePicked = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageFile(e.target.files?.[0]);
    e.target.value = '';
  };
  
  const handleDropzoneKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const extraAngles = anglesText
        .split(',')
        .map((s) => s.trim())
        .filter((u) => u && u !== form.image);
      const payload: ProductInput = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        salePrice: Number(form.salePrice) || 0,
        sizes: sizesText.split(',').map((s) => s.trim()).filter(Boolean),
        images: [form.image, ...extraAngles],
      };
      if (payload.salePrice && payload.salePrice >= payload.price) {
        setMessage({ kind: 'error', text: 'Sale price must be lower than the regular price (use 0 for no sale).' });
        setSaving(false);
        return;
      }
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage({ kind: 'success', text: `"${payload.name}" updated.` });
      } else {
        await createProduct(payload);
        setMessage({ kind: 'success', text: `"${payload.name}" added to the catalogue.` });
      }
      setForm(EMPTY);
      setSizesText('S,M,L');
      setAnglesText('');
      setEditingId(null);
      setActiveTab('catalogue');
      await loadProducts();
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      image: p.image,
      sizes: p.sizes,
      category: p.category,
      description: p.description || '',
      stock: p.stock ?? 0,
      salePrice: p.salePrice ?? 0,
    });
    setSizesText(p.sizes.join(','));
    setAnglesText((p.images || []).slice(1).join(', '));
    setMessage(null);
    setActiveTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    try {
      await deleteProduct(id);
      setMessage({ kind: 'success', text: 'Product deleted.' });
      setConfirmDeleteId(null);
      await loadProducts();
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
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

  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-8 py-40 text-center">
          <h1 className="text-4xl md:text-5xl text-ink mb-4 font-display">
            Admins <em className="text-muted italic">only.</em>
          </h1>
          <p className="text-muted text-sm mb-10 font-body">
            You must be signed in with an admin account to manage products.
          </p>
          <Link to="/account" className="btn-primary">Go to Account</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="Admin" description="Product catalogue administration." path="/admin" noindex />
      <div className="max-w-7xl mx-auto px-8 py-20">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl text-ink mb-3 font-display">
              Admin <em className="text-muted italic">Dashboard.</em>
            </h1>
            <p className="text-muted text-sm font-body">
              Manage inventory, upload products, and curate the LuxeFashion catalogue.
            </p>
          </div>
          <div className="flex bg-surface rounded-full p-1" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'catalogue'}
              onClick={() => { setActiveTab('catalogue'); setMessage(null); }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ink font-body ${
                activeTab === 'catalogue' ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Catalogue
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'editor'}
              onClick={() => { setActiveTab('editor'); setMessage(null); }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ink font-body ${
                activeTab === 'editor' ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {editingId ? 'Edit Product' : 'Add Product'}
            </button>
          </div>
        </div>

        {/* Feedback banner */}
        {message && (
          <p
            className={`max-w-full mb-8 text-sm rounded-xl px-4 py-3 border font-body ${
              message.kind === 'error'
                ? 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]'
                : 'text-ink bg-surface border-border'
            }`}
          >
            {message.text}
          </p>
        )}

        {/* ── Add / Edit Product Tab ── */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* General Info Card */}
            <div className="border border-border rounded-3xl p-8 bg-white shadow-sm">
              <h2 className="text-xl text-ink mb-6 font-display border-b border-border/50 pb-4">General Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="product-name" className={labelClass}>Product Name</label>
                  <input id="product-name" className={inputClass} value={form.name}
                    onChange={(e) => set('name', e.target.value)} placeholder="Essential Cotton Tee" required />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="product-description" className={labelClass}>Description</label>
                  <textarea id="product-description" className={`${inputClass} resize-none`} rows={4}
                    value={form.description} onChange={(e) => set('description', e.target.value)}
                    placeholder="A short, evocative description of the piece…" />
                </div>
                <div>
                  <label htmlFor="product-category" className={labelClass}>Category</label>
                  <select id="product-category" className={`${inputClass} capitalize`} value={form.category}
                    onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="product-sizes" className={labelClass}>Sizes</label>
                  <input id="product-sizes" className={inputClass} value={sizesText}
                    onChange={(e) => setSizesText(e.target.value)} placeholder="S,M,L,XL" />
                  <p className="text-[11px] text-muted mt-2 font-body">Comma-separated (e.g. S,M,L or 40,41,42)</p>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Card */}
            <div className="border border-border rounded-3xl p-8 bg-white shadow-sm">
              <h2 className="text-xl text-ink mb-6 font-display border-b border-border/50 pb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="product-price" className={labelClass}>Price (USD)</label>
                  <input id="product-price" className={inputClass} type="number" step="0.01" min="0"
                    value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="95" required />
                </div>
                <div>
                  <label htmlFor="product-sale-price" className={labelClass}>Sale Price</label>
                  <input id="product-sale-price" className={inputClass} type="number" step="0.01" min="0"
                    value={form.salePrice ?? 0} onChange={(e) => set('salePrice', e.target.value)} placeholder="0 (No sale)" />
                </div>
                <div>
                  <label htmlFor="product-stock" className={labelClass}>Initial Stock</label>
                  <input id="product-stock" className={inputClass} type="number" min="0"
                    value={form.stock ?? 0} onChange={(e) => set('stock', e.target.value)} placeholder="20" />
                </div>
              </div>
            </div>

            {/* Media Gallery Card */}
            <div className="border border-border rounded-3xl p-8 bg-white shadow-sm">
              <h2 className="text-xl text-ink mb-6 font-display border-b border-border/50 pb-4">Media Gallery</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Primary Image</label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={handleDropzoneKeyDown}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    aria-label="Upload product image"
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${
                      dragActive ? 'border-ink bg-surface' : 'border-border hover:border-muted'
                    }`}
                  >
                    {form.image ? (
                      <img src={form.image} alt="Product preview"
                        className="mx-auto mb-4 h-48 w-40 object-cover rounded-xl border border-border shadow-sm" />
                    ) : (
                      Icons.Upload
                    )}
                    <p className="text-sm text-muted font-body">
                      {uploading
                        ? 'Uploading…'
                        : form.image
                          ? 'Drop a new image here or click to replace it'
                          : 'Drag & drop an image here, or click to browse'}
                    </p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" tabIndex={-1} onChange={onFilePicked} />
                  <input className={`${inputClass} mt-3`} value={form.image}
                    onChange={(e) => set('image', e.target.value)}
                    placeholder="…or paste an image URL (https://…)" required />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <label htmlFor="product-angles" className={labelClass}>Additional Angles</label>
                  <input id="product-angles" className={inputClass} value={anglesText}
                    onChange={(e) => setAnglesText(e.target.value)}
                    placeholder="https://… , https://…" />
                  <p className="text-[11px] text-muted mt-2 font-body">
                    Comma-separated image URLs for alternative views. Displayed as a hover gallery.
                  </p>
                  {anglesText.trim() && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {anglesText.split(',').map((s) => s.trim()).filter(Boolean).map((url) => (
                        <img key={url} src={url} alt="Angle preview"
                          className="w-16 h-20 object-cover rounded-lg border border-border bg-surface" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <button type="submit" disabled={saving || uploading}
                className="btn-primary px-10 py-4 disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary px-10 py-4"
                  onClick={() => { setEditingId(null); setForm(EMPTY); setSizesText('S,M,L'); setAnglesText(''); setMessage(null); setActiveTab('catalogue'); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── Catalogue Tab ── */}
        {activeTab === 'catalogue' && (
          <div>
            {listLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-[1.5px] border-ink border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center border border-border rounded-3xl bg-white shadow-sm flex flex-col items-center">
                {Icons.EmptyBox}
                <h3 className="text-2xl text-ink font-display mb-2">Catalogue is empty</h3>
                <p className="text-muted text-sm font-body mb-8 max-w-sm">
                  You haven't added any products to the store yet. Start building your inventory.
                </p>
                <button onClick={() => setActiveTab('editor')} className="btn-primary">
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-3xl overflow-x-auto bg-white shadow-sm">
                <table className="w-full text-left font-body text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-widest text-muted">
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium text-right">Price</th>
                      <th className="px-6 py-4 font-medium text-right">Stock</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={p.image} alt={p.name} className="w-12 h-16 object-cover rounded-lg border border-border bg-surface flex-shrink-0" />
                            <div className="min-w-[150px] max-w-[250px]">
                              <p className="font-medium text-ink truncate" title={p.name}>{p.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted capitalize">{p.category}</td>
                        <td className="px-6 py-4 text-ink text-right font-medium">{priceLabel(p)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            (p.stock ?? 0) <= 5 ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-surface text-ink border border-border'
                          }`}>
                            {p.stock ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {confirmDeleteId === p.id ? (
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-xs text-[#B91C1C]">Sure?</span>
                              <button onClick={() => handleDelete(p.id)} className="text-[#B91C1C] hover:underline font-medium">Yes</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-muted hover:underline">No</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-4">
                              <button onClick={() => startEdit(p)} className="text-ink hover:underline font-medium focus-visible:outline-ink rounded">
                                Edit
                              </button>
                              <button onClick={() => setConfirmDeleteId(p.id)} className="text-muted hover:text-[#B91C1C] transition-colors focus-visible:outline-[#B91C1C] rounded">
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Admin;
