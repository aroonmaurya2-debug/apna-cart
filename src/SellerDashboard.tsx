import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const categories = ['8PM Offer','Saree','Western Wear','Jewellery','Men','Kitchen','Kurtis & Dresses','Kids','Home','Beauty','Footwear','All Categories']
type Tab = 'overview' | 'products' | 'orders' | 'earnings' | 'profile'
type Product = { id: string | number; name: string; category: string; gender?: string; price: number; oldPrice?: number; image: string; stock?: number }
type Order = { id: string | number; customerName?: string; total?: number; status?: string; items?: Array<{ name?: string; quantity?: number }> }

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-session')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function SellerDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
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

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const body = { ...form, price:Number(form.price), oldPrice:Number(form.oldPrice || form.price), stock:Number(form.stock), sizes:form.sizes.split(',').map(x=>x.trim()).filter(Boolean), colors:form.colors.split(',').map(x=>x.trim()).filter(Boolean) }
      const r = await fetch(`${API_BASE}/sellers/products`, { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body:JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Product add nahi hua')
      setMessage('✅ Product successfully add ho gaya')
      setForm({ name:'', category:'Saree', gender:'Women', price:'', oldPrice:'', stock:'1', image:'', sizes:'', colors:'', description:'' })
      await loadProducts()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Product add nahi hua'}`) }
    finally { setLoading(false) }
  }
  const deleteProduct = async (id: string | number) => {
    if (!window.confirm('Product delete karein?')) return
    try {
      const r = await fetch(`${API_BASE}/products/${id}`, { method:'DELETE', headers:authHeaders() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Delete failed')
      setMessage('✅ Product deleted'); await loadProducts()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Delete failed'}`) }
  }
  const updateOrder = async (id: string | number, status: string) => {
    try {
      const r = await fetch(`${API_BASE}/sellers/orders/${id}/status`, { method:'PATCH', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body:JSON.stringify({ status }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Status update failed')
      setMessage('✅ Order status updated'); await loadOrders()
    } catch (e) { setMessage(`❌ ${e instanceof Error ? e.message : 'Status update failed'}`) }
  }

  const revenue = orders.reduce((sum,o)=>sum+Number(o.total||0),0)
  const earnings = revenue * 0.9
  const nav: Array<[Tab,string]> = [['overview','Overview'],['products','Products'],['orders','Orders'],['earnings','Earnings'],['profile','Store Profile']]

  return <div style={{minHeight:'100vh',background:'#f4f7f5',color:'#173a2b',fontFamily:'system-ui,sans-serif'}}>
    <header style={{height:64,background:'#078a58',color:'#fff',display:'flex',alignItems:'center',padding:'0 18px',gap:14}}>
      <b style={{fontSize:20}}>Apna Cart</b><span>| Supplier Hub</span><span style={{marginLeft:'auto',fontSize:13}}>Seller Panel</span>
    </header>
    <div style={{maxWidth:1250,margin:'0 auto',display:'flex',minHeight:'calc(100vh - 64px)'}}>
      <aside style={{width:220,background:'#fff',padding:14,borderRight:'1px solid #e1e9e4'}}>{nav.map(([id,label])=><button key={id} onClick={()=>setTab(id)} style={{width:'100%',textAlign:'left',border:0,borderRadius:9,padding:'12px',marginBottom:5,background:tab===id?'#e3f6ed':'transparent',color:tab===id?'#078a58':'#465a51',fontWeight:700}}>{label}</button>)}<button onClick={()=>window.location.href='/'} style={{width:'100%',textAlign:'left',border:0,background:'transparent',padding:12}}>← Back to Shopping</button></aside>
      <main style={{flex:1,padding:24}}>
        {message && <div style={{background:'#fff',padding:12,borderRadius:10,marginBottom:15,border:'1px solid #cde5d8'}}>{message}</div>}
        {tab==='overview' && <>
          <h1>Welcome to Supplier Hub 👋</h1><p>Manage products, orders and earnings from one place.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,margin:'20px 0'}}>{[['Sales',money(revenue)],['Orders',orders.length],['Products',products.length],['Earnings',money(earnings)]].map(([a,b])=><div key={a} style={{background:'#fff',padding:18,borderRadius:14,border:'1px solid #e1e9e4'}}><small>{a}</small><h2>{b}</h2></div>)}</div>
          <div style={{background:'#fff;padding:18,borderRadius:14}}><h3>Recent Orders</h3>{orders.length===0?<p>No orders yet.</p>:orders.slice(0,5).map(o=><div key={o.id} style={{padding:'10px 0',borderBottom:'1px solid #eee'}}><b>#{String(o.id).slice(-10)}</b> — {o.customerName||'Customer'} — {money(Number(o.total||0))} — {o.status||'Placed'}</div>)}</div>
        </>}
        {tab==='products' && <>
          <h1>Products</h1><p>Add and manage products listed on Apna Cart.</p>
          <form onSubmit={addProduct} style={{background:'#fff',padding:18,borderRadius:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <input required placeholder="Product name" value={form.name} onChange={e=>setField('name',e.target.value)} style={inputStyle}/>
            <select value={form.category} onChange={e=>setField('category',e.target.value)} style={inputStyle}>{categories.map(c=><option key={c}>{c}</option>)}</select>
            <select value={form.gender} onChange={e=>setField('gender',e.target.value)} style={inputStyle}><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select>
            <input required type="number" min="1" placeholder="Selling price ₹" value={form.price} onChange={e=>setField('price',e.target.value)} style={inputStyle}/>
            <input type="number" min="1" placeholder="MRP ₹" value={form.oldPrice} onChange={e=>setField('oldPrice',e.target.value)} style={inputStyle}/>
            <input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={e=>setField('stock',e.target.value)} style={inputStyle}/>
            <input required type="url" placeholder="Product image URL" value={form.image} onChange={e=>setField('image',e.target.value)} style={{...inputStyle,gridColumn:'1/-1'}}/>
            <input placeholder="Sizes: S,M,L,XL" value={form.sizes} onChange={e=>setField('sizes',e.target.value)} style={inputStyle}/><input placeholder="Colors: Red,Blue" value={form.colors} onChange={e=>setField('colors',e.target.value)} style={inputStyle}/>
            <textarea rows={4} placeholder="Description" value={form.description} onChange={e=>setField('description',e.target.value)} style={{...inputStyle,gridColumn:'1/-1'}}/>
            <button disabled={loading} style={{...buttonStyle,gridColumn:'1/-1'}}>{loading?'Adding...':'Add Product'}</button>
          </form>
          <h2>My Products ({products.length})</h2><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>{products.map(p=><div key={p.id} style={{background:'#fff',borderRadius:14,overflow:'hidden',border:'1px solid #e1e9e4'}}><img src={p.image} alt={p.name} style={{width:'100%',height:180,objectFit:'cover'}}/><div style={{padding:12}}><b>{p.name}</b><p>{money(Number(p.price))} • Stock: {Number(p.stock||0)}</p><small>{p.category} • {p.gender||'Unisex'}</small><button onClick={()=>deleteProduct(p.id)} style={{...buttonStyle,background:'#fff',color:'#c33',border:'1px solid #ddd',marginTop:10}}>Delete</button></div></div>)}</div>
        </>}
        {tab==='orders' && <><h1>Orders</h1>{orders.length===0?<div style={cardStyle}>No orders yet.</div>:orders.map(o=><div key={o.id} style={{...cardStyle,marginBottom:10}}><b>Order #{String(o.id).slice(-10)}</b><p>{o.customerName||'Customer'} • {money(Number(o.total||0))}</p><select value={o.status||'placed'} onChange={e=>updateOrder(o.id,e.target.value)} style={inputStyle}><option value="placed">Placed</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>)}</>}
        {tab==='earnings' && <><h1>Earnings</h1><div style={cardStyle}><small>Total sales</small><h2>{money(revenue)}</h2><small>Estimated seller earnings after 10% commission</small><h2>{money(earnings)}</h2></div></>}
        {tab==='profile' && <><h1>Store Profile</h1><div style={cardStyle}><h3>Apna Cart Supplier Hub</h3><p>Seller dashboard for products, orders and earnings.</p></div></>}
      </main>
    </div>
  </div>
}

const inputStyle: React.CSSProperties = { width:'100%',padding:'11px 12px',border:'1px solid #d5e0da',borderRadius:9,background:'#fff',fontSize:14 }
const buttonStyle: React.CSSProperties = { border:0,borderRadius:9,padding:'11px 15px',background:'#078a58',color:'#fff',fontWeight:800,cursor:'pointer' }
const cardStyle: React.CSSProperties = { background:'#fff',padding:18,borderRadius:14,border:'1px solid #e1e9e4' }
