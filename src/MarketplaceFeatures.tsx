import { useState } from 'react'

type Props = { onMessage?: (message: string) => void }

export default function MarketplaceFeatures({ onMessage }: Props) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<'help' | 'seller' | 'wishlist'>('help')
  const [sellerName, setSellerName] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const registerSeller = async () => {
    if (!sellerName.trim() || !sellerEmail.trim()) return onMessage?.('Seller name aur email bhariye.')
    setSaving(true)
    try {
      const token = localStorage.getItem('apna-cart-token')
      const sellerId = `seller-${Date.now()}`
      const response = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sellerId, name: sellerName.trim(), email: sellerEmail.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Seller registration failed')
      onMessage?.('Seller registration request save ho gayi.')
      setSellerName(''); setSellerEmail(''); setOpen(false)
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'Seller registration failed.')
    } finally { setSaving(false) }
  }

  return <>
    <button className="marketplace-fab" onClick={() => setOpen(true)} aria-label="Marketplace options">☰</button>
    {open && <div className="marketplace-overlay" onClick={() => setOpen(false)}>
      <section className="marketplace-panel" onClick={event => event.stopPropagation()}>
        <div className="marketplace-panel-head"><h3>Apna Cart Marketplace</h3><button onClick={() => setOpen(false)}>✕</button></div>
        <div className="marketplace-tabs">
          <button className={section === 'help' ? 'active' : ''} onClick={() => setSection('help')}>Help</button>
          <button className={section === 'seller' ? 'active' : ''} onClick={() => setSection('seller')}>Sell</button>
          <button className={section === 'wishlist' ? 'active' : ''} onClick={() => setSection('wishlist')}>Wishlist</button>
        </div>
        {section === 'help' && <div className="marketplace-content"><h4>Shopping safely</h4><p>Product details check karein, delivery address sahi bharein aur order status My Orders se track karein.</p><p>Payment gateway connect hone tak Cash on Delivery ko primary option rakha gaya hai.</p></div>}
        {section === 'wishlist' && <div className="marketplace-content"><h4>Wishlist</h4><p>Wishlist section ready hai. Product-level wishlist ko existing theme mein next catalog data integration ke saath connect kiya ja sakta hai.</p></div>}
        {section === 'seller' && <div className="marketplace-content"><h4>Seller registration</h4><p>Apne products bechne ke liye seller details submit karein.</p><input value={sellerName} onChange={event => setSellerName(event.target.value)} placeholder="Seller / shop name" /><input type="email" value={sellerEmail} onChange={event => setSellerEmail(event.target.value)} placeholder="Seller email" /><button className="marketplace-primary" disabled={saving} onClick={registerSeller}>{saving ? 'Saving...' : 'Register as Seller'}</button></div>}
      </section>
    </div>}
  </>
}
