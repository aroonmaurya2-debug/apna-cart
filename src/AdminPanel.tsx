import { useEffect, useMemo, useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import './admin-panel.css'

type Product = { id: number | string; name?: string; price?: number; oldPrice?: number; category?: string; stock?: number }
type Order = { id?: string | number; total?: number; status?: string; contact?: string; phone?: string }

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'

export default function AdminPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(Boolean(auth.currentUser))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/orders`),
      ])
      const productsData = await productsRes.json().catch(() => ({}))
      const ordersData = await ordersRes.json().catch(() => ({}))
      setProducts(Array.isArray(productsData?.products) ? productsData.products : [])
      setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : [])
    } catch {
      setError('Dashboard data load nahi ho pa raha. Backend check karein.')
    } finally { setRefreshing(false) }
  }

  useEffect(() => { if (loggedIn) loadData() }, [loggedIn])

  const revenue = useMemo(() => orders.reduce((sum, o) => sum + Number(o.total || 0), 0), [orders])
  const pending = useMemo(() => orders.filter(o => !['delivered', 'cancelled', 'completed'].includes(String(o.status || '').toLowerCase())).length, [orders])

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const allowed = String(import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
      if (allowed && credential.user.email?.toLowerCase() !== allowed) {
        await signOut(auth)
        throw new Error('This account is not an authorised Apna Cart owner account.')
      }
      setLoggedIn(true); setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed.')
    } finally { setLoading(false) }
  }

  const logout = async () => { await signOut(auth); setLoggedIn(false); setProducts([]); setOrders([]) }

  if (!loggedIn) return <main className="admin-shell admin-login-page"><section className="admin-login-card"><div className="admin-logo">🛍️</div><h1>Apna Cart Owner Panel</h1><p>Sirf authorised owner account se login karein.</p><form onSubmit={login}><label>Email<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Owner email" required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></label>{error && <div className="admin-error">{error}</div>}<button className="admin-primary" disabled={loading}>{loading ? 'Logging in…' : 'Owner Login'}</button></form><button className="admin-back" onClick={() => { window.location.href = '/' }}>← Back to Apna Cart</button></section></main>

  return <main className="admin-shell"><header className="admin-topbar"><div><div className="admin-kicker">APNA CART</div><h1>Owner / Admin Panel</h1></div><div className="admin-actions"><button onClick={loadData} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button><button onClick={logout}>Logout</button></div></header><div className="admin-layout"><aside className="admin-sidebar"><button className="active">📊 Dashboard</button><button onClick={() => alert('Step 2: Product Management next.')}>📦 Products</button><button onClick={() => alert('Step 3: Order Management next.')}>🧾 Orders</button><button onClick={() => alert('Seller Management next.')}>🏪 Sellers</button><button onClick={() => alert('Customers section next.')}>👥 Customers</button><button onClick={() => alert('Earnings & reports next.')}>💰 Earnings</button></aside><section className="admin-content"><div className="admin-cards"><article><span>Total Products</span><strong>{products.length}</strong></article><article><span>Total Orders</span><strong>{orders.length}</strong></article><article><span>Pending Orders</span><strong>{pending}</strong></article><article><span>Order Value</span><strong>₹{revenue.toLocaleString('en-IN')}</strong></article></div><div className="admin-grid"><section className="admin-panel-card"><h2>Recent Orders</h2>{orders.length === 0 ? <p className="muted">Abhi order data nahi mila.</p> : <div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Amount</th><th>Status</th></tr></thead><tbody>{orders.slice(0, 8).map((o, i) => <tr key={String(o.id ?? i)}><td>#{o.id ?? i + 1}</td><td>₹{Number(o.total || 0).toLocaleString('en-IN')}</td><td><span className="status">{o.status || 'pending'}</span></td></tr>)}</tbody></table></div>}</section><section className="admin-panel-card"><h2>Owner Controls</h2><div className="control-list"><div>🔐 <b>Protected login</b><small>Firebase owner authentication</small></div><div>📦 <b>Catalog overview</b><small>Live product count from backend</small></div><div>🧾 <b>Order overview</b><small>Live order count and value</small></div><div>🚀 <b>Next development</b><small>Product CRUD → Orders → Sellers → Earnings</small></div></div></section></div></section></div></main>
}
