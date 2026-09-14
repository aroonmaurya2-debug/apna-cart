import { useEffect, useState } from 'react'

type Tab = 'home' | 'orders' | 'returns' | 'inventory' | 'menu'
type Product = { id: string | number; name: string; category: string; gender?: string; price: number; image: string; stock?: number }
type Order = { id: string | number; customerName?: string; total?: number; status?: string }

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const categories = ['8PM Offer','Saree','Western Wear','Jewellery','Men','Kitchen','Kurtis & Dresses','Kids','Home','Beauty','Footwear','All Categories']
const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-session')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
const green = '#078a58'
const pale = '#eaf8f1'
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e4ebe7', borderRadius: 16, boxShadow: '0 2px 10px rgba(20,70,45,.05)' }
const input: React.CSSProperties = { width: '100%', padding: '12px', border: '1px solid #d6e1db', borderRadius: 10, background: '#fff', fontSize: 14, boxSizing: 'border-box' }

export default function SellerDashboard() {
  const [tab, setTab] = useState<Tab>('home')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Saree', gender: 'Women', price: '', oldPrice: '', stock: '1', image: '', sizes: '', colors: '', description: '' })

  const loadProducts = async () => {
    try {
      const r = await fetch(`${API_BASE}/sellers/products`, { headers: authHeaders() })
      const d = await r.json()
      if (r.ok) setProducts(d.products || [])
      else if (d.message) setMessage(`⚠️ ${d.message}`)
    } catch { setMessage('⚠️ Products load nahi ho paaye') }
  }
  const loadOrders = async () => {
    try {
      const r = await fetch(`${API_BASE}/sellers/orders`, { headers: authHeaders() })
      const d = await r.json()
      if (r.ok) setOrders(d.orders || [])
    } catch {}
  }
  useEffect(() => { loadProducts(); loadOrders() }, [])

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const body = { ...form, price: Number(form.price), oldPrice: Number(form.oldPrice || form.price), stock: Number(form.stock), sizes: form.sizes.split(',').map(x => x.trim()).filter(Boolean), colors: form.colors.split(',').map(x => x.trim()).filter(Boolean) }
      const r = await fetch(`${API_BASE}/sellers/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Product add nahi hua')
      setMessage('✅ Product successfully add ho gaya'); setShowForm(false)
      setForm({ name: '', category: 'Saree', gender: 'Women', price: '', oldPrice: '', stock: '1', image: '', sizes: '', colors: '', description: '' })
      await loadProducts()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Product add nahi hua'}`) }
    finally { setLoading(false) }
  }
  const deleteProduct = async (id: string | number) => {
    if (!window.confirm('Product delete karein?')) return
    try {
      const r = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: authHeaders() }); const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Delete failed')
      setMessage('✅ Product deleted'); await loadProducts()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Delete failed'}`) }
  }
  const updateOrder = async (id: string | number, status: string) => {
    try {
      const r = await fetch(`${API_BASE}/sellers/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ status }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Status update failed')
      setMessage('✅ Order status updated'); await loadOrders()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Status update failed'}`) }
  }

  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const pending = orders.filter(o => ['placed','pending','confirmed'].includes(String(o.status || '').toLowerCase())).length
  const returns = orders.filter(o => ['returned','return','refund','cancelled'].includes(String(o.status || '').toLowerCase())).length
  const lowStock = products.filter(p => Number(p.stock || 0) <= 5).length

  const go = (next: Tab) => { setTab(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const Header = () => <>
    <header style={{ background: green, color: '#fff', padding: '14px 18px 18px', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', color: green, display: 'grid', placeItems: 'center', fontSize: 25 }}>🛒</div>
        <div><div style={{ fontSize: 21, fontWeight: 900 }}>Apna Cart</div><div style={{ fontSize: 13, fontWeight: 700 }}>Seller Hub</div></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 24 }}><span>?</span><span>🔔</span></div>
      </div>
    </header>
  </>

  const Home = () => <>
    <div style={{ padding: '22px 18px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: 27, color: '#172c25' }}>Welcome back, Seller!</h1><p style={{ margin: '5px 0', color: '#738078' }}>Manage and grow your business</p></div>
        <button onClick={() => go('menu')} style={{ border: '1px solid #dbe7e1', background: pale, borderRadius: 24, padding: '9px 12px', fontWeight: 800, color: green }}>🏪 Seller ›</button>
      </div>
    </div>
    <div style={{ padding: '18px' }}>
      {message && <div style={{ ...card, padding: 13, marginBottom: 14, color: '#285443' }}>{message}</div>}
      <div style={{ ...card, padding: 15, background: '#eaf8f1', marginBottom: 18 }}><div style={{ fontWeight: 900, color: green }}>📣 Upcoming Policy Update</div><div style={{ marginTop: 5 }}>Next Day Dispatch is becoming the new platform standard for all orders.</div><button style={{ border: 0, background: 'transparent', padding: '10px 0 0', color: green, fontWeight: 900 }}>Know more →</button></div>

      <section style={{ ...card, padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 20 }}>Business Overview</h2><select style={{ ...input, width: 125, padding: 8 }}><option>Last 7 Days</option><option>Last 30 Days</option></select></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', marginTop: 14 }}>
          {[['📦', orders.length, 'Total Orders'],['₹', money(revenue), 'Total Sales'],['🚚', Math.max(0, orders.length - pending), 'Dispatched'],['↩️', returns, 'Returns']].map(([icon,val,label],i) => <div key={String(label)} style={{ padding: '5px 8px', borderRight: i < 3 ? '1px solid #e5ece8' : 0 }}><div style={{ fontSize: 20 }}>{icon}</div><b style={{ fontSize: 18, display: 'block', marginTop: 7 }}>{val}</b><small style={{ color: '#69766f' }}>{label}</small><div style={{ color: i === 3 ? '#d33' : green, fontWeight: 800, marginTop: 5, fontSize: 12 }}>{i === 3 ? '↓' : '↑'} {i === 3 ? '10%' : '12%'}</div></div>)}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}><h2 style={{ margin: 0 }}>Upcoming event</h2><button style={{ border: 0, background: 'transparent', color: green, fontWeight: 900 }}>View all ›</button></div>
      <section style={{ ...card, padding: 14, background: 'linear-gradient(120deg,#f0fff5,#fff3f7)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><b style={{ fontSize: 19 }}>🚀 AC Order Booster</b><span style={{ background: '#eee7ff', color: '#5335b8', borderRadius: 15, padding: '5px 9px', fontWeight: 800 }}>◷ 17 DAYS LEFT</span></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}><div style={{ ...card, padding: 12 }}><b style={{ color: green }}>🚀 Maintain upto 40% order growth after sale</b><div style={{ height: 105, display: 'flex', alignItems: 'end', justifyContent: 'space-around', borderBottom: '1px dashed #ccc', marginTop: 12 }}><div style={{ width: 52, height: 45, background: '#ef7800' }} /><div style={{ width: 52, height: 88, background: '#39a832' }} /></div><div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, marginTop: 5 }}><span>without Booster</span><span>with AC Booster</span></div></div><div style={{ ...card, padding: 12, background: '#f7fbf8' }}><div style={{ marginBottom: 12 }}>✅ Boost chances of order growth</div><div style={{ marginBottom: 12 }}>✅ Get more visibility on Apna Cart</div><div>✅ Drive repeat customers</div></div></div><button style={{ width: '100%', marginTop: 12, border: 0, borderRadius: 9, padding: 12, background: green, color: '#fff', fontWeight: 900, fontSize: 16 }}>Schedule Price Drop</button><small style={{ display: 'block', textAlign: 'center', marginTop: 7, color: '#7b837f' }}>*Based on internal projections. Actual figures may vary.</small></section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}><h2 style={{ margin: 0 }}>To do list</h2><button style={{ border: 0, background: 'transparent', color: green, fontWeight: 900 }}>View all ›</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{[['📦','Pending Orders',pending,'Ship within 24 hrs','orders'],['🧾','Download Labels',pending,'Print and pack','orders'],['↩️','Return Requests',returns,'Action needed','returns'],['💬','Buyer Messages',0,'No unread messages','menu']].map(([icon,title,num,sub,target]) => <button key={String(title)} onClick={() => go(target as Tab)} style={{ ...card, padding: 13, textAlign: 'left', background: '#fff' }}><div style={{ fontSize: 21 }}>{icon}</div><b style={{ display: 'block', marginTop: 6 }}>{title}</b><small style={{ color: '#707a75' }}>{String(num)} · {sub}</small></button>)}</div>

      <h2 style={{ margin: '22px 0 10px' }}>More tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>{[['🏷️','Manage Products','inventory'],['₹','Pricing','inventory'],['%','Offers & Campaigns','menu'],['📊','Business Insights','menu']].map(([icon,title,target]) => <button key={String(title)} onClick={() => go(target as Tab)} style={{ border: 0, background: 'transparent', padding: 5, color: '#263d33' }}><div style={{ width: 44, height: 44, margin: 'auto', borderRadius: 15, background: pale, color: green, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 900 }}>{icon}</div><small style={{ display: 'block', marginTop: 7, fontWeight: 700 }}>{title}</small></button>)}</div>
    </div>
  </>

  const Products = () => <div style={{ padding: 18 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h1>Inventory & Products</h1><button onClick={() => setShowForm(v => !v)} style={{ border: 0, background: green, color: '#fff', borderRadius: 9, padding: '10px 13px', fontWeight: 800 }}>+ Add</button></div>{showForm && <form onSubmit={addProduct} style={{ ...card, padding: 15, display: 'grid', gap: 10 }}><input required placeholder="Product name" value={form.name} onChange={e => setField('name', e.target.value)} style={input}/><select value={form.category} onChange={e => setField('category', e.target.value)} style={input}>{categories.map(c => <option key={c}>{c}</option>)}</select><select value={form.gender} onChange={e => setField('gender', e.target.value)} style={input}><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><input required type="number" min="1" placeholder="Selling price ₹" value={form.price} onChange={e => setField('price', e.target.value)} style={input}/><input type="number" min="1" placeholder="MRP ₹" value={form.oldPrice} onChange={e => setField('oldPrice', e.target.value)} style={input}/></div><input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => setField('stock', e.target.value)} style={input}/><input required type="url" placeholder="Product image URL" value={form.image} onChange={e => setField('image', e.target.value)} style={input}/><input placeholder="Sizes: S,M,L,XL" value={form.sizes} onChange={e => setField('sizes', e.target.value)} style={input}/><input placeholder="Colors: Red,Blue" value={form.colors} onChange={e => setField('colors', e.target.value)} style={input}/><textarea rows={3} placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} style={input}/><button disabled={loading} style={{ border: 0, borderRadius: 9, padding: 12, background: green, color: '#fff', fontWeight: 900 }}>{loading ? 'Adding...' : 'Add Product'}</button></form>}<div style={{ display: 'grid', gap: 10, marginTop: 15 }}>{products.length === 0 ? <div style={{ ...card, padding: 18 }}>No products yet.</div> : products.map(p => <div key={p.id} style={{ ...card, padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}><img src={p.image} alt={p.name} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }}/><div style={{ flex: 1 }}><b>{p.name}</b><div>{money(Number(p.price))} · Stock {Number(p.stock || 0)}</div><small>{p.category} · {p.gender || 'Unisex'}</small></div><button onClick={() => deleteProduct(p.id)} style={{ border: 0, background: '#fff0f0', color: '#c33', borderRadius: 8, padding: 8 }}>Delete</button></div>)}</div></div>

  const Orders = ({ onlyReturns = false }) => { const list = onlyReturns ? orders.filter(o => ['returned','return','refund','cancelled'].includes(String(o.status || '').toLowerCase())) : orders; return <div style={{ padding: 18 }}><h1>{onlyReturns ? 'Returns' : 'Orders'}</h1>{message && <div style={{ ...card, padding: 12, marginBottom: 12 }}>{message}</div>}{list.length === 0 ? <div style={{ ...card, padding: 18 }}>No {onlyReturns ? 'return requests' : 'orders'} yet.</div> : list.map(o => <div key={o.id} style={{ ...card, padding: 15, marginBottom: 10 }}><b>Order #{String(o.id).slice(-10)}</b><p style={{ margin: '8px 0' }}>{o.customerName || 'Customer'} · {money(Number(o.total || 0))}</p><select value={o.status || 'placed'} onChange={e => updateOrder(o.id, e.target.value)} style={input}><option value="placed">Placed</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="returned">Returned</option><option value="cancelled">Cancelled</option></select></div>)}</div> }

  const Menu = () => <div style={{ padding: 18 }}><h1>Seller Menu</h1><div style={{ display: 'grid', gap: 10 }}>{[['💰','Earnings',money(revenue * .9)],['📦','Total Products',String(products.length)],['📉','Low Stock',String(lowStock)],['🏪','Store Profile','Apna Cart Seller']].map(([i,t,v]) => <div key={String(t)} style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 24 }}>{i}</span><div><b>{t}</b><div style={{ color: '#69766f' }}>{v}</div></div></div>)}</div><button onClick={() => { window.location.href = '/' }} style={{ marginTop: 18, width: '100%', padding: 13, border: '1px solid #ddd', borderRadius: 10, background: '#fff', fontWeight: 800 }}>← Back to Shopping</button></div>

  return <div style={{ minHeight: '100vh', background: '#f7faf8', color: '#172c25', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 76 }}><Header/><main style={{ maxWidth: 720, margin: '0 auto' }}>{tab === 'home' && <Home/>}{tab === 'inventory' && <Products/>}{tab === 'orders' && <Orders/>}{tab === 'returns' && <Orders onlyReturns/>}{tab === 'menu' && <Menu/>}</main><nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: '#fff', borderTop: '1px solid #dfe8e3', boxShadow: '0 -4px 15px rgba(0,0,0,.07)' }}><div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', padding: '7px 5px 5px' }}>{([['home','🏠','Home'],['orders','📦','Orders'],['returns','↩️','Returns'],['inventory','📋','Inventory'],['menu','☰','Menu']] as Array<[Tab,string,string]>).map(([id,icon,label]) => <button key={id} onClick={() => go(id)} style={{ border: 0, background: 'transparent', color: tab === id ? green : '#707b76', fontWeight: tab === id ? 900 : 600, padding: '5px 2px' }}><div style={{ fontSize: 21 }}>{icon}</div><div style={{ fontSize: 12 }}>{label}</div>{tab === id && <div style={{ height: 3, background: green, borderRadius: 3, margin: '4px 12px 0' }}/>}</button>)}</div></nav></div>
}
