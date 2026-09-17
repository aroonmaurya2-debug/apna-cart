import { useEffect, useState } from 'react'

type WishItem = { name: string; image: string; price: string }

const WISH_KEY = 'apna-cart-wishlist'
const ADDRESS_KEY = 'apna-cart-saved-address'

export default function CustomerFeatures() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'account' | 'wishlist' | 'address'>('account')
  const [wishlist, setWishlist] = useState<WishItem[]>(() => JSON.parse(localStorage.getItem(WISH_KEY) || '[]'))
  const [address, setAddress] = useState(() => localStorage.getItem(ADDRESS_KEY) || '')
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')

  const syncWishlist = () => setWishlist(JSON.parse(localStorage.getItem(WISH_KEY) || '[]'))

  useEffect(() => {
    const timer = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>('.product-card').forEach((card) => {
        if (card.querySelector('[data-apna-wish]')) return
        const img = card.querySelector<HTMLImageElement>('img')
        const title = card.querySelector('h3')?.textContent?.trim() || 'Product'
        const price = card.querySelector('b')?.textContent?.trim() || ''
        if (!img) return
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.apnaWish = '1'
        button.textContent = JSON.parse(localStorage.getItem(WISH_KEY) || '[]').some((x: WishItem) => x.name === title) ? '♥' : '♡'
        Object.assign(button.style, { position:'absolute', right:'10px', top:'10px', width:'38px', height:'38px', borderRadius:'50%', border:'1px solid #ddd', background:'#fff', fontSize:'22px', cursor:'pointer', zIndex:'5', boxShadow:'0 2px 8px rgba(0,0,0,.12)' })
        button.onclick = (event) => {
          event.stopPropagation()
          const current: WishItem[] = JSON.parse(localStorage.getItem(WISH_KEY) || '[]')
          const exists = current.some(x => x.name === title)
          const next = exists ? current.filter(x => x.name !== title) : [...current, { name:title, image:img.src, price }]
          localStorage.setItem(WISH_KEY, JSON.stringify(next))
          button.textContent = exists ? '♡' : '♥'
          setWishlist(next)
          setNotice(exists ? 'Wishlist se remove ho gaya' : 'Wishlist mein add ho gaya')
          window.setTimeout(() => setNotice(''), 1600)
        }
        const cardStyle = getComputedStyle(card).position
        if (cardStyle === 'static') card.style.position = 'relative'
        card.appendChild(button)
      })
    }, 500)
    return () => window.clearInterval(timer)
  }, [])

  const user = JSON.parse(localStorage.getItem('apna-cart-user') || 'null') as { name?: string; contact?: string } | null

  const saveAddress = () => {
    localStorage.setItem(ADDRESS_KEY, address.trim())
    setSaved(true)
    setNotice('Address save ho gaya')
    window.setTimeout(() => { setSaved(false); setNotice('') }, 1800)
  }

  return <>
    {notice && <div style={{ position:'fixed', right:18, bottom:82, zIndex:9999, background:'#176b3a', color:'#fff', padding:'11px 16px', borderRadius:12, boxShadow:'0 5px 20px rgba(0,0,0,.2)', fontWeight:700 }}>{notice}</div>}
    <button onClick={() => { setOpen(v => !v); syncWishlist() }} aria-label="My Account" style={{ position:'fixed', right:16, bottom:92, zIndex:9998, width:56, height:56, borderRadius:'50%', border:0, background:'#176b3a', color:'#fff', fontSize:24, boxShadow:'0 6px 20px rgba(0,0,0,.22)', cursor:'pointer' }}>👤</button>
    {open && <div style={{ position:'fixed', right:14, bottom:158, zIndex:9998, width:'min(360px, calc(100vw - 28px))', maxHeight:'70vh', overflow:'auto', background:'#fff', borderRadius:18, boxShadow:'0 12px 40px rgba(0,0,0,.25)', border:'1px solid #eee', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}><div><b style={{ fontSize:18 }}>My Account</b><div style={{ fontSize:12, color:'#666' }}>{user?.name || 'Guest'} {user?.contact ? `· ${user.contact}` : ''}</div></div><button onClick={()=>setOpen(false)} style={{ border:0, background:'transparent', fontSize:24, cursor:'pointer' }}>×</button></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
        {([['account','👤 Profile'],['wishlist','♥ Wishlist'],['address','📍 Address']] as const).map(([key,label])=><button key={key} onClick={()=>setTab(key)} style={{ padding:'9px 5px', borderRadius:10, border:'1px solid #ddd', background:tab===key?'#e9f7ef':'#fff', cursor:'pointer', fontWeight:700 }}>{label}</button>)}
      </div>
      {tab==='account' && <div><p style={{ margin:'8px 0' }}><b>Name:</b> {user?.name || 'Not logged in'}</p><p style={{ margin:'8px 0' }}><b>Mobile/Email:</b> {user?.contact || '—'}</p><p style={{ margin:'8px 0', color:'#555' }}>My Orders neeche navigation ke Orders button se open karein.</p><button onClick={()=>{setTab('wishlist');syncWishlist()}} style={{ width:'100%', padding:11, border:0, borderRadius:10, background:'#176b3a', color:'#fff', fontWeight:700 }}>View Wishlist ({wishlist.length})</button></div>}
      {tab==='wishlist' && <div>{wishlist.length===0?<p>Wishlist abhi empty hai. Product par ♡ dabaiye.</p>:wishlist.map((item,i)=><div key={`${item.name}-${i}`} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 0', borderBottom:'1px solid #eee' }}><img src={item.image} alt="" style={{ width:54, height:64, objectFit:'cover', borderRadius:8 }}/><div style={{ flex:1 }}><b>{item.name}</b><div>{item.price}</div></div><button onClick={()=>{const next=wishlist.filter((_,j)=>j!==i);localStorage.setItem(WISH_KEY,JSON.stringify(next));setWishlist(next)}} style={{ border:0, background:'transparent', color:'#c33', cursor:'pointer' }}>Remove</button></div>)}</div>}
      {tab==='address' && <div><label style={{ display:'block', fontWeight:700, marginBottom:7 }}>Saved Delivery Address</label><textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="House no., area, city, PIN" rows={4} style={{ width:'100%', boxSizing:'border-box', padding:10, border:'1px solid #ccc', borderRadius:10, resize:'vertical' }}/><button onClick={saveAddress} style={{ marginTop:9, width:'100%', padding:11, border:0, borderRadius:10, background:'#176b3a', color:'#fff', fontWeight:700 }}>{saved?'Saved ✓':'Save Address'}</button></div>}
    </div>}
  </>
}
