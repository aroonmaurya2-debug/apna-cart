import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, storage } from './firebase'
import './admin-panel.css'

type Variant = { id?: string; color?: string; size?: string; price?: number | string; stock?: number | string; sku?: string }
type Product = { id: number | string; name?: string; price?: number; oldPrice?: number; category?: string; gender?: string; stock?: number; image?: string; images?: string[]; description?: string; color?: string; size?: string; sku?: string; weight?: number | string; returnDays?: number | string; variants?: Variant[]; brand?: string; material?: string; subcategory?: string; countryOfOrigin?: string; manufacturer?: string; packOf?: number | string; dimensions?: string; gst?: number | string; hsn?: string; warranty?: string; shippingInfo?: string }
type Order = { id?: string | number; total?: number; status?: string; contact?: string; phone?: string; customerName?: string; createdAt?: string }
type Seller = { id?: string; name?: string; shopName?: string; email?: string; phone?: string; status?: string }
type Tab = 'dashboard' | 'products' | 'orders' | 'customers' | 'earnings' | 'sellers'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const emptyProduct = { name: '', price: '', oldPrice: '', category: 'All Categories', subcategory: '', gender: 'Unisex', stock: '0', image: '', images: [] as string[], description: '', brand: '', material: '', color: '', size: '', sku: '', weight: '', returnDays: '7', countryOfOrigin: 'India', manufacturer: '', packOf: '1', dimensions: '', gst: '', hsn: '', warranty: '', shippingInfo: 'Free delivery', variants: [] as Variant[] }

const compressImage = (file: File) => new Promise<Blob>((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('Image read failed.'))
  reader.onload = () => {
    const image = new Image()
    image.onerror = () => reject(new Error('Invalid image.'))
    image.onload = () => {
      const max = 1400
      const scale = Math.min(1, max / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) return reject(new Error('Image processing failed.'))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image compression failed.')), 'image/jpeg', 0.72)
    }
    image.src = String(reader.result || '')
  }
  reader.readAsDataURL(file)
})

export default function AdminPanel() {
  const [email, setEmail] = useState('aroonmaurya2@gmail.com')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<any>({ ...emptyProduct })
  const [tab, setTab] = useState<Tab>('dashboard')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const api = async (path: string, options: RequestInit = {}) => {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : ''
    return fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } })
  }

  const loadData = async () => {
    setRefreshing(true); setError('')
    try {
      const [pr, or, sr] = await Promise.all([api('/products'), api('/orders'), api('/admin/sellers')])
      const pd = await pr.json().catch(() => ({})); const od = await or.json().catch(() => ({})); const sd = await sr.json().catch(() => ({}))
      if (!pr.ok) throw new Error(pd?.error || 'Products load failed')
      setProducts(Array.isArray(pd?.products) ? pd.products : []); setOrders(Array.isArray(od?.orders) ? od.orders : []); setSellers(Array.isArray(sd?.sellers) ? sd.sellers : [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Backend data load failed.') } finally { setRefreshing(false) }
  }
  useEffect(() => { if (loggedIn) loadData() }, [loggedIn])

  const revenue = useMemo(() => orders.reduce((s, o) => s + Number(o.total || 0), 0), [orders])
  const deliveredRevenue = useMemo(() => orders.filter(o => ['delivered', 'completed'].includes(String(o.status || '').toLowerCase())).reduce((s, o) => s + Number(o.total || 0), 0), [orders])
  const pending = useMemo(() => orders.filter(o => !['delivered', 'cancelled', 'completed'].includes(String(o.status || '').toLowerCase())).length, [orders])
  const cancelled = useMemo(() => orders.filter(o => String(o.status || '').toLowerCase() === 'cancelled').length, [orders])
  const customers = useMemo(() => { const m = new Map<string, { contact: string; orders: number; spent: number }>(); orders.forEach(o => { const contact = String(o.contact || o.phone || 'Unknown'); const old = m.get(contact) || { contact, orders: 0, spent: 0 }; old.orders++; old.spent += Number(o.total || 0); m.set(contact, old) }); return [...m.values()].sort((a, b) => b.spent - a.spent) }, [orders])

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { if (!auth) throw new Error('Firebase configuration is missing.'); const c = await signInWithEmailAndPassword(auth, email.trim(), password); const allowed = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase(); if (allowed && c.user.email?.toLowerCase() !== allowed) { await signOut(auth); throw new Error('This account is not an authorised Apna Cart owner account.') }; setLoggedIn(true); setPassword('') } catch (e) { setError(e instanceof Error ? e.message : 'Admin login failed.') } finally { setLoading(false) }
  }
  const resetPassword = async () => { setError(''); setResetting(true); try { if (!auth) throw new Error('Firebase configuration is missing.'); await sendPasswordResetEmail(auth, email.trim()); setError('Password reset email sent. Gmail inbox/spam check karein.') } catch (e) { setError(e instanceof Error ? e.message : 'Password reset failed.') } finally { setResetting(false) } }
  const logout = async () => { if (auth) await signOut(auth); setLoggedIn(false); setProducts([]); setOrders([]); setSellers([]) }
  const startEdit = (p: Product) => { const images = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []); setEditing(p); setForm({ ...emptyProduct, ...p, price: String(p.price ?? ''), oldPrice: String(p.oldPrice ?? p.price ?? ''), stock: String(p.stock ?? 0), weight: String(p.weight ?? ''), returnDays: String(p.returnDays ?? 7), packOf: String(p.packOf ?? 1), images, variants: Array.isArray(p.variants) ? p.variants : [] }); setTab('products'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5); if (!files.length) return
    if (!auth?.currentUser || !storage) { setError('Firebase Storage configured nahi hai. Firebase Console me Storage enable karein.'); return }
    if (files.some(f => !f.type.startsWith('image/'))) { setError('Sirf image files select karein.'); return }
    if (files.some(f => f.size > 8 * 1024 * 1024)) { setError('Har image 8MB se chhoti honi chahiye.'); return }
    setUploadingImages(true); setError('')
    try {
      const uploaded = await Promise.all(files.map(async (file, index) => {
        const blob = await compressImage(file)
        const imageRef = ref(storage, `products/${auth.currentUser!.uid}/${Date.now()}-${index}.jpg`)
        await uploadBytes(imageRef, blob, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' })
        return getDownloadURL(imageRef)
      }))
      setForm((p: any) => ({ ...p, image: uploaded[0] || '', images: uploaded }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Image upload failed.'
      setError(message.includes('storage/unauthorized') ? 'Firebase Storage permission denied. Storage Rules me authorised user ko write access dein.' : `Image upload failed: ${message}`)
    } finally { setUploadingImages(false); e.target.value = '' }
  }
  const addVariant = () => setForm((p: any) => ({ ...p, variants: [...(p.variants || []), { id: `variant_${Date.now()}`, color: '', size: '', price: p.price || '', stock: '0', sku: '' }] }))
  const updateVariant = (index: number, key: string, value: string) => setForm((p: any) => ({ ...p, variants: (p.variants || []).map((v: Variant, i: number) => i === index ? { ...v, [key]: value } : v) }))
  const removeVariant = (index: number) => setForm((p: any) => ({ ...p, variants: (p.variants || []).filter((_: Variant, i: number) => i !== index) }))

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    const images = Array.isArray(form.images) && form.images.length ? form.images : (form.image ? [form.image] : [])
    const payload = { ...form, name: String(form.name || '').trim(), price: Number(form.price), oldPrice: Number(form.oldPrice || form.price), stock: Number(form.stock || 0), weight: form.weight === '' ? undefined : Number(form.weight), returnDays: Number(form.returnDays || 0), packOf: Number(form.packOf || 1), gst: form.gst === '' ? undefined : Number(form.gst), image: images[0] || '', images, description: String(form.description || '').trim(), variants: Array.isArray(form.variants) ? form.variants : [] }
    try {
      if (!payload.name || !payload.price) throw new Error('Product name aur price required hai.')
      const r = editing ? await api(`/products/${encodeURIComponent(String(editing.id))}`, { method: 'PUT', body: JSON.stringify(payload) }) : await api('/products', { method: 'POST', body: JSON.stringify(payload) })
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || d?.message || `Product save failed (${r.status})`)
      setForm({ ...emptyProduct }); setEditing(null); if (fileInputRef.current) fileInputRef.current.value = ''; await loadData()
    } catch (e) { setError(e instanceof Error ? e.message : 'Product save failed.') } finally { setSaving(false) }
  }
  const deleteProduct = async (p: Product) => { if (!confirm(`Delete ${p.name || 'this product'}?`)) return; try { const r = await api(`/products/${encodeURIComponent(String(p.id))}`, { method: 'DELETE' }); if (!r.ok) throw new Error('Delete failed'); await loadData() } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.') } }
  const updateOrder = async (o: Order, status: string) => { try { const r = await api(`/orders/${encodeURIComponent(String(o.id))}`, { method: 'PUT', body: JSON.stringify({ status }) }); if (!r.ok) throw new Error('Order update failed'); await loadData() } catch (e) { setError(e instanceof Error ? e.message : 'Order update failed.') } }
  const updateSeller = async (s: Seller, status: string) => { try { const r = await api(`/admin/sellers/${encodeURIComponent(String(s.id))}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); if (!r.ok) throw new Error('Seller update failed'); setSellers(prev => prev.map(x => x.id === s.id ? { ...x, status } : x)) } catch (e) { setError(e instanceof Error ? e.message : 'Seller update failed.') } }

  if (!loggedIn) return <main className="admin-shell admin-login-page"><section className="admin-login-card"><div className="admin-logo">🛍️</div><h1>Apna Cart Owner Panel</h1><p>Sirf authorised owner account se login karein.</p><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <div className="admin-error">{error}</div>}<button className="admin-primary" disabled={loading}>{loading ? 'Logging in…' : 'Owner Login'}</button></form><button className="admin-back" onClick={resetPassword} disabled={resetting}>{resetting ? 'Sending…' : 'Forgot / Change Password'}</button></section></main>

  const field = (label: string, key: string, type = 'text') => <label><span>{label}</span><input type={type} value={key.startsWith('variants.') ? '' : (form[key] ?? '')} onChange={e => key.startsWith('variants.') ? undefined : setForm({ ...form, [key]: e.target.value })} /></label>
  return <main className="admin-shell"><header className="admin-topbar"><div><div className="admin-kicker">APNA CART</div><h1>Owner / Admin Panel</h1></div><div className="admin-actions"><button onClick={loadData} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button><button onClick={logout}>Logout</button></div></header><div className="admin-layout"><aside className="admin-sidebar"><button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>📊 Dashboard</button><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>📦 Products</button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>🧾 Orders</button><button className={tab === 'sellers' ? 'active' : ''} onClick={() => setTab('sellers')}>🏪 Sellers</button><button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>👥 Customers</button><button className={tab === 'earnings' ? 'active' : ''} onClick={() => setTab('earnings')}>💰 Earnings</button></aside><section className="admin-content">{error && <div className="admin-error">{error}</div>}
    {tab === 'dashboard' && <><div className="admin-cards"><article><span>Total Products</span><strong>{products.length}</strong></article><article><span>Total Orders</span><strong>{orders.length}</strong></article><article><span>Pending Orders</span><strong>{pending}</strong></article><article><span>Order Value</span><strong>₹{revenue.toLocaleString('en-IN')}</strong></article></div></>}
    {tab === 'products' && <><section className="admin-panel-card"><h2>{editing ? 'Edit Product' : 'Add Product'}</h2><form onSubmit={saveProduct} className="admin-product-form">{field('Product Name *', 'name')}{field('Brand', 'brand')}{field('Material', 'material')}{field('Selling Price *', 'price', 'number')}{field('MRP / Old Price', 'oldPrice', 'number')}{field('Category', 'category')}{field('Sub-category', 'subcategory')}{field('Gender', 'gender')}{field('Colour', 'color')}{field('Size', 'size')}{field('Stock Quantity', 'stock', 'number')}{field('SKU / Product Code', 'sku')}{field('Weight (g)', 'weight', 'number')}{field('Pack Of', 'packOf', 'number')}{field('Return Days', 'returnDays', 'number')}{field('GST %', 'gst', 'number')}{field('HSN Code', 'hsn')}{field('Country of Origin', 'countryOfOrigin')}{field('Manufacturer', 'manufacturer')}{field('Dimensions', 'dimensions')}{field('Warranty', 'warranty')}{field('Shipping Info', 'shippingInfo')}<label><span>Description</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="admin-image-upload"><input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageChange} /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>{uploadingImages ? '⬆️ Uploading images…' : '📷 Choose up to 5 Product Images'}</button><small>{uploadingImages ? 'Images Firebase Storage me upload ho rahi hain…' : form.images?.length ? `${form.images.length}/5 images uploaded` : '1–5 photos select karein'}</small>{form.images?.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{form.images.map((img: string, i: number) => <img key={i} src={img} alt={`Product ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />)}</div>}</div><div className="admin-panel-card"><h3>Colour / Size Variants</h3>{(form.variants || []).map((v: Variant, i: number) => <div key={v.id || i} style={{ display: 'grid', gap: 6, marginBottom: 10 }}><input placeholder={`Variant ${i + 1} Colour`} value={v.color || ''} onChange={e => updateVariant(i, 'color', e.target.value)} /><input placeholder="Size" value={v.size || ''} onChange={e => updateVariant(i, 'size', e.target.value)} /><input placeholder="Price" type="number" value={v.price || ''} onChange={e => updateVariant(i, 'price', e.target.value)} /><input placeholder="Stock" type="number" value={v.stock || ''} onChange={e => updateVariant(i, 'stock', e.target.value)} /><input placeholder="SKU" value={v.sku || ''} onChange={e => updateVariant(i, 'sku', e.target.value)} /><button type="button" onClick={() => removeVariant(i)}>Remove Variant</button></div>)}<button type="button" onClick={addVariant}>+ Add Variant</button></div><button className="admin-primary" disabled={saving || uploadingImages}>{saving ? 'Saving…' : editing ? 'Update Product' : 'Add Product'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm({ ...emptyProduct }) }}>Cancel</button>}</form></section><section className="admin-panel-card"><h2>Products</h2><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Photos</th><th>Action</th></tr></thead><tbody>{products.map(p => <tr key={String(p.id)}><td>{p.name}</td><td>₹{Number(p.price || 0).toLocaleString('en-IN')}</td><td>{p.stock ?? 0}</td><td>{p.images?.length || (p.image ? 1 : 0)}</td><td><button onClick={() => startEdit(p)}>Edit</button> <button onClick={() => deleteProduct(p)}>Delete</button></td></tr>)}</tbody></table></div></section></>}
    {tab === 'orders' && <section className="admin-panel-card"><h2>Orders</h2><div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Update</th></tr></thead><tbody>{orders.map((o, i) => <tr key={String(o.id ?? i)}><td>#{o.id ?? i + 1}</td><td>{o.customerName || o.contact || o.phone || '—'}</td><td>₹{Number(o.total || 0).toLocaleString('en-IN')}</td><td>{o.status || 'pending'}</td><td><select value={o.status || 'pending'} onChange={e => updateOrder(o, e.target.value)}><option>placed</option><option>pending</option><option>confirmed</option><option>shipped</option><option>delivered</option><option>completed</option><option>cancelled</option></select></td></tr>)}</tbody></table></div></section>}
    {tab === 'customers' && <section className="admin-panel-card"><h2>Customers</h2><div className="admin-table-wrap"><table><thead><tr><th>Customer</th><th>Orders</th><th>Spent</th></tr></thead><tbody>{customers.map(c => <tr key={c.contact}><td>{c.contact}</td><td>{c.orders}</td><td>₹{c.spent.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div></section>}
    {tab === 'earnings' && <section className="admin-panel-card"><h2>Earnings</h2><div className="admin-cards"><article><span>Gross Order Value</span><strong>₹{revenue.toLocaleString('en-IN')}</strong></article><article><span>Delivered Revenue</span><strong>₹{deliveredRevenue.toLocaleString('en-IN')}</strong></article><article><span>Cancelled Orders</span><strong>{cancelled}</strong></article></div></section>}
    {tab === 'sellers' && <section className="admin-panel-card"><h2>Sellers ({sellers.length})</h2><div className="admin-table-wrap"><table><thead><tr><th>Shop</th><th>Owner</th><th>Contact</th><th>Status</th></tr></thead><tbody>{sellers.map((s, i) => <tr key={String(s.id ?? i)}><td>{s.shopName || '—'}</td><td>{s.name || '—'}</td><td>{s.email || s.phone || '—'}</td><td><select value={s.status || 'pending'} onChange={e => updateSeller(s, e.target.value)}><option>pending</option><option>approved</option><option>rejected</option><option>suspended</option></select></td></tr>)}</tbody></table></div></section>}
  </section></div></main>
}
