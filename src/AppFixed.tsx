import { useEffect, useMemo, useState } from 'react'

type Product = { id: number; name: string; category: string; price: number; image: string; rating: number; badge?: string }
type CartLine = { productId: number; quantity: number }
type User = { name: string; contact: string }
type Order = { id: string | number; items: Array<Product & { quantity: number }>; total: number; status: string; location: string; phone: string; email: string; address?: string }
type PaymentMethod = 'UPI' | 'Card' | 'Net banking' | 'Wallet' | 'Cash on Delivery'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const products: Product[] = [
  { id: 1, name: 'Printed cotton kurti set', category: 'Fashion', price: 499, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=85', rating: 4.5, badge: 'Bestseller' },
  { id: 2, name: 'Casual sneakers', category: 'Footwear', price: 799, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85', rating: 4.4 },
  { id: 3, name: 'Smart watch', category: 'Electronics', price: 1299, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85', rating: 4.3, badge: 'Popular' },
  { id: 4, name: 'Kitchen storage set', category: 'Home', price: 599, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=85', rating: 4.6 },
  { id: 5, name: 'Cotton bedsheet', category: 'Home', price: 699, image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=800&q=85', rating: 4.5 },
  { id: 6, name: 'Women handbag', category: 'Fashion', price: 449, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85', rating: 4.2 },
  { id: 7, name: 'Bluetooth earbuds', category: 'Electronics', price: 899, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=85', rating: 4.4 },
  { id: 8, name: 'Men casual shirt', category: 'Fashion', price: 549, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=85', rating: 4.3 },
]
const categories = ['All', 'Fashion', 'Footwear', 'Electronics', 'Home']
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
    try {
      const data = await api('/orders')
      setOrders(data.orders || data || [])
    } catch (error) {
      if (error instanceof Error && /login again/i.test(error.message)) {
        localStorage.removeItem('apna-cart-token')
        setUser(null)
      }
    }
  }

  async function requestOtp() {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) return setMessage('Valid mobile number dijiye.')
    if (!name.trim()) return setMessage('Name dijiye.')
    setLoading(true); setMessage('')
    try {
      await api('/auth/request-otp', { method: 'POST', body: JSON.stringify({ name: name.trim(), contact: phone.startsWith('+') ? phone : `+91${cleanPhone}` }) })
      setMessage('OTP bhej diya gaya. OTP enter karein.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP send nahi hua.')
    }
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
      setUser(loggedUser)
      setPhone(loggedUser.contact)
      setView('home')
      setMessage('Login successful!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'OTP verify nahi hua.')
    }
    setLoading(false)
  }

  async function placeOrder() {
    if (!user) return setView('login')
    if (!address.trim() || phone.replace(/\D/g, '').length < 10) return setMessage('Address aur valid mobile number bhariye.')
    setLoading(true); setMessage('')
    try {
      const data = await api('/orders', { method: 'POST', body: JSON.stringify({ customer: user, items: cartItems, total, address, phone, email, paymentMethod: payment }) })
      setOrders(prev => [data.order, ...prev]); setCart([]); setView('orders'); setMessage('Order place ho gaya!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Order place nahi hua.')
    }
    setLoading(false)
  }

  async function updateStatus(order: Order, status: string) {
    const location = status === 'Processing' ? 'Order received' : status === 'Accepted' ? 'Order accepted' : status === 'Shipped' ? 'On the way' : 'Delivered'
    try {
      const data = await api(`/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status, location }) })
      setOrders(prev => prev.map(x => x.id === order.id ? (data.order || { ...x, status, location }) : x))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Status update nahi hua.') }
  }

  function logout() { localStorage.removeItem('apna-cart-token'); setUser(null); setOrders([]); setView('home'); setMessage('Logout successful.') }

  const Header = () => <header style={{ position: 'sticky', top: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid #eee', padding: '12px 4%', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={() => setView('home')} style={{ fontSize: 22, fontWeight: 800, border: 0, background: 'none' }}>🛍️ Apna Cart</button><input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Search products..." style={{ flex: 1, minWidth: 180, padding: 12, border: '1px solid #ddd', borderRadius: 10 }} /><button onClick={() => setView('orders')}>📦 Orders</button><button onClick={() => setView('cart')}>🛒 Cart ({cartCount})</button>{user ? <button onClick={logout}>Logout</button> : <button onClick={() => setView('login')}>Login</button>}</header>

  return <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'Arial,sans-serif', color: '#222' }}><Header /><main style={{ maxWidth: 1200, margin: 'auto', padding: 20 }}>
    {message && <div style={{ padding: 12, marginBottom: 15, borderRadius: 10, background: '#fff3cd' }}>{message}</div>}
    {view === 'home' && <><div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 18 }}>{categories.map(c => <button key={c} onClick={() => setCategory(c)} style={{ padding: '10px 18px', borderRadius: 20, border: '1px solid #ddd', background: category === c ? '#222' : '#fff', color: category === c ? '#fff' : '#222' }}>{c}</button>)}</div><section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>{filtered.map(p => <article key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #eee' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: 220, objectFit: 'cover' }} /><div style={{ padding: 14 }}><small>{p.category} · ⭐ {p.rating}</small><h3>{p.name}</h3><strong style={{ fontSize: 20 }}>{money(p.price)}</strong>{p.badge && <span style={{ marginLeft: 8, fontSize: 12 }}>• {p.badge}</span>}<button onClick={() => addToCart(p.id)} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 9, border: 0, background: '#222', color: '#fff' }}>Add to Cart</button></div></article>)}</section></>}
    {view === 'cart' && <section><h2>Your Cart</h2>{cartItems.length === 0 ? <p>Cart empty hai.</p> : <>{cartItems.map(item => <div key={item.id} style={{ background: '#fff', padding: 12, marginBottom: 10, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}><img src={item.image} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8 }} /><div style={{ flex: 1 }}><b>{item.name}</b><div>{money(item.price)} × {item.quantity}</div></div><button onClick={() => changeQty(item.id, -1)}>-</button><span>{item.quantity}</span><button onClick={() => changeQty(item.id, 1)}>+</button></div>)}<h3>Total: {money(total)}</h3><button onClick={() => user ? setView('checkout') : setView('login')} style={{ padding: 13, width: '100%', maxWidth: 400 }}>Proceed to Checkout</button></>}</section>}
    {view === 'login' && <section style={{ maxWidth: 480, margin: '40px auto', background: '#fff', padding: 24, borderRadius: 14 }}><h2>Login / Register</h2><input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={{ width: '100%', padding: 12, marginBottom: 10, boxSizing: 'border-box' }} /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" style={{ width: '100%', padding: 12, marginBottom: 10, boxSizing: 'border-box' }} /><button disabled={loading} onClick={requestOtp} style={{ width: '100%', padding: 12 }}>{loading ? 'Sending...' : 'Send OTP'}</button><input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" style={{ width: '100%', padding: 12, marginTop: 10, boxSizing: 'border-box' }} /><button disabled={loading} onClick={verifyOtp} style={{ width: '100%', padding: 12, marginTop: 10 }}>{loading ? 'Verifying...' : 'Verify & Login'}</button><p style={{ color: '#666', fontSize: 13 }}>OTP backend se send hoga; Firebase billing ki zarurat nahi hai.</p></section>}
    {view === 'checkout' && <section style={{ maxWidth: 650, margin: 'auto', background: '#fff', padding: 24, borderRadius: 14 }}><h2>Checkout</h2><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address" rows={4} style={{ width: '100%', padding: 12, boxSizing: 'border-box' }} /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" style={{ width: '100%', padding: 12, marginTop: 10, boxSizing: 'border-box' }} /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={{ width: '100%', padding: 12, marginTop: 10, boxSizing: 'border-box' }} /><h3>Payment</h3><select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)} style={{ width: '100%', padding: 12 }}>{(['UPI', 'Card', 'Net banking', 'Wallet', 'Cash on Delivery'] as PaymentMethod[]).map(x => <option key={x}>{x}</option>)}</select><h3>Total: {money(total)}</h3><button disabled={loading} onClick={placeOrder} style={{ width: '100%', padding: 14 }}>Place Order</button></section>}
    {view === 'orders' && <section><h2>My Orders</h2>{orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => <article key={order.id} style={{ background: '#fff', border: '1px solid #eee', padding: 16, borderRadius: 14, marginBottom: 14 }}><b>Order #{String(order.id).slice(0, 8)}</b><p>Total: {money(order.total)} · Status: <strong>{order.status}</strong></p><p>📍 {order.location || order.address}</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['Processing', 'Accepted', 'Shipped', 'Delivered'].map(s => <button key={s} onClick={() => updateStatus(order, s)}>{s}</button>)}</div></article>)}</section>}
  </main></div>
}
