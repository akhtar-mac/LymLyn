import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, Loader } from 'lucide-react';
import { adminApi, productsApi } from '@/lib/api';

const EMPTY_PRODUCT = {
  name: '', slug: '', description: '', base_price: '',
  garment_type: 'tshirt', fit_type: 'regular', is_active: true, category_id: '',
  product_images: []
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    productsApi.list({ limit: 100 })
      .then((res) => setProducts(res.products || []))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await adminApi.saveProduct({
        product: { ...form, base_price: parseFloat(form.base_price) },
      });
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p.id === res.product.id);
        const updatedProduct = { ...res.product, product_images: form.product_images || [] };
        return idx >= 0
          ? prev.map((p, i) => (i === idx ? updatedProduct : p))
          : [updatedProduct, ...prev];
      });
      setShowForm(false);
      setForm(EMPTY_PRODUCT);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    if (!form.id) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await adminApi.uploadImage({
          product_id: form.id,
          image_type: 'lifestyle',
          sort_order: form.product_images?.length || 0,
          image_data: base64data,
          file_name: file.name
        });
        
        const newImage = res.image;
        setForm(prev => ({
          ...prev,
          product_images: [...(prev.product_images || []), newImage]
        }));
        setProducts(prev => prev.map(p => p.id === form.id ? {
          ...p,
          product_images: [...(p.product_images || []), newImage]
        } : p));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
      setUploadingImage(false);
    }
  };

  return (
    <div className="container-site py-10 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin" className="flex items-center gap-1 text-xs text-muted hover:text-ink mb-2"><ChevronLeft size={14} /> Admin</Link>
          <h1 className="font-display text-4xl font-bold text-ink">Products</h1>
        </div>
        <button onClick={() => { setForm(EMPTY_PRODUCT); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card mb-8 space-y-4">
          <h2 className="font-display text-xl font-bold">{form.id ? 'Edit Product' : 'New Product'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="input-label">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="input" placeholder="Essential Oversized Tee" /></div>
            <div><label className="input-label">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="essential-oversized-tee" /></div>
            <div><label className="input-label">Price (₹)</label><input required type="number" min={0} step={0.01} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input" placeholder="999" /></div>
            <div>
              <label className="input-label">Type</label>
              <select value={form.garment_type} onChange={(e) => setForm({ ...form, garment_type: e.target.value })} className="input">
                <option value="tshirt">T-Shirt</option>
                <option value="lower">Lower</option>
              </select>
            </div>
            <div>
              <label className="input-label">Fit</label>
              <select value={form.fit_type} onChange={(e) => setForm({ ...form, fit_type: e.target.value })} className="input">
                <option value="regular">Regular</option>
                <option value="oversized">Oversized</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="text-sm font-medium text-ink">Active (visible in store)</label>
            </div>
          </div>
          <div><label className="input-label">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-24 resize-none" placeholder="Product description..." /></div>
          
          {form.id ? (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-display text-lg font-bold mb-4">Product Images ({form.product_images?.length || 0})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-4">
                {(form.product_images || []).sort((a, b) => a.sort_order - b.sort_order).map(img => (
                  <div key={img.id} className="relative aspect-square bg-surface rounded overflow-hidden border border-border">
                    <img src={img.image_url?.startsWith('/') ? `http://localhost:5173${img.image_url}` : img.image_url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur">{img.image_type}</span>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded cursor-pointer hover:border-ink hover:bg-surface transition-colors">
                  {uploadingImage ? <Loader size={20} className="animate-spin text-muted" /> : <Plus size={20} className="text-muted" />}
                  <span className="text-xs text-muted mt-2">Upload</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted italic">Save the product first to upload images.</p>
            </div>
          )}

          {error && <p className="text-sm text-accent">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-border animate-pulse" />)}</div>
      ) : (
        <div className="divide-y divide-border">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface rounded overflow-hidden border border-border shrink-0">
                  {p.product_images?.[0] ? (
                    <img src={p.product_images.sort((a,b)=>a.sort_order-b.sort_order)[0].image_url?.startsWith('/') ? `http://localhost:5173${p.product_images[0].image_url}` : p.product_images[0].image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">No IMG</div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">{p.garment_type} · {p.fit_type} · ₹{Number(p.base_price).toLocaleString('en-IN')} · {p.product_images?.length || 0} Images</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${p.is_active ? 'badge-accent' : 'bg-border text-muted'}`}>{p.is_active ? 'Active' : 'Draft'}</span>
                <button onClick={() => { setForm({ ...p, base_price: p.base_price }); setShowForm(true); }} className="text-xs text-muted hover:text-ink">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
