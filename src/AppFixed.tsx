import { useEffect, useMemo, useState } from 'react'

type Product = { id: number; name: string; category: string; price: number; oldPrice: number; image: string; rating: number; reviews: number; discount: string }
type CartLine = { productId: number; quantity: number }
type User = { name: string; contact: string }
type Order = { id: string | number; items: Array<Product & { quantity: number }>; total: number; status: string; location: string; phone: string; email: string; address?: string }
type PaymentMethod = 'UPI' | 'Card' | 'Net banking' | 'Wallet' | 'Cash on Delivery'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'

const products: Product[] = [
  { id: 1, name: 'Printed cotton kurti set', category: 'Fashion', price: 499, oldPrice: 999, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=85', rating: 4.5, reviews: 120, discount: '50% OFF' },
  { id: 2, name: 'Running Shoes', category: 'Footwear', price: 1999, oldPrice: 3499, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85', rating: 4.6, reviews: 85, discount: '43% OFF' },
  { id: 3, name: 'Wireless Headphones', category: 'Electronics', price: 1299, oldPrice: 2499, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85', rating: 4.4, reviews: 65, discount: '48% OFF' },
  { id: 4, name: "Men's Watch", category: 'Fashion', price: 799, oldPrice: 1999, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85', rating: 4.3, reviews: 92, discount: '60% OFF' },
  { id: 5, name: 'Backpack', category: 'Fashion', price: 899, oldPrice: 1799, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85', rating: 4.2, reviews: 45, discount: '50% OFF' },
  { id: 6, name: 'Smartphone', category: 'Electronics', price: 12999, oldPrice: 18999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=85', rating: 4.5, reviews: 110, discount: '32% OFF' },
  { id: 7, name: 'Home Decor Plant', category: 'Home', price: 399, oldPrice: 799, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=85', rating: 4.1, reviews: 38, discount: '50% OFF' },
  { id: 8, name: 'Lipstick', category: 'Beauty', price: 299, oldPrice: 599, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=85', rating: 4.4, reviews: 72, discount: '50% OFF' },
]

const categories = [
  ['All', '✨'], ['Fashion', '👕'], ['Mobiles', '📱'], ['Electronics', '💻'], ['Home', '🏠'], ['Footwear', '👟'], ['Beauty', '💄'],
]
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function App() {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('apna-cart-user') || 'null'))
  const [cart, setCart] = useState<CartLine[]>(() => JSON.parse(localStorage.getItem('apna-cart-cart') || '[]'))
  const [orders, setOrders] = useState<Order[]>([])
  const [queryText, setQueryText] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState<'home' | 'cart' | 'checkout' | 'orders' | 'login'>('home')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('Cash on Delivery')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => localStorage.setItem('apna-cart-cart', JSON.stringify(cart)), [cart])
  useEffect(() => { if (user) localStorage.setItem('apna-cart-user', JSON.stringify(user)); else localStorage.removeItem('apna-cart-user') }, [user])
  useEffect(() => { if (user) void loadOrders() }, [user])

  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(queryText.toLowerCase())), [category, queryText])
  const cartItems = cart.map(line => ({ ...products.find(p => p.id === line.productId)!, quantity: line.quantity })).filter(Boolean)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (id: number) => setCart(prev => prev.some(x => x.productId === id) ? prev.map(x => x.productId === id ? { ...x, quantity: x.quantity + 1 } : x) : [...prev, { productId: id, quantity: 1 }])
  const changeQty = (id: number, delta: number) => setCart(prev => prev.map(x => x.productId === id ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0))

  async function api(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('apna-cart-token')
    const headers = new Headers(options.headers)
    headers.set('content-type', 'application/json')
    if (token) headers.set('authorization', `Bearer ${token}`)
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  async function loadOrders() {
    try { const data = await api('/orders'); setOrders(data.orders || data || []) } catch (error) {
      if (error instanceof Error && /login again/i.test(error.message)) { localStorage.removeItem('apna-cart-token'); setUser(null) }
    }
  }

  async function requestOtp() {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return setMessage('Valid mobile number dijiye.')
    if (!name.trim()) return setMessage('Name dijiye.')
    setLoading(true); setMessage('')
    try { await api('/auth/request-otp', { method: 'POST', body: JSON.stringify({ name: name.trim(), contact: phone.startsWith('+') ? phone : `+91${cleanPhone}` }) }); setMessage('OTP bhej diya gaya. OTP enter karein.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'OTP send nahi hua.') }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp.trim()) return setMessage('OTP enter karein.')
    setLoading(true); setMessage('')
    try {
      const contact = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`
      const data = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ contact, otp }) })
      if (!data.token) throw new Error('Login token nahi mila.')
      localStorage.setItem('apna-cart-token', data.token)
      const loggedUser = data.user || { name: name.trim() || 'Apna Cart User', contact }
      setUser(loggedUser); setPhone(loggedUser.contact); setView('home'); setMessage('Login successful!')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'OTP verify nahi hua.') }
    setLoading(false)
  }

  async function placeOrder() {
    if (!user) return setView('login')
    if (!address.trim() || phone.replace(/\D/g, '').length < 10) return setMessage('Address aur valid mobile number bhariye.')
    setLoading(true); setMessage('')
    try { const data = await api('/orders', { method: 'POST', body: JSON.stringify({ customer: user, items: cartItems, total, address, phone, email, paymentMethod: payment }) }); setOrders(prev => [data.order, ...prev]); setCart([]); setView('orders'); setMessage('Order place ho gaya!') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Order place nahi hua.') }
    setLoading(false)
  }

  async function updateStatus(order: Order, status: string) {
    const location = status === 'Processing' ? 'Order received' : status === 'Accepted' ? 'Order accepted' : status === 'Shipped' ? 'On the way' : 'Delivered'
    try { const data = await api(`/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status, location }) }); setOrders(prev => prev.map(x => x.id === order.id ? (data.order || { ...x, status, location }) : x)) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Status update nahi hua.') }
  }

  function logout() { localStorage.removeItem('apna-cart-token'); setUser(null); setOrders([]); setView('home'); setMessage('Logout successful.') }

  const goHome = () => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="app-shell">
    <header className="top-header">
      <button className="brand" onClick={goHome}><span className="brand-bag">🛍️</span><span>Apna <b>Cart</b></span></button>
      <div className="header-actions"><button className="icon-button" onClick={() => setView('orders')} aria-label="Orders">🔔</button><button className="icon-button" onClick={() => user ? logout() : setView('login')} aria-label="Account">{user ? '👤' : '◉'}</button></div>
    </header>

    <main className="main-content">
      <div className="search-box"><span>⌕</span><input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Search products, brands and more..." /></div>

      {message && <div className="message">{message}</div>}

      {view === 'home' && <>
        <section className="category-strip">{categories.map(([label, icon]) => <button key={label} className={`category-item ${category === (label === 'Mobiles' ? 'Electronics' : label) ? 'active' : ''}`} onClick={() => setCategory(label === 'Mobiles' ? 'Electronics' : label)}><span className="category-icon">{icon}</span><span>{label}</span></button>)}</section>
        <section className="section-heading"><h2>Featured Products</h2><button onClick={() => { setCategory('All'); setQueryText('') }}>View All →</button></section>
        <section className="product-grid">{filtered.map(p => <article key={p.id} className="product-card"><button className="heart" aria-label="Wishlist">♡</button><img src={p.image} alt={p.name} /><div className="product-info"><h3>{p.name}</h3><div className="rating">⭐ {p.rating} <span>({p.reviews})</span></div><div className="price-row"><strong>{money(p.price)}</strong><del>{money(p.oldPrice)}</del><span className="discount">{p.discount}</span></div><button className="add-button" onClick={() => { addToCart(p.id); setMessage(`${p.name} cart me add ho gaya.`) }}>🛒 Add to Cart</button></div></article>)}</section>
      </>}

      {view === 'cart' && <section className="page-card"><h2>🛒 Your Cart</h2>{cartItems.length === 0 ? <p>Cart empty hai.</p> : <>{cartItems.map(item => <div className="cart-line" key={item.id}><img src={item.image} alt="" /><div className="cart-detail"><b>{item.name}</b><span>{money(item.price)}</span><div className="qty"><button onClick={() => changeQty(item.id, -1)}>-</button><b>{item.quantity}</b><button onClick={() => changeQty(item.id, 1)}>+</button></div></div></div>)}<div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-wide" onClick={() => user ? setView('checkout') : setView('login')}>Proceed to Checkout</button></>}</section>}

      {view === 'login' && <section className="form-card"><h2>Login / Register</h2><p className="muted">Apna Cart par shopping shuru karein.</p><input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" /><button className="primary-wide" disabled={loading} onClick={requestOtp}>{loading ? 'Sending...' : 'Send OTP'}</button><input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" /><button className="primary-wide" disabled={loading} onClick={verifyOtp}>{loading ? 'Verifying...' : 'Verify & Login'}</button><p className="muted small">OTP backend se send hoga; Firebase billing ki zarurat nahi hai.</p></section>}

      {view === 'checkout' && <section className="form-card"><h2>📦 Checkout</h2><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address" rows={4} /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" /><label>Payment method</label><select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}>{(['UPI', 'Card', 'Net banking', 'Wallet', 'Cash on Delivery'] as PaymentMethod[]).map(x => <option key={x}>{x}</option>)}</select><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-wide" disabled={loading} onClick={placeOrder}>{loading ? 'Placing...' : 'Place Order'}</button></section>}

      {view === 'orders' && <section className="page-card"><h2>📦 My Orders</h2>{orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => <article className="order-card" key={order.id}><div className="order-head"><b>Order #{String(order.id).slice(0, 8)}</b><strong>{money(order.total)}</strong></div><p>📍 {order.location || order.address}</p><p>Status: <b>{order.status}</b></p><div className="status-row">{['Processing', 'Accepted', 'Shipped', 'Delivered'].map(s => <button key={s} className={order.status === s ? 'selected' : ''} onClick={() => updateStatus(order, s)}>{s}</button>)}</div></article>)}</section>}
    </main>

    <nav className="bottom-nav"><button className={view === 'home' ? 'active' : ''} onClick={goHome}><span>⌂</span>Home</button><button className="nav-category" onClick={() => { setView('home'); setCategory('All') }}><span>▦</span>Categories</button><button className={view === 'cart' ? 'active' : ''} onClick={() => setView('cart')}><span>🛒<i>{cartCount}</i></span>Cart</button><button onClick={() => setMessage('Wishlist feature coming soon.')}><span>♡</span>Wishlist</button><button className={view === 'login' || user ? 'active' : ''} onClick={() => user ? logout() : setView('login')}><span>♙</span>{user ? 'Logout' : 'Account'}</button></nav>
  </div>
}
