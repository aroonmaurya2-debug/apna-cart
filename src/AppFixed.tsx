import { useEffect, useMemo, useRef, useState } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { auth, db, firebaseConfigured, requireFirebase } from './firebase'

type Product = { id: number; name: string; category: string; price: number; image: string; rating: number; badge?: string }
type CartLine = { productId: number; quantity: number }
type User = { name: string; contact: string }
type Order = { id: string; items: Array<Product & { quantity: number }>; total: number; status: string; location: string; phone: string; email: string }

type PaymentMethod = 'UPI' | 'Card' | 'Net banking' | 'Wallet' | 'Cash on Delivery'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : '/.netlify/functions/api'
const products: Product[] = [
  { id: 1, name: 'Printed cotton kurti set', category: 'Fashion', price: 499, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=85', rating: 4.5, badge: 'Bestseller' },
  { id: 2, name: 'Oversized everyday tee', category: 'Fashion', price: 299, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85', rating: 4.3, badge: 'Popular' },
  { id: 3, name: 'Canvas sling bag', category: 'Fashion', price: 349, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85', rating: 4.6, badge: 'Deal' },
  { id: 4, name: 'Minimal ceramic planter', category: 'Home', price: 279, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=85', rating: 4.7 },
  { id: 5, name: 'Everyday skincare trio', category: 'Beauty', price: 599, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=85', rating: 4.6, badge: 'Top rated' },
  { id: 6, name: 'Wireless earbuds', category: 'Electronics', price: 799, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=85', rating: 4.1 },
  { id: 7, name: 'Bamboo storage basket', category: 'Home', price: 529, image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=85', rating: 4.8 },
  { id: 8, name: 'Healthy snack box', category: 'Grocery', price: 349, image: 'https://images.unsplash.com/photo-1599599810694-57a7d4c1f53a?auto=format&fit=crop&w=800&q=85', rating: 4.4 },
]
const categories = ['All products', 'Fashion', 'Home', 'Beauty', 'Electronics', 'Grocery']
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`

function AppFixed() {
  const [category, setCategory] = useState('All products')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('apna_cart_api_user') || 'null') } catch { return null } })
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginStep, setLoginStep] = useState<'contact' | 'otp'>('contact')
  const [loginName, setLoginName] = useState('')
  const [loginContact, setLoginContact] = useState('')
  const [otp, setOtp] = useState('')
  const [authMode, setAuthMode] = useState<'backend' | 'firebase'>('backend')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const recaptcha = useRef<RecaptchaVerifier | null>(null)
  const [drawer, setDrawer] = useState<'cart' | 'orders' | null>(null)
  const [checkout, setCheckout] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('Cash on Delivery')
  const [notice, setNotice] = useState('')

  const token = () => localStorage.getItem('apna_cart_api_token') || ''
  const cartItems = useMemo(() => cart.map(line => ({ ...line, product: products.find(p => p.id === line.productId) })).filter((x): x is CartLine & { product: Product } => Boolean(x.product)), [cart])
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const visibleProducts = products.filter(p => (category === 'All products' || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()))

  const loadOrders = async (apiToken: string) => {
    const response = await fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${apiToken}` } })
    if (!response.ok) throw new Error('Session expired. Please login again.')
    const data = await response.json()
    setOrders(data.map((order: any) => ({ id: String(order.id), items: order.items, total: Number(order.total), status: order.status, location: order.location, phone: order.customer?.phone || '', email: order.customer?.email || '' })))
  }

  useEffect(() => {
    const apiToken = token()
    if (!apiToken) return
    loadOrders(apiToken).catch(() => { localStorage.removeItem('apna_cart_api_token'); localStorage.removeItem('apna_cart_api_user'); setUser(null) })
  }, [])

  const addToCart = (id: number) => { setCart(items => items.some(x => x.productId === id) ? items.map(x => x.productId === id ? { ...x, quantity: x.quantity + 1 } : x) : [...items, { productId: id, quantity: 1 }]); setDrawer('cart') }
  const changeQty = (id: number, delta: number) => setCart(items => items.map(x => x.productId === id ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0))

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/auth/request-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: loginName.trim(), contact: loginContact.trim() }) })
      if (response.ok) { setAuthMode('backend'); setLoginStep('otp'); setNotice(`OTP sent to ${loginContact}.`); return }
      if (!firebaseConfigured) { const data = await response.json().catch(() => ({})); throw new Error(data.message || 'OTP provider is not configured.') }
      const { auth: firebaseAuth } = requireFirebase()
      setAuthMode('firebase')
      if (!recaptcha.current) recaptcha.current = new RecaptchaVerifier(firebaseAuth, 'fixed-recaptcha', { size: 'invisible' })
      setConfirmation(await signInWithPhoneNumber(firebaseAuth, loginContact.trim(), recaptcha.current))
      setLoginStep('otp')
      setNotice(`OTP sent to ${loginContact}.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'OTP could not be sent.') }
  }

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (authMode === 'backend') {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: loginContact.trim(), otp: otp.trim() }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'OTP verification failed.')
        localStorage.setItem('apna_cart_api_token', data.token)
        localStorage.setItem('apna_cart_api_user', JSON.stringify(data.user))
        setUser(data.user)
        await loadOrders(data.token).catch(() => undefined)
      } else {
        if (!confirmation) throw new Error('Please request an OTP first.')
        const result = await confirmation.confirm(otp.trim())
        const profile = { name: loginName.trim() || 'Apna Cart shopper', contact: result.user.phoneNumber || loginContact.trim() }
        setUser(profile)
        if (db) await setDoc(doc(db, 'users', result.user.uid), { uid: result.user.uid, name: profile.name, phoneNumber: profile.contact, updatedAt: serverTimestamp() }, { merge: true })
      }
      setLoginOpen(false); setOtp(''); setNotice('Login successful. You can place your order now.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'OTP verification failed.') }
  }

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) { setLoginOpen(true); return }
    try {
      const apiToken = token()
      if (apiToken) {
        const response = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` }, body: JSON.stringify({ items: cartItems.map(x => ({ ...x.product, quantity: x.quantity })), total, paymentMethod: payment, address, phone, email }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Order could not be placed.')
        await loadOrders(apiToken)
      } else {
        const { db: firestoreDb } = requireFirebase()
        const firebaseUser = user
        const ref = await addDoc(collection(firestoreDb, 'orders'), { userId: firebaseUser.contact, customer: { name: user.name, phone, email }, items: cartItems.map(x => ({ ...x.product, quantity: x.quantity })), total, paymentMethod: payment, address, status: 'Processing', location: 'Order received', createdAt: serverTimestamp() })
        setOrders(current => [{ id: ref.id, items: cartItems.map(x => ({ ...x.product, quantity: x.quantity })), total, status: 'Processing', location: 'Order received', phone, email }, ...current])
      }
      setCart([]); setCheckout(false); setDrawer('orders'); setNotice(`Thanks ${user.name}! Your order is confirmed.`)
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Order could not be placed.') }
  }

  const updateStatus = async (orderId: string, status: string, location: string) => {
    try {
      const apiToken = token()
      if (apiToken) {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` }, body: JSON.stringify({ status, location }) })
        if (!response.ok) throw new Error('Order status could not be updated.')
        await loadOrders(apiToken)
      } else if (db) await updateDoc(doc(db, 'orders', orderId), { status, location })
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Order status could not be updated.') }
  }

  const logout = () => { localStorage.removeItem('apna_cart_api_token'); localStorage.removeItem('apna_cart_api_user'); setUser(null); setOrders([]); setNotice('Logged out.') }

  return <div style={{ minHeight: '100vh', background: '#faf8f4', color: '#222', fontFamily: 'system-ui, sans-serif' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #eee', padding: '14px 4%', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong style={{ fontSize: 25, marginRight: 8 }}>🛍️ Apna Cart</strong>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ flex: 1, minWidth: 180, padding: 12, border: '1px solid #ddd', borderRadius: 12 }} />
      <button onClick={() => setDrawer('orders')} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>Orders ({orders.length})</button>
      <button onClick={() => user ? logout() : setLoginOpen(true)} style={{ padding: '10px 14px', borderRadius: 10, border: 0, background: '#222', color: '#fff' }}>{user ? 'Logout' : 'Login'}</button>
      <button onClick={() => setDrawer('cart')} style={{ padding: '10px 14px', borderRadius: 10, border: 0, background: '#f1c84b' }}>Bag ({count})</button>
    </header>
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 4%' }}>
      <section style={{ padding: '28px 0' }}><p style={{ letterSpacing: 2, fontSize: 12 }}>APNA CART MARKETPLACE</p><h1 style={{ fontSize: 'clamp(34px, 7vw, 68px)', margin: '8px 0' }}>Har zaroorat, <em>ek hi cart mein.</em></h1><p style={{ color: '#666', maxWidth: 620 }}>Fashion, home, beauty, electronics aur grocery — simple shopping, secure checkout aur order tracking.</p></section>
      <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 18 }}>{categories.map(c => <button key={c} onClick={() => setCategory(c)} style={{ whiteSpace: 'nowrap', padding: '10px 15px', borderRadius: 20, border: '1px solid #ddd', background: category === c ? '#222' : '#fff', color: category === c ? '#fff' : '#222' }}>{c}</button>)}</nav>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 18 }}>{visibleProducts.map(product => <article key={product.id} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #eee' }}><img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} /><div style={{ padding: 15 }}><small>{product.category}</small><h3 style={{ margin: '7px 0' }}>{product.name}</h3><div>★ {product.rating}</div><strong style={{ display: 'block', fontSize: 20, margin: '8px 0' }}>{money(product.price)}</strong><button onClick={() => addToCart(product.id)} style={{ width: '100%', padding: 11, borderRadius: 10, border: 0, background: '#222', color: '#fff' }}>Add to bag</button></div></article>)}</section>
    </main>

    {drawer && <div onClick={() => setDrawer(null)} style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,.35)' }}><aside onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto', width: 'min(430px,100%)', height: '100%', background: '#fff', padding: 22, overflowY: 'auto' }}><button onClick={() => setDrawer(null)} style={{ float: 'right', border: 0, background: 'none', fontSize: 26 }}>×</button><h2>{drawer === 'cart' ? 'Your bag' : 'Your orders'}</h2>{drawer === 'cart' ? <>{cartItems.length === 0 ? <p>Your bag is empty.</p> : cartItems.map(item => <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' }}><img src={item.product.image} alt="" width="70" height="70" style={{ objectFit: 'cover', borderRadius: 10 }} /><div style={{ flex: 1 }}><strong>{item.product.name}</strong><p>{money(item.product.price)} × {item.quantity}</p><button onClick={() => changeQty(item.product.id, -1)}>−</button><span style={{ padding: 10 }}>{item.quantity}</span><button onClick={() => changeQty(item.product.id, 1)}>+</button></div></div>)}<h3>Total: {money(total)}</h3>{cartItems.length > 0 && <button onClick={() => setCheckout(true)} style={{ width: '100%', padding: 13, borderRadius: 10, border: 0, background: '#222', color: '#fff' }}>Checkout</button>}{checkout && <form onSubmit={placeOrder} style={{ marginTop: 18, display: 'grid', gap: 10 }}><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" /><textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Complete delivery address" rows={4} /><select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}>{['UPI','Card','Net banking','Wallet','Cash on Delivery'].map(x => <option key={x}>{x}</option>)}</select><button type="submit" style={{ padding: 13, borderRadius: 10, border: 0, background: '#f1c84b' }}>Place order</button></form>}</> : orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => <article key={order.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}><strong>Order #{order.id}</strong><p>{order.items.map(x => `${x.name} × ${x.quantity}`).join(', ')}</p><p><b>{money(order.total)}</b> · {order.status}</p><small>{order.location}</small>{order.status === 'Processing' && token() && <button onClick={() => updateStatus(order.id, 'Accepted', 'Order accepted')} style={{ display: 'block', marginTop: 8 }}>Accept order</button>}{order.status === 'Accepted' && token() && <button onClick={() => updateStatus(order.id, 'Shipped', 'Nallasopara sorting center')} style={{ display: 'block', marginTop: 8 }}>Mark shipped</button>}</article>)}</aside></div>}

    {loginOpen && <div onClick={() => setLoginOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 20 }}><section onClick={e => e.stopPropagation()} style={{ width: 'min(420px,100%)', background: '#fff', borderRadius: 20, padding: 25 }}><button onClick={() => setLoginOpen(false)} style={{ float: 'right', border: 0, background: 'none', fontSize: 25 }}>×</button><h2>{loginStep === 'contact' ? 'Login to Apna Cart' : 'Enter OTP'}</h2><div id="fixed-recaptcha" />{loginStep === 'contact' ? <form onSubmit={requestOtp} style={{ display: 'grid', gap: 10 }}><input required value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="Your name" /><input required value={loginContact} onChange={e => setLoginContact(e.target.value)} placeholder="Phone number (+91...)" /><button type="submit" style={{ padding: 12, border: 0, borderRadius: 10, background: '#222', color: '#fff' }}>Send OTP</button></form> : <form onSubmit={verifyOtp} style={{ display: 'grid', gap: 10 }}><p>OTP sent to {loginContact}</p><input required inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="6 digit OTP" /><button type="submit" style={{ padding: 12, border: 0, borderRadius: 10, background: '#222', color: '#fff' }}>Verify & login</button></form>}<p style={{ color: '#666' }}>{notice}</p></section></div>}
    {notice && <button onClick={() => setNotice('')} style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '12px 18px', borderRadius: 12, border: 0, background: '#222', color: '#fff' }}>{notice} ×</button>}
  </div>
}

export default AppFixed
