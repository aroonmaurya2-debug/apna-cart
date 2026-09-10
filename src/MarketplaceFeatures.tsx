import { useEffect, useMemo, useState } from 'react'
import './MarketplaceFeatures.css'

const API = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
type Product = { id: string; name: string; category: string; price: number; oldPrice: number; image: string; sizes?: string[]; colors?: string[]; description?: string; sellerName?: string }
type Section = 'shop' | 'seller' | 'wishlist' | 'help'
type SellerForm = { name: string; shopName: string; email: string; phone: string; pickupAddress: string; city: string; state: string; pincode: string; taxIdType: 'GSTIN' | 'UIN'; taxId: string; pan: string; bankAccountName: string; bankAccountNumber: string; ifsc: string }
const emptySeller: SellerForm = { name: '', shopName: '', email: '', phone: '', pickupAddress: '', city: '', state: '', pincode: '', taxIdType: 'GSTIN', taxId: '', pan: '', bankAccountName: '', bankAccountNumber: '', ifsc: '' }

export default function MarketplaceFeatures() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section>('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() => JSON.parse(localStorage.getItem('apna-cart-wishlist') || '[]'))
  const [saving, setSaving] = useState(false)
  const [sellerReady, setSellerReady] = useState(false)
  const [sellerStep, setSellerStep] = useState(1)
  const [sellerForm, setSellerForm] = useState<SellerForm>(emptySeller)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Fashion', price: '', oldPrice: '', image: '', sizes: '', colors: '', description: '' })
  const [selected, setSelected] = useState<Product | null>(null)
  const [buyForm, setBuyForm] = useState({ address: '', phone: '' })
  const [message, setMessage] = useState('')

  const token = () => localStorage.getItem('apna-cart-token')
  const api = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers); headers.set('content-type', 'application/json'); const t = token(); if (t) headers.set('authorization', `Bearer ${t}`)
    const response = await fetch(`${API}${path}`, { ...options, headers }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Request failed'); return data
  }

  useEffect(() => { if (open) void loadProducts() }, [open])
  useEffect(() => localStorage.setItem('apna-cart-wishlist', JSON.stringify(wishlist)), [wishlist])
  const wished = useMemo(() => products.filter(p => wishlist.includes(p.id)), [products, wishlist])

  async function loadProducts() { try { const data = await api('/products'); setProducts(data.products || []) } catch { setProducts([]) } }
  function toggleWishlist(id: string) { setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setMessage(wishlist.includes(id) ? 'Wishlist se hata diya.' : 'Wishlist me save ho gaya.') }
  const updateSeller = (key: keyof SellerForm, value: string) => setSellerForm(prev => ({ ...prev, [key]: value }))

  function validateSellerStep(step: number) {
    if (step === 1 && (!sellerForm.name.trim() || !sellerForm.shopName.trim() || !sellerForm.email.trim() || sellerForm.phone.replace(/\D/g, '').length !== 10)) return 'Name, shop name, email aur valid 10-digit mobile number bhariye.'
    if (step === 2 && (!sellerForm.pickupAddress.trim() || !sellerForm.city.trim() || !sellerForm.state.trim() || !/^\d{6}$/.test(sellerForm.pincode))) return 'Complete pickup address, city, state aur 6-digit pincode bhariye.'
    if (step === 3 && (!sellerForm.taxId.trim() || !sellerForm.pan.trim() || !sellerForm.bankAccountName.trim() || !sellerForm.bankAccountNumber.trim() || !sellerForm.ifsc.trim())) return 'KYC aur bank ki sabhi details mandatory hain.'
    return ''
  }
  function nextSellerStep() { const error = validateSellerStep(sellerStep); if (error) return setMessage(error); setMessage(''); setSellerStep(step => Math.min(3, step + 1)) }

  async function registerSeller() {
    const error = validateSellerStep(3); if (error) return setMessage(error)
    if (!token()) return setMessage('Pehle Apna Cart me login karein.')
    setSaving(true); setMessage('')
    try { await api('/sellers', { method: 'POST', body: JSON.stringify(sellerForm) }); setSellerReady(true); setMessage('Seller account submit ho gaya. KYC review ke baad products sell kar sakte hain.') } catch (e) { setMessage(e instanceof Error ? e.message : 'Seller registration failed.') } finally { setSaving(false) }
  }

  async function addProduct() {
    if (!newProduct.name.trim() || !newProduct.price) return setMessage('Product name aur price bhariye.')
    setSaving(true); setMessage('')
    try { const data = await api('/products', { method: 'POST', body: JSON.stringify({ ...newProduct, price: Number(newProduct.price), oldPrice: Number(newProduct.oldPrice || newProduct.price), sizes: newProduct.sizes.split(',').map(x => x.trim()).filter(Boolean), colors: newProduct.colors.split(',').map(x => x.trim()).filter(Boolean) }) }); setProducts(prev => [data.product, ...prev]); setNewProduct({ name: '', category: 'Fashion', price: '', oldPrice: '', image: '', sizes: '', colors: '', description: '' }); setMessage('Product marketplace par live ho gaya.') } catch (e) { setMessage(e instanceof Error ? e.message : 'Product add nahi hua.') } finally { setSaving(false) }
  }

  async function buyProduct() {
    if (!selected) return
    if (!token()) return setMessage('Order karne ke liye pehle login karein.')
    if (!buyForm.address.trim() || buyForm.phone.replace(/\D/g, '').length < 10) return setMessage('Valid address aur mobile number bhariye.')
    setSaving(true)
    try { await api('/orders', { method: 'POST', body: JSON.stringify({ items: [{ ...selected, quantity: 1 }], total: selected.price, address: buyForm.address.trim(), phone: buyForm.phone.trim(), email: '', paymentMethod: 'Cash on Delivery' }) }); setMessage('Order place ho gaya! My Orders me tracking dekhein.'); setSelected(null); setBuyForm({ address: '', phone: '' }) } catch (e) { setMessage(e instanceof Error ? e.message : 'Order place nahi hua.') } finally { setSaving(false) }
  }

  return <>
    <button className="marketplace-fab" onClick={() => setOpen(true)} aria-label="Marketplace">☰</button>
    {open && <div className="marketplace-overlay" onClick={() => setOpen(false)}><section className="marketplace-panel" onClick={e => e.stopPropagation()}>
      <div className="marketplace-panel-head"><h3>Apna Cart Marketplace</h3><button onClick={() => setOpen(false)}>✕</button></div>
      <div className="marketplace-tabs">{([['shop', 'Shop'], ['seller', 'Sell'], ['wishlist', `Wishlist (${wishlist.length})`], ['help', 'Help']] as const).map(([id, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>)}</div>
      {message && <div className="marketplace-message">{message}</div>}

      {section === 'shop' && <div className="marketplace-content"><h4>Seller Products</h4>{products.length === 0 ? <p>No seller products yet. Sell tab se pehla product add karein.</p> : <div className="marketplace-products">{products.map(p => <article className="marketplace-product" key={p.id}><img src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'} alt={p.name} /><button className="marketplace-heart" onClick={() => toggleWishlist(p.id)}>{wishlist.includes(p.id) ? '♥' : '♡'}</button><b>{p.name}</b><span>{p.sellerName || 'Apna Cart Seller'}</span><strong>₹{p.price.toLocaleString('en-IN')}</strong><small>{p.sizes?.length ? `Size: ${p.sizes.join(', ')}` : ''}{p.colors?.length ? ` • Colour: ${p.colors.join(', ')}` : ''}</small><button className="marketplace-primary" onClick={() => setSelected(p)}>Buy Now</button></article>)}</div>}</div>}

      {section === 'wishlist' && <div className="marketplace-content"><h4>❤️ My Wishlist</h4>{wished.length === 0 ? <p>Abhi wishlist empty hai. Shop me ♥ dabayein.</p> : <div className="marketplace-products">{wished.map(p => <article className="marketplace-product" key={p.id}><img src={p.image} alt={p.name} /><b>{p.name}</b><strong>₹{p.price.toLocaleString('en-IN')}</strong><button className="marketplace-primary" onClick={() => setSelected(p)}>Buy Now</button></article>)}</div>}</div>}

      {section === 'seller' && <div className="marketplace-content"><h4>🏪 Seller Center</h4>{!sellerReady ? <>
        <p className="seller-note">Seller account banane ke liye neeche ki <b>saari details mandatory</b> hain. Form 3 steps me hai.</p>
        <div className="seller-steps"><span className={sellerStep >= 1 ? 'active' : ''}>1 Account</span><span className={sellerStep >= 2 ? 'active' : ''}>2 Pickup</span><span className={sellerStep >= 3 ? 'active' : ''}>3 KYC & Bank</span></div>
        {sellerStep === 1 && <div className="seller-form"><input required value={sellerForm.name} onChange={e => updateSeller('name', e.target.value)} placeholder="Full name *" /><input required value={sellerForm.shopName} onChange={e => updateSeller('shopName', e.target.value)} placeholder="Shop / store name *" /><input required type="email" value={sellerForm.email} onChange={e => updateSeller('email', e.target.value)} placeholder="Business email *" /><input required inputMode="numeric" maxLength={10} value={sellerForm.phone} onChange={e => updateSeller('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile number *" /><button className="marketplace-primary" onClick={nextSellerStep}>Continue →</button></div>}
        {sellerStep === 2 && <div className="seller-form"><textarea required value={sellerForm.pickupAddress} onChange={e => updateSeller('pickupAddress', e.target.value)} placeholder="Pickup address / house, street, area *" rows={3} /><input required value={sellerForm.city} onChange={e => updateSeller('city', e.target.value)} placeholder="City *" /><input required value={sellerForm.state} onChange={e => updateSeller('state', e.target.value)} placeholder="State *" /><input required inputMode="numeric" maxLength={6} value={sellerForm.pincode} onChange={e => updateSeller('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Pincode *" /><div className="seller-actions"><button onClick={() => setSellerStep(1)}>← Back</button><button className="marketplace-primary" onClick={nextSellerStep}>Continue →</button></div></div>}
        {sellerStep === 3 && <div className="seller-form"><select value={sellerForm.taxIdType} onChange={e => updateSeller('taxIdType', e.target.value)}><option value="GSTIN">GSTIN</option><option value="UIN">UIN / Enrolment ID</option></select><input required value={sellerForm.taxId} onChange={e => updateSeller('taxId', e.target.value.toUpperCase())} placeholder={`${sellerForm.taxIdType} *`} /><input required value={sellerForm.pan} onChange={e => updateSeller('pan', e.target.value.toUpperCase())} placeholder="PAN *" maxLength={10} /><input required value={sellerForm.bankAccountName} onChange={e => updateSeller('bankAccountName', e.target.value)} placeholder="Bank account holder name *" /><input required inputMode="numeric" value={sellerForm.bankAccountNumber} onChange={e => updateSeller('bankAccountNumber', e.target.value.replace(/\D/g, ''))} placeholder="Bank account number *" /><input required value={sellerForm.ifsc} onChange={e => updateSeller('ifsc', e.target.value.toUpperCase())} placeholder="IFSC code *" maxLength={11} /><div className="seller-actions"><button onClick={() => setSellerStep(2)}>← Back</button><button className="marketplace-primary" disabled={saving} onClick={registerSeller}>{saving ? 'Submitting...' : 'Create Seller Account'}</button></div></div>}
      </> : <><div className="seller-success"><b>✓ Seller application submitted</b><p>KYC status: Pending Review. Ab aap product details add kar sakte hain.</p></div><div className="seller-form"><input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name" /><select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}><option>Fashion</option><option>Electronics</option><option>Footwear</option><option>Home</option><option>Beauty</option><option>Other</option></select><input inputMode="numeric" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Selling price" /><input inputMode="numeric" value={newProduct.oldPrice} onChange={e => setNewProduct({ ...newProduct, oldPrice: e.target.value })} placeholder="MRP / old price" /><input value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })} placeholder="Sizes: S, M, L, XL" /><input value={newProduct.colors} onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })} placeholder="Colours: Black, Blue" /><input value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="Product image URL" /><textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Product description" rows={3} /><button className="marketplace-primary" disabled={saving} onClick={addProduct}>{saving ? 'Publishing...' : 'Publish Product'}</button></div></>}</div>}

      {section === 'help' && <div className="marketplace-content"><h4>🛡️ Safe Shopping</h4><p>Product details, seller name aur price check karke order karein. Order place hone ke baad My Orders me status track karein.</p><p>Abhi working payment option <b>Cash on Delivery</b> hai. UPI/Card gateway baad me securely connect kiya ja sakta hai.</p></div>}

      {selected && <div className="marketplace-buy-overlay"><div className="marketplace-buy"><button className="marketplace-close" onClick={() => setSelected(null)}>✕</button><img src={selected.image} alt={selected.name} /><h4>{selected.name}</h4><strong>₹{selected.price.toLocaleString('en-IN')}</strong>{selected.description && <p>{selected.description}</p>}<input value={buyForm.address} onChange={e => setBuyForm({ ...buyForm, address: e.target.value })} placeholder="Delivery address" /><input value={buyForm.phone} onChange={e => setBuyForm({ ...buyForm, phone: e.target.value })} placeholder="Mobile number" /><button className="marketplace-primary" disabled={saving} onClick={buyProduct}>{saving ? 'Placing...' : 'Place COD Order'}</button></div></div>}
    </section></div>}
  </>
}
