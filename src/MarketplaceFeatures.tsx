import { useEffect, useMemo, useState } from 'react'
import './MarketplaceFeatures.css'

const API = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
type Product = { id: string; name: string; category: string; price: number; oldPrice: number; image: string; sizes?: string[]; colors?: string[]; description?: string; sellerName?: string }
type Section = 'shop' | 'seller' | 'wishlist' | 'help'

export default function MarketplaceFeatures() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() => JSON.parse(localStorage.getItem('apna-cart-wishlist') || '[]'))
  const [sellerName, setSellerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [sellerReady, setSellerReady] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Fashion', price: '', oldPrice: '', image: '', sizes: '', colors: '', description: '' })
  const [selected, setSelected] = useState<Product | null>(null)
  const [buyForm, setBuyForm] = useState({ address: '', phone: '' })
  const [message, setMessage] = useState('')

  const token = () => localStorage.getItem('apna-cart-token')
  const api = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers); headers.set('content-type', 'application/json'); const t = token(); if (t) headers.set('authorization', `Bearer ${t}`)
    const response = await fetch(`${API}${path}`, { ...options, headers }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Request failed'); return data
  }

  useEffect(() => { if (open) void loadProducts() }, [open])
  useEffect(() => localStorage.setItem('apna-cart-wishlist', JSON.stringify(wishlist)), [wishlist])
  const wished = useMemo(() => products.filter(p => wishlist.includes(p.id)), [products, wishlist])

  async function loadProducts() { try { const data = await api('/products'); setProducts(data.products || []) } catch { setProducts([]) } }
  function toggleWishlist(id: string) { setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setMessage(wishlist.includes(id) ? 'Wishlist se hata diya.' : 'Wishlist me save ho gaya.') }

  async function registerSeller() {
    if (!sellerName.trim()) return setMessage('Shop name bhariye.')
    if (!token()) return setMessage('Pehle Apna Cart me login karein.')
    setSaving(true); setMessage('')
    try { await api('/sellers', { method: 'POST', body: JSON.stringify({ name: sellerName.trim() }) }); setSellerReady(true); setMessage('Seller account ready hai. Ab product add kar sakte hain.') } catch (e) { setMessage(e instanceof Error ? e.message : 'Seller registration failed.') } finally { setSaving(false) }
  }

  async function addProduct() {
    if (!newProduct.name.trim() || !newProduct.price) return setMessage('Product name aur price bhariye.')
    setSaving(true); setMessage('')
    try { const data = await api('/products', { method: 'POST', body: JSON.stringify({ ...newProduct, price: Number(newProduct.price), oldPrice: Number(newProduct.oldPrice || newProduct.price), sizes: newProduct.sizes.split(',').map(x => x.trim()).filter(Boolean), colors: newProduct.colors.split(',').map(x => x.trim()).filter(Boolean) }) }); setProducts(prev => [data.product, ...prev]); setNewProduct({ name: '', category: 'Fashion', price: '', oldPrice: '', image: '', sizes: '', colors: '', description: '' }); setMessage('Product marketplace par live ho gaya.') } catch (e) { setMessage(e instanceof Error ? e.message : 'Product add nahi hua.') } finally { setSaving(false) }
  }

  async function buyProduct() {
    if (!selected) return
    if (!token()) return setMessage('Order karne ke liye pehle login karein.')
    if (!buyForm.address.trim() || buyForm.phone.replace(/\D/g, '').length < 10) return setMessage('Valid address aur mobile number bhariye.')
    setSaving(true)
    try { await api('/orders', { method: 'POST', body: JSON.stringify({ items: [{ ...selected, quantity: 1 }], total: selected.price, address: buyForm.address.trim(), phone: buyForm.phone.trim(), email: '', paymentMethod: 'Cash on Delivery' }) }); setMessage('Order place ho gaya! My Orders me tracking dekhein.'); setSelected(null); setBuyForm({ address: '', phone: '' }) } catch (e) { setMessage(e instanceof Error ? e.message : 'Order place nahi hua.') } finally { setSaving(false) }
  }

  return <>
    <button className="marketplace-fab" onClick={() => setOpen(true)} aria-label="Marketplace">☰</button>
    {open && <div className="marketplace-overlay" onClick={() => setOpen(false)}><section className="marketplace-panel" onClick={e => e.stopPropagation()}>
      <div className="marketplace-panel-head"><h3>Apna Cart Marketplace</h3><button onClick={() => setOpen(false)}>✕</button></div>
      <div className="marketplace-tabs">{([['shop', 'Shop'], ['seller', 'Sell'], ['wishlist', `Wishlist (${wishlist.length})`], ['help', 'Help']] as const).map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>)}</div>
      {message && <div className="marketplace-message">{message}</div>}

      {section === 'shop' && <div className="marketplace-content"><h4>Seller Products</h4>{products.length === 0 ? <p>No seller products yet. Sell tab se pehla product add karein.</p> : <div className="marketplace-products">{products.map(p => <article className="marketplace-product" key={p.id}><img src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'} alt={p.name} /><button className="marketplace-heart" onClick={() => toggleWishlist(p.id)}>{wishlist.includes(p.id) ? '♥' : '♡'}</button><b>{p.name}</b><span>{p.sellerName || 'Apna Cart Seller'}</span><strong>₹{p.price.toLocaleString('en-IN')}</strong><small>{p.sizes?.length ? `Size: ${p.sizes.join(', ')}` : ''}{p.colors?.length ? ` • Colour: ${p.colors.join(', ')}` : ''}</small><button className="marketplace-primary" onClick={() => setSelected(p)}>Buy Now</button></article>)}</div>}</div>}

      {section === 'wishlist' && <div className="marketplace-content"><h4>❤️ My Wishlist</h4>{wished.length === 0 ? <p>Abhi wishlist empty hai. Shop me ♥ dabayein.</p> : <div className="marketplace-products">{wished.map(p => <article className="marketplace-product" key={p.id}><img src={p.image} alt={p.name} /><b>{p.name}</b><strong>₹{p.price.toLocaleString('en-IN')}</strong><button className="marketplace-primary" onClick={() => setSelected(p)}>Buy Now</button></article>)}</div>}</div>}

      {section === 'seller' && <div className="marketplace-content"><h4>🏪 Seller Center</h4><p>Login karke apni shop banao aur products customers ko sell karo.</p>{!sellerReady && <><input value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Shop name" /><button className="marketplace-primary" disabled={saving} onClick={registerSeller}>{saving ? 'Saving...' : 'Create Seller Account'}</button></>}{sellerReady && <><input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name" /><select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}><option>Fashion</option><option>Electronics</option><option>Footwear</option><option>Home</option><option>Beauty</option><option>Other</option></select><input inputMode="numeric" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Selling price" /><input inputMode="numeric" value={newProduct.oldPrice} onChange={e => setNewProduct({ ...newProduct, oldPrice: e.target.value })} placeholder="MRP / old price" /><input value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })} placeholder="Sizes: S, M, L, XL" /><input value={newProduct.colors} onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })} placeholder="Colours: Black, Blue" /><input value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="Product image URL" /><textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Product description" rows={3} /><button className="marketplace-primary" disabled={saving} onClick={addProduct}>{saving ? 'Publishing...' : 'Publish Product'}</button></>}</div>}

      {section === 'help' && <div className="marketplace-content"><h4>🛡️ Safe Shopping</h4><p>Product details, seller name aur price check karke order karein. Order place hone ke baad My Orders me status track karein.</p><p>Abhi working payment option <b>Cash on Delivery</b> hai. UPI/Card gateway baad me securely connect kiya ja sakta hai.</p></div>}

      {selected && <div className="marketplace-buy-overlay"><div className="marketplace-buy"><button className="marketplace-close" onClick={() => setSelected(null)}>✕</button><img src={selected.image} alt={selected.name} /><h4>{selected.name}</h4><strong>₹{selected.price.toLocaleString('en-IN')}</strong>{selected.description && <p>{selected.description}</p>}<input value={buyForm.address} onChange={e => setBuyForm({ ...buyForm, address: e.target.value })} placeholder="Delivery address" /><input value={buyForm.phone} onChange={e => setBuyForm({ ...buyForm, phone: e.target.value })} placeholder="Mobile number" /><button className="marketplace-primary" disabled={saving} onClick={buyProduct}>{saving ? 'Placing...' : 'Place COD Order'}</button></div></div>}
    </section></div>}
  </>
}
