import { useMemo, useState } from 'react'

type Product = { id: number; name: string; category: string; price: number; oldPrice: number; image: string; rating: number; reviews: number; discount: string; sizes: string[]; colors: string[] }
type CartLine = { productId: number; quantity: number; size: string; color: string }

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'

const products: Product[] = [
  { id: 1, name: 'Printed Cotton Kurti Set', category: 'Fashion', price: 499, oldPrice: 999, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: 120, discount: '50% OFF', sizes: ['S','M','L','XL','XXL'], colors: ['Pink','Blue','Green'] },
  { id: 2, name: 'Running Shoes', category: 'Footwear', price: 1999, oldPrice: 3499, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', rating: 4.6, reviews: 85, discount: '43% OFF', sizes: ['6','7','8','9','10'], colors: ['Red','Black','White'] },
  { id: 3, name: 'Wireless Headphones', category: 'Electronics', price: 1299, oldPrice: 2499, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', rating: 4.4, reviews: 65, discount: '48% OFF', sizes: ['Standard'], colors: ['Black','White','Blue'] },
  { id: 4, name: "Men's Watch", category: 'Fashion', price: 799, oldPrice: 1999, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', rating: 4.3, reviews: 92, discount: '60% OFF', sizes: ['Standard'], colors: ['Black','Silver','Brown'] },
  { id: 5, name: 'Backpack', category: 'Fashion', price: 899, oldPrice: 1799, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', rating: 4.2, reviews: 45, discount: '50% OFF', sizes: ['Standard'], colors: ['Black','Blue','Grey'] },
  { id: 6, name: 'Smartphone', category: 'Electronics', price: 12999, oldPrice: 18999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', rating: 4.5, reviews: 110, discount: '32% OFF', sizes: ['128 GB','256 GB'], colors: ['Black','Blue'] },
  { id: 7, name: 'Home Decor Plant', category: 'Home', price: 399, oldPrice: 799, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85', rating: 4.1, reviews: 38, discount: '50% OFF', sizes: ['Small','Medium'], colors: ['Green'] },
  { id: 8, name: 'Lipstick', category: 'Beauty', price: 299, oldPrice: 599, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85', rating: 4.4, reviews: 72, discount: '50% OFF', sizes: ['3.5 g'], colors: ['Red','Pink','Nude'] },
]

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function ShopApp() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [category, query])
  const cartItems = cart.map(line => { const p = products.find(x => x.id === line.productId); return p ? { ...p, quantity: line.quantity, size: line.size, color: line.color } : null }).filter(Boolean) as Array<Product & { quantity: number; size: string; color: string }>
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  async function placeOrder() {
    const token = localStorage.getItem('apna-cart-token')
    if (!token) { setMessage('Pehle login karke order place karein.'); return }
    if (!cartItems.length) { setMessage('Cart empty hai.'); return }
    try {
      const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ items: cartItems, total, address: 'Customer address', phone: '', paymentMethod: 'Cash on Delivery' }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Order place nahi hua')
      setCart([])
      setMessage(`Order place ho gaya! Order ID: ${data.order?.id || 'received'}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Order place nahi hua') }
  }

  function openProduct(product: Product) { setSelected(product); setSize(product.sizes[0]); setColor(product.colors[0]); setMessage('') }
  function addToCart() {
    if (!selected || !size || !color) { setMessage('Size aur colour select karein.'); return }
    setCart(prev => {
      const existing = prev.find(item => item.productId === selected.id && item.size === size && item.color === color)
      if (existing) return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { productId: selected.id, quantity: 1, size, color }]
    })
    setSelected(null)
    setMessage('Product cart me add ho gaya.')
  }
  function changeQty(productId: number, itemSize: string, itemColor: string, delta: number) {
    setCart(prev => prev.map(item => item.productId === productId && item.size === itemSize && item.color === itemColor ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  }

  return <div style={{ minHeight: '100vh', background: '#f7f7f7', color: '#222', fontFamily: 'Arial,sans-serif' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #eee', padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
      <button onClick={() => setCategory('All')} style={{ border: 0, background: 'none', fontSize: 20, fontWeight: 800 }}>🛍️ Apna <span style={{ color: '#9b2cff' }}>Cart</span></button>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
      <span>🛒 {cartCount}</span>
    </header>
    <main style={{ maxWidth: 1100, margin: 'auto', padding: 16 }}>
      {message && <div style={{ background: '#eaf8ef', padding: 12, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>{['All','Fashion','Footwear','Electronics','Home','Beauty'].map(c => <button key={c} onClick={() => setCategory(c)} style={{ padding: '9px 15px', borderRadius: 20, border: '1px solid #ddd', background: category === c ? '#f2e7ff' : '#fff' }}>{c}</button>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>{filtered.map(p => <article key={p.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}><img src={p.image} alt={p.name} onClick={() => openProduct(p)} style={{ width: '100%', height: 220, objectFit: 'cover', cursor: 'pointer' }} /><div style={{ padding: 12 }}><b>{p.name}</b><div>⭐ {p.rating} ({p.reviews})</div><div style={{ marginTop: 6 }}><b>{money(p.price)}</b> <del>{money(p.oldPrice)}</del> <small>{p.discount}</small></div><button onClick={() => openProduct(p)} style={{ width: '100%', marginTop: 10, padding: 10, border: 0, borderRadius: 7, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>View Product</button></div></article>)}</div>
      <section style={{ marginTop: 24, background: '#fff', padding: 16, borderRadius: 10 }}><h2>🛒 Cart</h2>{cartItems.length === 0 ? <p>Cart empty hai.</p> : <>{cartItems.map(item => <div key={`${item.id}-${item.size}-${item.color}`} style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #eee' }}><img src={item.image} alt="" style={{ width: 70, height: 80, objectFit: 'cover' }} /><div style={{ flex: 1 }}><b>{item.name}</b><div>Size: {item.size} · Colour: {item.color}</div><div>{money(item.price)}</div><button onClick={() => changeQty(item.id, item.size, item.color, -1)}>-</button> <b>{item.quantity}</b> <button onClick={() => changeQty(item.id, item.size, item.color, 1)}>+</button></div></div>)}<h3>Total: {money(total)}</h3><button onClick={placeOrder} style={{ width: '100%', padding: 12, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>Place Order — COD</button></>}</section>
    </main>
    {selected && <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 30 }}><div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: 'min(560px,100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 12, padding: 16 }}><button onClick={() => setSelected(null)} style={{ float: 'right' }}>✕</button><img src={selected.image} alt={selected.name} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8 }} /><h2>{selected.name}</h2><h3>{money(selected.price)} <del>{money(selected.oldPrice)}</del></h3><p>⭐ {selected.rating} · {selected.reviews} reviews</p><b>Size</b><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>{selected.sizes.map(s => <button key={s} onClick={() => setSize(s)} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #bbb', background: size === s ? '#f2e7ff' : '#fff' }}>{s}</button>)}</div><b>Colour</b><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>{selected.colors.map(c => <button key={c} onClick={() => setColor(c)} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #bbb', background: color === c ? '#f2e7ff' : '#fff' }}>{c}</button>)}</div><button onClick={addToCart} style={{ width: '100%', padding: 13, border: 0, borderRadius: 8, background: '#9b2cff', color: '#fff', fontWeight: 700 }}>Add to Cart</button></div></div>}
  </div>
}
