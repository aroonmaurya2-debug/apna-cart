import { useEffect, useMemo, useState } from 'react'

type Product = {
  id: number
  name: string
  category: string
  price: number
  oldPrice: number
  image: string
  rating: number
  reviews: number
  discount: string
  sizes: string[]
  colors: string[]
}

type CartLine = { productId: number; quantity: number; size: string; color: string }
type User = { name: string; contact: string }
type Order = { id: string | number; items: Array<Product & { quantity: number; size?: string; color?: string }>; total: number; status: string; location: string; address?: string }
type PaymentMethod = 'Cash on Delivery' | 'UPI' | 'Card'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'

const products: Product[] = [
  { id: 1, name: 'Printed Cotton Kurti Set', category: 'Fashion', price: 499, oldPrice: 999, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: 120, discount: '50% OFF', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Pink', 'Blue', 'Green'] },
  { id: 2, name: 'Running Shoes', category: 'Footwear', price: 1999, oldPrice: 3499, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', rating: 4.6, reviews: 85, discount: '43% OFF', sizes: ['6', '7', '8', '9', '10'], colors: ['Red', 'Black', 'White'] },
  { id: 3, name: 'Wireless Headphones', category: 'Electronics', price: 1299, oldPrice: 2499, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', rating: 4.4, reviews: 65, discount: '48% OFF', sizes: ['Standard'], colors: ['Black', 'White', 'Blue'] },
  { id: 4, name: "Men's Watch", category: 'Fashion', price: 799, oldPrice: 1999, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', rating: 4.3, reviews: 92, discount: '60% OFF', sizes: ['Standard'], colors: ['Black', 'Silver', 'Brown'] },
  { id: 5, name: 'Backpack', category: 'Fashion', price: 899, oldPrice: 1799, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', rating: 4.2, reviews: 45, discount: '50% OFF', sizes: ['Standard'], colors: ['Black', 'Blue', 'Grey'] },
  { id: 6, name: 'Smartphone', category: 'Electronics', price: 12999, oldPrice: 18999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: 110, discount: '32% OFF', sizes: ['128 GB', '256 GB'], colors: ['Black', 'Blue'] },
  { id: 7, name: 'Home Decor Plant', category: 'Home', price: 399, oldPrice: 799, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85', rating: 4.1, reviews: 38, discount: '50% OFF', sizes: ['Small', 'Medium'], colors: ['Green'] },
  { id: 8, name: 'Lipstick', category: 'Beauty', price: 299, oldPrice: 599, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85', rating: 4.4, reviews: 72, discount: '50% OFF', sizes: ['3.5 g'], colors: ['Red', 'Pink', 'Nude'] },
]

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function ShopApp() {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('apna-cart-user') || 'null'))
  const [cart, setCart] = useState<CartLine[]>(() => JSON.parse(localStorage.getItem('apna-cart-cart') || '[]'))
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [view, setView] = useState<'home' | 'cart' | 'checkout' | 'orders' | 'login'>('home')
  const [name, setName] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('Cash on Delivery')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => localStorage.setItem('apna-cart-cart', JSON.stringify(cart)), [cart])
  useEffect(() => { if (user) { localStorage.setItem('apna-cart-user', JSON.stringify(user)); void loadOrders() } else localStorage.removeItem('apna-cart-user') }, [user])

  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [category, query])
  const cartItems = cart.map(line => { const p = products.find(x => x.id === line.productId); return p ? { ...p, quantity: line.quantity, size: line.size, color: line.color } : null }).filter(Boolean) as Array<Product & { quantity: number; size: string; color: string }>
  const total = cartItems.reduce((s, x) => s + x.price * x.quantity, 0)
  const cartCount = cart.reduce((s, x) => s + x.quantity, 0)

  async function api(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers); headers.set('content-type', 'application/json')
    const token = localStorage.getItem('apna-cart-token'); if (token) headers.set('authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers }); const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Request failed'); return data
  }

  async function loadOrders() { try { const data = await api('/orders'); setOrders(data.orders || data || []) } catch { /* login may not have a server session yet */ } }

  function openProduct(p: Product) { setSelected(p); setSelectedSize(p.sizes[0]); setSelectedColor(p.colors[0]); setMessage('') }
  function addVariant(p: Product, size = selectedSize, color = selectedColor) {
    if (!size || !color) return setMessage('Size aur colour select karein.')
    setCart(prev => {
      const found = prev.find(x => x.productId === p.id && x.size === size && x.color === color)
      return found ? prev.map(x => x === found ? { ...x, quantity: x.quantity + 1 } : x) : [...prev, { productId: p.id, quantity: 1, size, color }]
    })
    setSelected(null); setMessage(`${p.name} cart me add ho gaya.`)
  }
  function changeQty(line: CartLine, delta: number) { setCart(prev => prev.map(x => x.productId === line.productId && x.size === line.size && x.color === line.color ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0)) }

  async function requestOtp() {
    const e = loginEmail.trim().toLowerCase(); if (!name.trim()) return setMessage('Name dijiye.'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setMessage('Valid email dijiye.')
    setLoading(true); setMessage('')
    try { await api('/auth/request-otp', { method: 'POST', body: JSON.stringify({ name: name.trim(), contact: e }) }); setMessage('OTP email par bhej diya gaya.') } catch (err) { setMessage(err instanceof Error ? err.message : 'OTP send nahi hua.') }
    setLoading(false)
  }
  async function verifyOtp() {
    const e = loginEmail.trim().toLowerCase(); if (!otp.trim()) return setMessage('OTP enter karein.'); setLoading(true); setMessage('')
    try { const data = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ contact: e, otp }) }); localStorage.setItem('apna-cart-token', data.token); setUser(data.user || { name, contact: e }); setView('home'); setMessage('Login successful!') } catch (err) { setMessage(err instanceof Error ? err.message : 'OTP verify nahi hua.') }
    setLoading(false)
  }
  async function placeOrder() {
    if (!user) return setView('login'); if (!cartItems.length) return setView('cart'); if (!address.trim() || phone.replace(/\D/g, '').length < 10) return setMessage('Full address aur valid mobile number bhariye.')
    setLoading(true); setMessage('')
    try { const data = await api('/orders', { method: 'POST', body: JSON.stringify({ customer: user, items: cartItems, total, address, phone, email, paymentMethod: payment }) }); setOrders(prev => [data.order, ...prev]); setCart([]); setView('orders'); setMessage('Order place ho gaya! Aapko order details mil gayi hain.') } catch (err) { setMessage(err instanceof Error ? err.message : 'Order place nahi hua.') }
    setLoading(false)
  }
  function logout() { localStorage.removeItem('apna-cart-token'); setUser(null); setOrders([]); setView('home') }

  return <div style={{ minHeight: '100vh', background: '#f7f7f7', color: '#222', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #eee', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => setView('home')} style={{ border: 0, background: 'none', fontSize: 22, fontWeight: 800 }}>🛍️ Apna <span style={{ color: '#9b2cff' }}>Cart</span></button>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, brands and more..." style={{ flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8 }} />
      <button onClick={() => user ? setView('orders') : setView('login')} style={{ border: 0, background: 'none', fontSize: 14 }}>📦 Orders</button>
      <button onClick={() => setView('cart')} style={{ border: 0, background: 'none', fontSize: 14 }}>🛒 {cartCount}</button>
    </header>

    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      {message && <div style={{ background: '#eaf8ef', color: '#18733a', padding: 12, borderRadius: 8, marginBottom: 14 }}>{message}</div>}

      {view === 'home' && <>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>{['All', 'Fashion', 'Footwear', 'Electronics', 'Home', 'Beauty'].map(c => <button key={c} onClick={() => setCategory(c)} style={{ padding: '9px 15px', borderRadius: 20, border: category === c ? '1px solid #9b2cff' : '1px solid #ddd', background: category === c ? '#f2e7ff' : '#fff' }}>{c}</button>)}</div>
        <h2>Featured Products</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
          {filtered.map(p => <article key={p.id} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #eee' }}>
            <button onClick={() => openProduct(p)} style={{ border: 0, background: 'none', padding: 0, width: '100%', cursor: 'pointer' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: 230, objectFit: 'cover' }} /></button>
            <div style={{ padding: 12 }}><h3 style={{ margin: '0 0 7px' }}>{p.name}</h3><div>⭐ {p.rating} <span style={{ color: '#777' }}>({p.reviews})</span></div><div style={{ marginTop: 7 }}><b>{money(p.price)}</b> <del style={{ color: '#999' }}>{money(p.oldPrice)}</del> <span style={{ color: '#16833b', fontSize: 12 }}>{p.discount}</span></div><button onClick={() => openProduct(p)} style={{ width: '100%', marginTop: 10, padding: 11, border: 0, borderRadius: 7, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>View Product</button></div>
          </article>)}
        </div>
      </>}

      {view === 'cart' && <section style={{ background: '#fff', padding: 18, borderRadius: 10 }}><h2>🛒 My Cart</h2>{!cartItems.length ? <p>Cart empty hai. Product select karke Add to Cart karein.</p> : <>{cartItems.map(item => <div key={`${item.id}-${item.size}-${item.color}`} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' }}><img src={item.image} alt="" style={{ width: 80, height: 90, objectFit: 'cover', borderRadius: 7 }} /><div style={{ flex: 1 }}><b>{item.name}</b><div>Size: {item.size} · Colour: {item.color}</div><div>{money(item.price)}</div><div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}><button onClick={() => changeQty(item, -1)}>-</button><b>{item.quantity}</b><button onClick={() => changeQty(item, 1)}>+</button></div></div></div>)}<h3 style={{ textAlign: 'right' }}>Total: {money(total)}</h3><button onClick={() => user ? setView('checkout') : setView('login')} style={{ width: '100%', padding: 13, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>Proceed to Checkout</button></>}</section>}

      {view === 'checkout' && <section style={{ background: '#fff', padding: 18, borderRadius: 10, maxWidth: 650, margin: '0 auto' }}><h2>📦 Delivery & Order</h2><textarea value={address} onChange={e => setAddress(e.target.value)} rows={4} placeholder="Full delivery address" style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 10 }} /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 digit mobile number" style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 10 }} /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 10 }} /><select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)} style={{ width: '100%', padding: 12, marginBottom: 12 }}>{(['Cash on Delivery', 'UPI', 'Card'] as PaymentMethod[]).map(x => <option key={x}>{x}</option>)}</select><div style={{ padding: 12, background: '#f7f7f7', borderRadius: 8, marginBottom: 12 }}><b>Order total: {money(total)}</b><div>{cartItems.length} item(s)</div></div><button disabled={loading} onClick={placeOrder} style={{ width: '100%', padding: 13, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>{loading ? 'Placing Order...' : 'Place Order'}</button></section>}

      {view === 'login' && <section style={{ background: '#fff', padding: 18, borderRadius: 10, maxWidth: 450, margin: '0 auto' }}><h2>Login / Register</h2><input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 10 }} /><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 10 }} /><button disabled={loading} onClick={requestOtp} style={{ width: '100%', padding: 12, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff' }}>Send OTP</button><input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6 digit OTP" maxLength={6} style={{ width: '100%', boxSizing: 'border-box', padding: 12, margin: '10px 0' }} /><button disabled={loading} onClick={verifyOtp} style={{ width: '100%', padding: 12, border: 0, borderRadius: 8, background: '#16833b', color: '#fff' }}>Verify & Login</button><p style={{ color: '#777', fontSize: 13 }}>Free option: OTP email par aayega.</p></section>}

      {view === 'orders' && <section style={{ background: '#fff', padding: 18, borderRadius: 10 }}><h2>📦 My Orders</h2>{orders.length === 0 ? <p>No orders yet.</p> : orders.map(o => <div key={o.id} style={{ padding: 14, border: '1px solid #eee', borderRadius: 8, marginBottom: 10 }}><b>Order #{o.id}</b><div>Total: {money(o.total)}</div><div>Status: <b>{o.status}</b> · {o.location}</div><div>{o.items?.map((i, n) => <div key={n}>{i.name} × {i.quantity} {i.size ? `· ${i.size}` : ''} {i.color ? `· ${i.color}` : ''}</div>)}</div></div>)}</section>}
    </main>

    {selected && <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 15 }}><div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(900px,100%)', maxHeight: '92vh', overflow: 'auto', padding: 16 }}><button onClick={() => setSelected(null)} style={{ float: 'right', border: 0, background: '#eee', borderRadius: '50%', width: 34, height: 34 }}>✕</button><div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(280px,1fr)', gap: 20 }}><img src={selected.image} alt={selected.name} style={{ width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 10 }} /><div><h2>{selected.name}</h2><div>⭐ {selected.rating} ({selected.reviews})</div><h2>{money(selected.price)} <del style={{ color: '#999', fontSize: 16 }}>{money(selected.oldPrice)}</del></h2><p style={{ color: '#16833b' }}>{selected.discount}</p><h4>Size</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{selected.sizes.map(s => <button key={s} onClick={() => setSelectedSize(s)} style={{ padding: '9px 14px', borderRadius: 7, border: selectedSize === s ? '2px solid #9b2cff' : '1px solid #ddd', background: selectedSize === s ? '#f2e7ff' : '#fff' }}>{s}</button>)}</div><h4>Colour</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{selected.colors.map(c => <button key={c} onClick={() => setSelectedColor(c)} style={{ padding: '9px 14px', borderRadius: 7, border: selectedColor === c ? '2px solid #9b2cff' : '1px solid #ddd', background: selectedColor === c ? '#f2e7ff' : '#fff' }}>{c}</button>)}</div><button onClick={() => addVariant(selected)} style={{ width: '100%', padding: 14, marginTop: 20, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff', fontWeight: 800 }}>🛒 Add to Cart</button><button onClick={() => { addVariant(selected); setView('cart') }} style={{ width: '100%', padding: 14, marginTop: 8, border: '1px solid #9b2cff', borderRadius: 8, background: '#fff', color: '#9b2cff', fontWeight: 800 }}>Buy Now</button></div></div></div></div>}
  </div>
}
