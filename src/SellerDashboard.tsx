import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const categories = ['8PM Offer','Saree','Western Wear','Jewellery','Men','Kitchen','Kurtis & Dresses','Kids','Home','Beauty','Footwear','All Categories']

type SellerProduct = { id: string|number; name: string; category: string; gender: string; price: number; oldPrice: number; image: string; description: string; stock: number; discount?: string }

export default function SellerDashboard() {
  const [form,setForm] = useState({name:'',category:'Saree',gender:'Women',price:'',oldPrice:'',stock:'1',image:'',description:'',sizes:'',colors:''})
  const [items,setItems] = useState<SellerProduct[]>([])
  const [message,setMessage] = useState('')
  const [loading,setLoading] = useState(false)

  const load = async () => { try { const r=await fetch(`${API_BASE}/sellers/products`); const d=await r.json(); if(r.ok) setItems(d.products||[]) } catch {} }
  useEffect(()=>{ load() },[])
  const change=(key:string,value:string)=>setForm(f=>({...f,[key]:value}))
  const add = async (e:React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const r=await fetch(`${API_BASE}/sellers/products`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,price:Number(form.price),oldPrice:Number(form.oldPrice||form.price),stock:Number(form.stock),sizes:form.sizes.split(',').map(x=>x.trim()).filter(Boolean),colors:form.colors.split(',').map(x=>x.trim()).filter(Boolean)})})
      const d=await r.json(); if(!r.ok) throw new Error(d.message||'Product add nahi hua')
      setMessage('✅ Product successfully add ho gaya'); setForm({name:'',category:'Saree',gender:'Women',price:'',oldPrice:'',stock:'1',image:'',description:'',sizes:'',colors:''}); load()
    } catch(e) { setMessage(`❌ ${e instanceof Error?e.message:'Product add nahi hua'}`) } finally { setLoading(false) }
  }
  const remove = async (id:string|number) => { if(!confirm('Product delete karein?')) return; try { const r=await fetch(`${API_BASE}/products/${id}`,{method:'DELETE'}); if(r.ok) load(); else {const d=await r.json(); setMessage(`❌ ${d.message||'Delete failed'}`)} } catch { setMessage('❌ Delete failed') } }
  return <main style={{minHeight:'100vh',background:'#f5fff7',fontFamily:'system-ui',padding:'20px 14px'}}>
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <header style={{background:'#0b8f45',color:'#fff',padding:18,borderRadius:16,marginBottom:16}}><h1 style={{margin:0,fontSize:24}}>Apna Cart Seller Dashboard</h1><p style={{margin:'6px 0 0'}}>Add Product • Manage Products</p></header>
      <section style={{background:'#fff',padding:18,borderRadius:16,boxShadow:'0 2px 12px #00000012'}}>
        <h2 style={{marginTop:0}}>➕ Add New Product</h2>
        <form onSubmit={add} style={{display:'grid',gap:10}}>
          <input required placeholder="Product name" value={form.name} onChange={e=>change('name',e.target.value)} />
          <select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
          <select value={form.gender} onChange={e=>change('gender',e.target.value)}><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input required type="number" min="1" placeholder="Selling price ₹" value={form.price} onChange={e=>change('price',e.target.value)} /><input type="number" min="1" placeholder="MRP ₹" value={form.oldPrice} onChange={e=>change('oldPrice',e.target.value)} /></div>
          <input required type="number" min="0" step="1" placeholder="Stock quantity" value={form.stock} onChange={e=>change('stock',e.target.value)} />
          <input required type="url" placeholder="Product image URL" value={form.image} onChange={e=>change('image',e.target.value)} />
          <input placeholder="Sizes (comma separated): S,M,L,XL" value={form.sizes} onChange={e=>change('sizes',e.target.value)} />
          <input placeholder="Colors (comma separated): Red,Blue" value={form.colors} onChange={e=>change('colors',e.target.value)} />
          <textarea rows={4} placeholder="Product description" value={form.description} onChange={e=>change('description',e.target.value)} />
          <button disabled={loading} style={{background:'#0b8f45',color:'#fff',border:0,padding:13,borderRadius:10,fontWeight:700}}>{loading?'Adding...':'Add Product'}</button>
        </form>
        {message && <p style={{marginBottom:0,fontWeight:600}}>{message}</p>}
      </section>
      <section style={{marginTop:16}}><h2>My Products ({items.length})</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{items.map(p=><article key={p.id} style={{background:'#fff',borderRadius:14,padding:12,boxShadow:'0 2px 10px #00000010'}}><img src={p.image} alt={p.name} style={{width:'100%',height:190,objectFit:'cover',borderRadius:10}} /><b>{p.name}</b><div>₹{Number(p.price).toLocaleString('en-IN')} • Stock: {p.stock}</div><small>{p.category} • {p.gender}</small><button onClick={()=>remove(p.id)} style={{marginTop:8,width:'100%',padding:9,borderRadius:8,border:'1px solid #ddd',background:'#fff'}}>Delete</button></article>)}</div></section>
    </div>
  </main>
}
