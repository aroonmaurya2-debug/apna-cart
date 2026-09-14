import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const categories = ['8PM Offer','Saree','Western Wear','Jewellery','Men','Kitchen','Kurtis & Dresses','Kids','Home','Beauty','Footwear','All Categories']
type Tab = 'overview' | 'products' | 'orders' | 'earnings' | 'profile'
type Product = { id: string | number; name: string; category: string; gender?: string; price: number; oldPrice?: number; image: string; description?: string; stock?: number; status?: string }
type Order = { id: string | number; customerName?: string; customerContact?: string; total?: number; status?: string; items?: Array<{ name?: string; quantity?: number; price?: number }>; address?: string; city?: string; pincode?: string; createdAt?: string }

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const authHeaders = () => {
  const t = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-session') || ''
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export default function SellerDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', category:'Saree', gender:'Women', price:'', oldPrice:'', stock:'1', image:'', sizes:'', colors:'', description:'' })

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

  const change = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const body = { ...form, price:Number(form.price), oldPrice:Number(form.oldPrice || form.price), stock:Number(form.stock), sizes:form.sizes.split(',').map(x=>x.trim()).filter(Boolean), colors:form.colors.split(',').map(x=>x.trim()).filter(Boolean) }
      const r = await fetch(`${API_BASE}/sellers/products`, { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body:JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Product add nahi hua')
      setMessage('✅ Product successfully add ho gaya')
      setForm({ name:'', category:'Saree', gender:'Women', price:'', oldPrice:'', stock:'1', image:'', sizes:'', colors:'', description:'' })
      await loadProducts(); setTab('products')
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Product add nahi hua'}`) }
    finally { setLoading(false) }
  }
  const deleteProduct = async (id: string | number) => {
    if (!window.confirm('Product delete karein?')) return
    try {
      const r = await fetch(`${API_BASE}/products/${id}`, { method:'DELETE', headers:authHeaders() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Delete failed')
      setMessage('✅ Product deleted'); loadProducts()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Delete failed'}`) }
  }
  const updateOrder = async (id: string | number, status: string) => {
    try {
      const r = await fetch(`${API_BASE}/sellers/orders/${id}/status`, { method:'PATCH', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body:JSON.stringify({ status }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Status update failed')
      setMessage('✅ Order status updated'); loadOrders()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Status update failed'}`) }
  }

  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const commission = revenue * 0.10
  const pending = orders.filter(o => ['placed','pending'].includes(String(o.status || '').toLowerCase())).length
  const nav: Array<[Tab,string,string]> = [['overview','⌂','Overview'],['products','▣','Products'],['orders','▤','Orders'],['earnings','₹','Earnings'],['profile','♙','Store Profile']]

  return <div className="seller-app">
    <style>{`
      *{box-sizing:border-box}.seller-app{min-height:100vh;background:#f5f7f6;color:#18352a;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.seller-top{height:64px;background:#078a58;color:#fff;display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:50}.seller-brand{font-size:20px;font-weight:900}.seller-brand span{font-weight:500;opacity:.9}.seller-menu{display:none;border:0;background:transparent;color:#fff;font-size:25px}.seller-layout{max-width:1280px;margin:auto;display:grid;grid-template-columns:230px 1fr}.seller-side{background:#fff;border-right:1px solid #e2e9e5;min-height:calc(100vh - 64px);padding:16px 11px;position:sticky;top:64px}.seller-nav{display:flex;flex-direction:column;gap:5px}.seller-nav button{border:0;background:transparent;text-align:left;padding:12px 13px;border-radius:10px;color:#455a51;font-weight:650;font-size:15px}.seller-nav button.active{background:#e4f7ee;color:#078a58;font-weight:850}.seller-content{padding:24px;min-width:0}.seller-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:20px}.seller-head h1{margin:0;font-size:26px}.seller-head p{margin:5px 0 0;color:#718079;font-size:13px}.seller-btn{border:0;background:#078a58;color:#fff;border-radius:9px;padding:11px 15px;font-weight:800;cursor:pointer}.seller-btn.light{background:#e4f7ee;color:#078a58}.seller-message{background:#fff;border:1px solid #cce4d7;padding:11px 13px;border-radius:10px;margin-bottom:15px;font-size:13px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.card{background:#fff;border:1px solid #e3eae6;border-radius:14px;padding:17px;box-shadow:0 2px 8px #123b2b0a}.label{font-size:11px;color:#75827c;font-weight:700}.value{font-size:25px;font-weight:900;margin-top:7px}.note{font-size:11px;color:#078a58;margin-top:4px}.two-col{display:grid;grid-template-columns:1.4fr .8fr;gap:16px}.section-title{font-size:16px;font-weight:850;margin:0 0 12px}.rows{display:flex;flex-direction:column}.row{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #edf1ee}.row:last-child{border:0}.row small{display:block;color:#718079;margin-top:3px}.pill{font-size:11px;font-weight:800;background:#edf6f1;padding:5px 9px;border-radius:20px;white-space:nowrap}.empty{text-align:center;color:#75827c;padding:30px 10px}.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.product{background:#fff;border:1px solid #e3eae6;border-radius:14px;overflow:hidden}.product img{width:100%;height:175px;object-fit:cover;background:#eef2ef}.product-body{padding:12px}.product-body b{display:block;min-height:38px}.meta{font-size:12px;color:#718079;margin-top:4px}.actions{display:flex;gap:7px;margin-top:10px}.actions button{flex:1;border:1px solid #dbe4df;background:#fff;border-radius:8px;padding:8px;font-weight:700}.actions button:last-child{color:#c33}.form{display:grid;grid-template-columns:1fr 1fr;gap:11px}.form input,.form select,.form textarea{width:100%;padding:11px 12px;border:1px solid #d7e1dc;border-radius:9px;background:#fff;font:inherit}.form textarea,.form .wide,.form button{grid-column:1/-1}.order{background:#fff;border:1px solid #e3eae6;border-radius:14px;padding:15px;margin-bottom:11px}.order-head,.order-foot{display:flex;justify-content:space-between;align-items:center;gap:10px}.order-items{font-size:12px;color:#6f7c76;margin:9px 0}.order-foot{border-top:1px solid #edf1ee;padding-top:10px}.order select{padding:8px;border:1px solid #d7e1dc;border-radius:8px;background:#fff}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.info{padding:12px 0;border-bottom:1px solid #edf1ee}.info small{display:block;color:#7a8580;font-size:11px}.info b{font-size:14px}@media(max-width:850px){.seller-menu{display:block}.seller-layout{display:block}.seller-side{position:fixed;top:64px;left:-245px;width:230px;z-index:40;transition:left .2s;box-shadow:5px 0 20px #0002}.seller-side.open{left:0}.seller-content{padding:16px}.stats{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}.product-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.seller-brand{font-size:17px}.seller-top{padding:0 13px}.seller-head{align-items:flex-start}.seller-head h1{font-size:21px}.seller-head .seller-btn{padding:9px 10px;font-size:12px}.product-grid,.form,.profile-grid{grid-template-columns:1fr}.form textarea,.form .wide,.form button{grid-column:auto}.stats{gap:9px}.card{padding:13px}.value{font-size:20px}}
    `}</style>
    <header className="seller-top"><button className="seller-menu" onClick={()=>setMenuOpen(v=>!v)}>☰</button><div className="seller-brand">Apna Cart <span>| Supplier Hub</span></div><small style={{marginLeft:'auto'}}>Seller Panel</small></header>
    <div className="seller-layout">
      <aside className={`seller-side ${menuOpen?'open':''}`}><nav className="seller-nav">{nav.map(([id,icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setMenuOpen(false)}}>{icon}&nbsp;&nbsp;{label}</button>)}<button onClick={()=>window.location.href='/'}>← Back to Shopping</button></nav></aside>
      <main className="seller-content">
        {message && <div className="seller-message">{message}</div>}
        {tab==='overview' && <>
          <div className="seller-head"><div><h1>Welcome to Supplier Hub 👋</h1><p>Manage products, orders and earnings from one place.</p></div><button className="seller-btn" onClick={()=>setTab('products')}>＋ Add Product</button></div>
          <div className="stats"><div className="card"><div className="label">TOTAL SALES</div><div className="value">{money(revenue)}</div><div className="note">From orders</div></div><div className="card"><div className="label">ORDERS</div><div className="value">{orders.length}</div><div className="note">{pending} pending</div></div><div className="card"><div className="label">PRODUCTS</div><div className="value">{products.length}</div><div className="note">Listed products</div></div><div className="card"><div className="label">YOUR EARNINGS</div><div className="value">{money(revenue-commission)}</div><div className="note">After 10% commission</div></div></div>
          <div className="two-col"><section className="card"><h2 className="section-title">Recent Orders</h2>{orders.length ? <div className="rows">{orders.slice(0,5).map(o=><div className="row" key={o.id}><div><b>#{String(o.id).slice(-10)}</b><small>{o.customerName||'Customer'} • {money(Number(o.total||0))}</small></div><span className="pill">{o.status||'Placed'}</span></div>)}</div> : <div className="empty">No orders yet. New orders will appear here.</div>}</section><section className="card"><h2 className="section-title">Quick Actions</h2><div style={{display:'grid',gap:9}}><button className="seller-btn" onClick={()=>setTab('products')}>＋ Add New Product</button><button className="seller-btn light" onClick={()=>setTab('orders')}>▤ Manage Orders</button><button className="seller-btn light" onClick={()=>setTab('earnings')}>₹ View Earnings</button></div></section></div>
        </>}
        {tab==='products' && <><div className="seller-head"><div><h1>Products</h1><p>Add and manage products listed on Apna Cart.</p></div></div><section className="card"><h2 className="section-title">Add New Product</h2><form className="form" onSubmit={addProduct}><input required placeholder="Product name" value={form.name} onChange={e=>change('name',e.target.value)}/><select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={form.gender} onChange={e=>change('gender',e.target.value)}><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select><input required type="number" min="1" placeholder="Selling price ₹" value={form.price} onChange={e=>change('price',e.target.value)}/><input type="number" min="1" placeholder="MRP ₹" value={form.oldPrice} onChange={e=>change('oldPrice',e.target.value)}/><input required type="number" min="0" placeholder="Stock quantity" value={form.stock} onChange={e=>change('stock',e.target.value)}/><input required type="url" className="wide" placeholder="Product image URL" value={form.image} onChange={e=>change('image',e.target.value)}/><input placeholder="Sizes: S,M,L,XL" value={form.sizes} onChange={e=>change('sizes',e.target.value)}/><input placeholder="Colors: Red,Blue" value={form.colors} onChange={e=>change('colors',e.target.value)}/><textarea rows={4} className="wide" placeholder="Product description" value={form.description} onChange={e=>change('description',e.target.value)}/><button className="seller-btn wide" disabled={loading}>{loading?'Adding...':'Add Product'}</button></form></section><h2 style={{margin:'20px 0 12px'}}>My Products ({products.length})</h2><div className="product-grid">{products.map(p=><article className="product" key={p.id}><img src={p.image} alt={p.name}/><div className="product-body"><b>{p.name}</b><div className="meta">{money(Number(p.price))} • Stock: {Number(p.stock||0)}</div><div className="meta">{p.category} • {p.gender||'Unisex'}</div><div className="actions"><button onClick={()=>deleteProduct(p.id)}>Delete</button></div></div></article>)}</div></>}
        {tab==='orders' && <><div className="seller-head"><div><h1>Orders</h1><p>View customer orders and update delivery status.</p></div></div>{orders.length ? orders.map(o=><article className="order" key={o.id}><div className="order-head"><div><b>Order #{String(o.id).slice(-10)}</b><div className="meta">{o.customerName||'Customer'} • {o.customerContact||''}</div></div><b>{money(Number(o.total||0))}</b></div><div className="order-items">{(o.items||[]).map((it,i)=><span key={i}>{it.name||'Product'} × {it.quantity||1}{i<(o.items||[]).length-1?' • ':''}</span>)}</div><div className="order-foot"><span className="meta">{o.address||''} {o.city||''} {o.pincode||''}</span><select value={o.status||'placed'} onChange={e=>updateOrder(o.id,e.target.value)}><option value="placed">Placed</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div></article>) : <div className="card empty">No orders yet.</div>}</>}
        {tab==='earnings' && <><div className="seller-head"><div><h1>Earnings</h1><p>Seller sales and commission summary.</p></div></div><div className="stats"><div className="card"><div className="label">GROSS SALES</div><div className="value">{money(revenue)}</div></div><div className="card"><div className="label">COMMISSION (10%)</div><div className="value">{money(commission)}</div></div><div className="card"><div className="label">NET EARNINGS</div><div className="value">{money(revenue-commission)}</div></div><div className="card"><div className="label">TOTAL ORDERS</div><div className="value">{orders.length}</div></div></div><section className="card"><h2 className="section-title">How earnings work</h2><p style={{color:'#687770',lineHeight:1.6}}>Apna Cart currently shows a 10% marketplace commission in this seller dashboard. Final payout processing can be connected to your payment system later.</p></section></>}
        {tab==='profile' && <><div className="seller-head"><div><h1>Store Profile</h1><p>Seller account information.</p></div></div><section className="card profile-grid"><div className="info"><small>Store</small><b>Apna Cart Seller Store</b></div><div className="info"><small>Status</small><b>Active</b></div><div className="info"><small>Products</small><b>{products.length}</b></div><div className="info"><small>Orders</small><b>{orders.length}</b></div></section></>}
      </main>
    </div>
  </div>
}
