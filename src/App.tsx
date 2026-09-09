import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RecaptchaVerifier, onAuthStateChanged, signInWithPhoneNumber, signOut, type ConfirmationResult, type User } from 'firebase/auth'
import { addDoc, collection, doc, getDocs, query as firestoreQuery, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { auth, authPersistence, db, firebaseConfigured, requireFirebase } from './firebase'
import './App.css'

type Product = { id: number; name: string; category: string; price: number; color: string; colors: string[]; sizes: string[]; image: string; images: string[]; description: string; rating: number; reviewCount: number; badge?: string }
type CartLine = { productId: number; quantity: number }
type OrderItem = Product & { status: string; location: string; phone: string; email?: string; quantity: number; orderId?: string }

type SortOption = 'featured' | 'low' | 'high'
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
type UserProfile = { name: string; contact: string }
type PaymentMethod = 'UPI' | 'Card' | 'Net banking' | 'Wallet' | 'Cash on Delivery'
type AppNotification = { id: number; title: string; message: string; time: string; read: boolean }
type FirebaseProfile = { uid: string; name: string; phoneNumber: string; email: string; address: string }
type FirestoreOrder = { id: string; userId: string; customer: { name: string; phone: string; email: string }; items: Array<Product & { quantity: number }>; total: number; paymentMethod: PaymentMethod; address: string; status: string; location: string }

const categories = ['All products', 'Fashion', 'Home', 'Beauty', 'Electronics', 'Grocery']
const productImage = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`
const products: Product[] = [
  { id: 1, name: 'Printed cotton kurti set', category: 'Fashion', price: 499, color: 'Pink floral', colors: ['Pink floral', 'Blue floral'], sizes: ['S', 'M', 'L', 'XL'], image: productImage('photo-1594633312681-425c7b97ccd1'), images: [productImage('photo-1594633312681-425c7b97ccd1'), productImage('photo-1583391733956-6c78276477e4'), productImage('photo-1551488831-00ddcb6c6bd3')], description: 'Soft everyday cotton set with an easy fit and bright floral print.', rating: 4.5, reviewCount: 1842, badge: 'Bestseller' },
  { id: 2, name: 'Oversized everyday tee', category: 'Fashion', price: 299, color: 'Butter yellow', colors: ['Butter yellow', 'Mint green', 'White'], sizes: ['S', 'M', 'L', 'XL'], image: productImage('photo-1521572163474-6864f9cf17ab'), images: [productImage('photo-1521572163474-6864f9cf17ab'), productImage('photo-1503342217505-b0a15ec3261c'), productImage('photo-1562157873-818bc0726f68')], description: 'A relaxed cotton tee made for daily comfort and easy layering.', rating: 4.3, reviewCount: 928, badge: 'Popular' },
  { id: 3, name: 'Canvas sling bag', category: 'Fashion', price: 349, color: 'Olive', colors: ['Olive', 'Black'], sizes: ['Regular'], image: productImage('photo-1553062407-98eeb64c6a62'), images: [productImage('photo-1553062407-98eeb64c6a62'), productImage('photo-1584917865442-de89df76afd3')], description: 'Compact canvas sling with roomy pockets for everyday essentials.', rating: 4.6, reviewCount: 711, badge: 'Deal' },
  { id: 4, name: 'Minimal ceramic planter', category: 'Home', price: 279, color: 'Terracotta', colors: ['Terracotta', 'Ivory'], sizes: ['Small', 'Medium'], image: productImage('photo-1485955900006-10f4d324d411'), images: [productImage('photo-1485955900006-10f4d324d411'), productImage('photo-1494438639946-1ebd1d20bf85')], description: 'Hand-finished planter to bring a warm, green touch to your space.', rating: 4.7, reviewCount: 1250 },
  { id: 5, name: 'Linen cushion cover pair', category: 'Home', price: 399, color: 'Rust stripe', colors: ['Rust stripe', 'Sage stripe'], sizes: ['16 x 16'], image: productImage('photo-1584100936595-c0654b55a2e2'), images: [productImage('photo-1584100936595-c0654b55a2e2'), productImage('photo-1616486338812-3dadae4b4ace')], description: 'Textured linen-look covers that refresh your sofa in minutes.', rating: 4.4, reviewCount: 604, badge: 'New' },
  { id: 6, name: 'Everyday skincare trio', category: 'Beauty', price: 599, color: 'Citrus care', colors: ['Citrus care', 'Rose care'], sizes: ['Set of 3'], image: productImage('photo-1556228578-8c89e6adf883'), images: [productImage('photo-1556228578-8c89e6adf883'), productImage('photo-1571781926291-c477ebfd024b')], description: 'A simple three-step routine for fresh, hydrated-looking skin.', rating: 4.6, reviewCount: 2130, badge: 'Top rated' },
  { id: 7, name: 'Matte lip colour set', category: 'Beauty', price: 249, color: 'Berry mix', colors: ['Berry mix', 'Nude mix'], sizes: ['Set of 3'], image: productImage('photo-1586495777744-4413f21062fa'), images: [productImage('photo-1586495777744-4413f21062fa'), productImage('photo-1522335789203-aabd1fc54bc9')], description: 'Three comfortable shades with a smooth matte finish.', rating: 4.2, reviewCount: 482 },
  { id: 8, name: 'Wireless earbuds case', category: 'Electronics', price: 799, color: 'Sky blue', colors: ['Sky blue', 'Black'], sizes: ['One size'], image: productImage('photo-1606220945770-b5b6c2c55bf1'), images: [productImage('photo-1606220945770-b5b6c2c55bf1'), productImage('photo-1590658268037-6bf12165a8df')], description: 'Pocket-friendly wireless audio with a charging case and clear sound.', rating: 4.1, reviewCount: 389, badge: 'Limited deal' },
  { id: 9, name: 'USB desk lamp', category: 'Electronics', price: 449, color: 'Warm white', colors: ['Warm white', 'Cool white'], sizes: ['One size'], image: productImage('photo-1507473885765-e6ed057f782c'), images: [productImage('photo-1507473885765-e6ed057f782c'), productImage('photo-1534281309534-3b5c3d6a7bde')], description: 'Adjustable USB lamp for focused work, reading and late-night study.', rating: 4.5, reviewCount: 836 },
  { id: 10, name: 'Bamboo storage basket', category: 'Home', price: 529, color: 'Natural', colors: ['Natural', 'Honey'], sizes: ['Medium'], image: productImage('photo-1595428774223-ef52624120d2'), images: [productImage('photo-1595428774223-ef52624120d2'), productImage('photo-1618220179428-22790b461013')], description: 'A versatile basket for toys, laundry, blankets and daily clutter.', rating: 4.8, reviewCount: 543, badge: 'Customer favourite' },
  { id: 11, name: 'Healthy snack box', category: 'Grocery', price: 349, color: 'Roasted mix', colors: ['Roasted mix', 'Classic mix'], sizes: ['500 g'], image: productImage('photo-1599599810694-57a7d4c1f53a'), images: [productImage('photo-1599599810694-57a7d4c1f53a'), productImage('photo-1600185365483-26d7a4cc7519')], description: 'A crunchy assortment for desk drawers, tiffins and family snacking.', rating: 4.4, reviewCount: 275 },
  { id: 12, name: 'Cotton kitchen towels', category: 'Grocery', price: 229, color: 'Checkered set', colors: ['Checkered set', 'Solid set'], sizes: ['Set of 4'], image: productImage('photo-1583845112203-454c9d8b2c5f'), images: [productImage('photo-1583845112203-454c9d8b2c5f'), productImage('photo-1584346133934-a3afd2a33c4c')], description: 'Absorbent cotton towels for a cleaner, brighter kitchen routine.', rating: 4.3, reviewCount: 391 }
]
const categoryTiles = [
  { name: 'Fashion', icon: '👗', color: '#f8c9bd', category: 'Fashion' },
  { name: 'Home', icon: '🏠', color: '#f5df9e', category: 'Home' },
  { name: 'Beauty', icon: '💄', color: '#ead0e1', category: 'Beauty' },
  { name: 'Electronics', icon: '📱', color: '#c7d8ed', category: 'Electronics' },
  { name: 'Grocery', icon: '🛒', color: '#c9dfc2', category: 'Grocery' },
  { name: 'All products', icon: '🛍️', color: '#f0d3a9', category: 'All products' },
]
const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
const trackingSteps = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const trackingIndex = (status: string) => status === 'Processing' ? 0 : status === 'Accepted' ? 2 : status === 'Shipped' ? 3 : 4
const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : '/.netlify/functions/api'
const getApiToken = () => localStorage.getItem('apna_cart_api_token') || ''
const getSavedApiUser = (): UserProfile | null => {
  try { return JSON.parse(localStorage.getItem('apna_cart_api_user') || 'null') as UserProfile | null } catch { return null }
}

function DeliveryTimeline({ order }: { order: OrderItem }) {
  const currentStep = trackingIndex(order.status)
  return <div className="delivery-timeline"><div className="delivery-summary"><div><strong>Arriving soon</strong><span>Expected delivery in 3-5 days</span></div><b>{order.location}</b></div><div className="timeline-steps">{trackingSteps.map((step, index) => <div className={index <= currentStep ? 'timeline-step complete' : 'timeline-step'} key={step}><span>{index <= currentStep ? '✓' : index + 1}</span><small>{step}</small></div>)}</div><p className="tracking-id">Tracking ID: APC{String(order.id).padStart(5, '0')} · Live updates available</p></div>
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All products')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [cart, setCart] = useState<CartLine[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [smsNotice, setSmsNotice] = useState('')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginStep, setLoginStep] = useState<'contact' | 'otp'>('contact')
  const [loginName, setLoginName] = useState('')
  const [loginContact, setLoginContact] = useState('')
  const [loginOtp, setLoginOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [authMode, setAuthMode] = useState<'backend' | 'firebase'>('backend')
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationText, setNotificationText] = useState('')
  const [notifications, setNotifications] = useState<AppNotification[]>([{ id: 1, title: 'Welcome to Apna Cart', message: 'Fresh deals and everyday value are waiting for you.', time: 'Now', read: false }])

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  useEffect(() => {
  const token = getApiToken()
  const savedUser = getSavedApiUser()
  if (!token || !savedUser) return
  setAuthMode('backend')
  setUser(savedUser)
  fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async (response) => { if (!response.ok) throw new Error('Backend session expired.'); return response.json() })
    .then((orders) => setOrderHistory(orders.flatMap((order: any) => order.items.map((item: Product & { quantity: number }) => ({ ...item, status: order.status, location: order.location, phone: order.customer?.phone || order.customer?.contact || '', email: order.customer?.email || '', orderId: String(order.id) })))))
    .catch(() => { localStorage.removeItem('apna_cart_api_token'); localStorage.removeItem('apna_cart_api_user'); setUser(null) })
}, [])

useEffect(() => {
  if (getApiToken()) return
  if (!auth || !db || !firebaseConfigured) return
    const firebaseDb = db
    let unsubscribe: (() => void) = () => undefined
    authPersistence.then(() => {
      if (!auth) return
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setFirebaseUser(currentUser)
        if (!currentUser) {
          setUser(null)
          setOrderHistory([])
          return
        }
        const profile = await getDocs(firestoreQuery(collection(firebaseDb, 'users'), where('__name__', '==', currentUser.uid)))
        const profileData = profile.docs[0]?.data() as Partial<FirebaseProfile> | undefined
        setUser({ name: profileData?.name || currentUser.displayName || 'Apna Cart shopper', contact: currentUser.phoneNumber || '' })
        const orders = await getDocs(firestoreQuery(collection(firebaseDb, 'orders'), where('userId', '==', currentUser.uid)))
        const history = orders.docs.map((orderDocument) => {
          const order = orderDocument.data() as Omit<FirestoreOrder, 'id'>
          return order.items.map((item) => ({ ...item, status: order.status, location: order.location, phone: order.customer.phone, email: order.customer.email, orderId: orderDocument.id }))
        }).flat()
        setOrderHistory(history)
      })
    })
    return () => unsubscribe()
  }, [])

  const filteredProducts = useMemo(() => {
    const matches = products.filter((product) => (activeCategory === 'All products' || product.category === activeCategory) && product.name.toLowerCase().includes(query.toLowerCase()))
    if (sortBy === 'low') return [...matches].sort((left, right) => left.price - right.price)
    if (sortBy === 'high') return [...matches].sort((left, right) => right.price - left.price)
    return matches
  }, [activeCategory, query, sortBy])

  const cartItems = cart.map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) })).filter((line): line is CartLine & { product: Product } => Boolean(line.product))
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)
  const cartTotal = cartItems.reduce((total, line) => total + line.product.price * line.quantity, 0)
  const wishlistItems = products.filter((product) => wishlist.includes(product.id))

  const addToCart = (id: number) => {
    setCart((items) => items.some((item) => item.productId === id) ? items.map((item) => item.productId === id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { productId: id, quantity: 1 }])
    setCartOpen(true)
    setOrdersOpen(false)
    setWishlistOpen(false)
  }
  const updateQuantity = (id: number, change: number) => setCart((items) => items.map((item) => item.productId === id ? { ...item, quantity: item.quantity + change } : item).filter((item) => item.quantity > 0))
  const toggleWishlist = (id: number) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const openCategory = (category: string) => { setActiveCategory(category); setMenuOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }
  const openOrders = () => { setOrdersOpen(true); setWishlistOpen(false); setCartOpen(true) }
  const sendNotification = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!notificationText.trim()) return; setNotifications((items) => [{ id: Date.now(), title: 'Apna Cart update', message: notificationText.trim(), time: 'Just now', read: false }, ...items]); setNotificationText(''); setSmsNotice('Notification sent in this app.'); if ('Notification' in window && Notification.permission === 'granted') new Notification('Apna Cart update', { body: notificationText.trim() }) }
  const enableNotifications = async () => { if ('Notification' in window) { const permission = await Notification.requestPermission(); setSmsNotice(permission === 'granted' ? 'Notifications enabled.' : 'Notification permission was not enabled.') } }
  const unreadNotifications = notifications.filter((notification) => !notification.read).length
  const openLogin = () => { setLoginStep('contact'); setLoginOtp(''); setLoginOpen(true) }
  const requestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  try {
    const backendResponse = await fetch(`${API_BASE}/auth/request-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: loginName.trim(), contact: loginContact.trim() }) })
    if (backendResponse.ok) { setAuthMode('backend'); setLoginStep('otp'); setSmsNotice(`OTP sent to ${loginContact}.`); return }
    const backendMessage = await backendResponse.json().catch(() => ({}))
    if (!firebaseConfigured) throw new Error(backendMessage.message || 'OTP provider is not configured.')
    setAuthMode('firebase')
    const { auth: firebaseAuth } = requireFirebase()
    if (!recaptchaVerifier.current) recaptchaVerifier.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', { size: 'invisible' })
    const confirmation = await signInWithPhoneNumber(firebaseAuth, loginContact.trim(), recaptchaVerifier.current)
    setConfirmationResult(confirmation)
    setLoginStep('otp')
    setSmsNotice(`OTP sent to ${loginContact}.`)
  } catch (error) {
    recaptchaVerifier.current?.clear()
    recaptchaVerifier.current = null
    setSmsNotice(error instanceof Error ? error.message : 'OTP could not be sent.')
  }
}
  const resendOtp = async () => {
    const { auth: firebaseAuth } = requireFirebase()
    recaptchaVerifier.current?.clear()
    recaptchaVerifier.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', { size: 'invisible' })
    const confirmation = await signInWithPhoneNumber(firebaseAuth, loginContact.trim(), recaptchaVerifier.current)
    setConfirmationResult(confirmation)
    setSmsNotice(`OTP resent to ${loginContact}.`)
  }
  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  try {
    if (authMode === 'backend') {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: loginContact.trim(), otp: loginOtp.trim() }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'OTP verification failed.')
      const apiUser = data.user as UserProfile
      localStorage.setItem('apna_cart_api_token', data.token)
      localStorage.setItem('apna_cart_api_user', JSON.stringify(apiUser))
      setUser(apiUser)
      setLoginOpen(false)
      setSmsNotice('Login successful. You can now place your order.')
      const ordersResponse = await fetch(`${API_BASE}/orders`, { headers: { Authorization: 'Bearer ' + data.token } })
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json()
        setOrderHistory(orders.flatMap((order: any) => order.items.map((item: Product & { quantity: number }) => ({ ...item, status: order.status, location: order.location, phone: order.customer?.phone || order.customer?.contact || '', email: order.customer?.email || '', orderId: String(order.id) }))))
      }
      if (cart.length > 0) setCheckoutOpen(true)
      return
    }
    if (!confirmationResult) throw new Error('Please request an OTP first.')
    const result = await confirmationResult.confirm(loginOtp.trim())
    const { db: firestoreDb } = requireFirebase()
    await setDoc(doc(firestoreDb, 'users', result.user.uid), { uid: result.user.uid, phoneNumber: result.user.phoneNumber || loginContact.trim(), name: loginName.trim() || 'Apna Cart shopper', email: result.user.email || '', address: customerAddress, updatedAt: serverTimestamp() }, { merge: true })
    setUser({ name: loginName.trim() || 'Apna Cart shopper', contact: result.user.phoneNumber || loginContact.trim() })
    setLoginOpen(false)
    setConfirmationResult(null)
    setSmsNotice('Login successful. You can now place your order.')
    if (cart.length > 0) setCheckoutOpen(true)
  } catch (error) { setSmsNotice(error instanceof Error ? error.message : 'OTP verification failed.') }
}
  const variantImage = (product: Product, color: string, size: string) => product.images[(Math.max(0, product.colors.indexOf(color)) + Math.max(0, product.sizes.indexOf(size))) % product.images.length]
  const openProduct = (product: Product) => { setSelectedProduct(product); setSelectedSize(product.sizes[0]); setSelectedColor(product.colors[0]); setSelectedImage(variantImage(product, product.colors[0], product.sizes[0])) }
  const buyNow = (id: number) => { addToCart(id); setSelectedProduct(null); if (user) setCheckoutOpen(true); else openLogin() }
  const selectedPrice = selectedProduct ? selectedProduct.price + Math.max(0, selectedProduct.sizes.indexOf(selectedSize)) * 18 : 0
  const relatedProducts = selectedProduct ? products.filter((product) => product.category === selectedProduct.category && product.id !== selectedProduct.id).slice(0, 4) : []
  const placeOrder = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  if (!user) { openLogin(); return }
  const apiToken = getApiToken()
  if (apiToken) {
    try {
      const response = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiToken }, body: JSON.stringify({ items: cartItems.map(({ product, quantity }) => ({ ...product, quantity })), total: cartTotal, paymentMethod, address: customerAddress, phone: customerPhone, email: customerEmail }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Order could not be placed.')
      const order = data.order
      setOrderHistory((orders) => [...order.items.map((item: Product & { quantity: number }) => ({ ...item, status: order.status, location: order.location, phone: order.customer.phone, email: order.customer.email, orderId: String(order.id) })), ...orders])
      setCart([])
      setCheckoutOpen(false)
      setOrdersOpen(true)
      setSmsNotice(`Thanks ${customerName || user.name}! Your order is confirmed.`)
      return
    } catch (error) { setSmsNotice(error instanceof Error ? error.message : 'Order could not be placed.'); return }
  }
  try {
    const { db: firestoreDb } = requireFirebase()
  const updateOrderStatus = async (order: OrderItem, index: number, status: string, location: string) => {
  try {
    const apiToken = getApiToken()
    if (apiToken && order.orderId) {
      const response = await fetch(`${API_BASE}/orders/${order.orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiToken }, body: JSON.stringify({ status, location }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Order status could not be updated.')
    } else if (order.orderId) {
      const { db: firestoreDb } = requireFirebase()
      await updateDoc(doc(firestoreDb, 'orders', order.orderId), { status, location })
    }
    setOrderHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status, location } : item))
  } catch (error) { setSmsNotice(error instanceof Error ? error.message : 'Order status could not be updated.') }
}
  void updateOrderStatus

  return (
    <div className="store-shell">
      <div className="announcement">Free shipping on orders over ₹2,000 <span>✦</span> Easy returns within 7 days</div>
      <header className="header">
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">☰</button>
        <a className="logo-wordmark" href="#top" aria-label="Apna Cart home"><img src="/apna-cart-logo.svg" alt="Apna Cart" /></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>{categories.slice(1).map((category) => <button key={category} onClick={() => openCategory(category)}>{category}</button>)}</nav>
        <div className="header-actions">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for dresses, sets, tops..." aria-label="Search products" /></label>
          <button className="orders-button" onClick={openOrders}>Orders <b>{orderHistory.length}</b></button>
          <button className="profile-button" onClick={user ? () => setProfileOpen((open) => !open) : openLogin} aria-label={user ? 'View profile menu' : 'Sign in'}><span>♙</span>{user ? user.name.split(' ')[0] : 'Sign in'}{user && <small>⌄</small>}</button>
          <button className="notification-button" onClick={() => { setNotificationOpen((open) => !open); setNotifications((items) => items.map((notification) => ({ ...notification, read: true }))) }} aria-label="Open notifications"><span>♧</span>Notifications{unreadNotifications > 0 && <b>{unreadNotifications}</b>}</button>
          <button className="orders-button" onClick={() => { setWishlistOpen(true); setOrdersOpen(false); setCartOpen(true) }} aria-label="View wishlist">♡ <b>{wishlist.length}</b></button>
          {installPrompt && <button className="install-button" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null) }}>Install app</button>}
          <button className="bag-button" onClick={() => { setOrdersOpen(false); setWishlistOpen(false); setCartOpen(true) }} aria-label="Open shopping bag">Bag <b>{cartCount}</b></button>
        </div>
        {profileOpen && user && <aside className="profile-menu"><div className="profile-menu-head"><span>♙</span><div><strong>{user.name}</strong><small>{user.contact}</small></div><button onClick={() => setProfileOpen(false)} aria-label="Close profile menu">×</button></div><div className="profile-menu-links"><button onClick={() => { openOrders(); setProfileOpen(false) }}><span>⌁</span>My orders <b>{orderHistory.length}</b></button><button onClick={() => { setWishlistOpen(true); setOrdersOpen(false); setCartOpen(true); setProfileOpen(false) }}><span>♡</span>Saved items <b>{wishlist.length}</b></button><button onClick={() => { setNotificationOpen(true); setProfileOpen(false) }}><span>♧</span>Notifications <b>{unreadNotifications}</b></button></div><button className="logout-button" onClick={async () => { if (auth) await signOut(auth); localStorage.removeItem('apna_cart_api_token'); localStorage.removeItem('apna_cart_api_user'); setUser(null); setOrderHistory([]); setProfileOpen(false); setSmsNotice('You have been logged out.') }}>Log out <span>↗</span></button></aside>}
      </header>

      <main id="top">
        <section className="marketplace-home">
          <nav className="marketplace-shortcuts" aria-label="Store shortcuts">
            <button className="shortcut active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span>⌂</span>Home</button>
            <button className="shortcut" onClick={() => openCategory('All products')}><span>▦</span>Categories</button>
            <button className="shortcut" onClick={() => openCategory('All products')}><span>✦</span>Mall</button>
            <button className="shortcut" onClick={() => document.getElementById('video-picks')?.scrollIntoView({ behavior: 'smooth' })}><span>▶</span>Video</button>
            <button className="shortcut" onClick={() => setSmsNotice('Share Apna Cart with your friends on WhatsApp!')}><span>♧</span>Friends</button>
            <button className="shortcut" onClick={openOrders}><span>⌁</span>My Orders</button>
          </nav>
          <div className="category-home-block"><div className="home-block-heading"><div><p className="eyebrow">SHOP BY CATEGORY</p><h1>Har zaroorat, <em>ek hi cart mein.</em></h1></div><button className="see-all" onClick={() => openCategory('All products')}>See all ↗</button></div><div className="category-rail">{categoryTiles.map((tile) => <button className="category-tile" key={tile.name} onClick={() => openCategory(tile.category)}><span className="category-icon" style={{ background: tile.color }}>{tile.icon}</span><strong>{tile.name}</strong></button>)}</div></div>
          <div className="sale-banner"><div className="sale-copy"><span className="sale-sun">✦</span><strong>APNA CART</strong><h2>MAHA SALE<span>›</span></h2><p>HAR DIN</p></div><div className="sale-offer"><strong>UP TO <b>70%</b> OFF*</strong><span>⚡</span></div><div className="app-offer"><p>Upto <b>35% OFF</b> on your 1<sup>st</sup> order</p><QRCodeSVG className="qr-code" value={`${window.location.origin}/?source=qr-sale`} size={112} bgColor="#ffffff" fgColor="#000000" level="M" title="Scan to shop at Apna Cart" /><strong>Scan to shop on App</strong></div></div>
          <div className="social-rail" id="video-picks"><div><span className="social-icon">▶</span><div><strong>Trending picks</strong><p>See what shoppers are loving</p></div></div><button onClick={() => setSmsNotice('Video shopping is coming soon to Apna Cart.')}>Watch now ↗</button></div>
        </section>
        <div className="ticker"><span>EVERYDAY VALUE</span><span>TRUSTED SHOPPING</span><span>MADE FOR EVERYONE</span></div>

        <section className="shop-section" id="shop">
          <div className="section-heading"><div><p className="eyebrow">TRENDING ON APNA CART</p><h2>Good deals, <em>every day.</em></h2></div><p className="section-note">Useful products, honest prices,<br />and everything in one cart.</p></div>
          <div className="shop-toolbar"><div className="category-tabs">{categories.map((category) => <button className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)} key={category}>{category}</button>)}</div><div className="catalog-controls"><label htmlFor="sort-products">Sort</label><select id="sort-products" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select><span className="item-count">{filteredProducts.length} pieces</span></div></div>
          <div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image" onClick={() => openProduct(product)}><img src={product.image} alt={product.name} />{product.badge && <span className="badge">{product.badge}</span>}<button className={wishlist.includes(product.id) ? 'wishlist-button saved' : 'wishlist-button'} onClick={(event) => { event.stopPropagation(); toggleWishlist(product.id) }} aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Add'} ${product.name} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`}>{wishlist.includes(product.id) ? '♥' : '♡'}</button></div><div className="product-info" onClick={() => openProduct(product)}><div><h3>{product.name}</h3><p>{product.color}</p><div className="rating-line"><span>★ {product.rating}</span><small>({product.reviewCount})</small></div></div><strong>{inr(product.price)}</strong></div></article>)}</div>
          {filteredProducts.length === 0 && <div className="empty-catalog">No pieces found. Try another search or category.</div>}
        </section>

        <section className="promise"><p className="eyebrow">WHY APNA CART</p><h2>Everything you need,<br /><em>all in one place.</em></h2><div className="promise-list"><div><span>01</span><h3>Trusted shopping</h3><p>Explore useful products from categories made for everyday life.</p></div><div><span>02</span><h3>Great value</h3><p>Find fresh deals and simple prices without the marketplace hassle.</p></div><div><span>03</span><h3>Made for everyone</h3><p>One easy cart for your home, style, essentials and more.</p></div></div></section>
        {selectedProduct && <div className="detail-bottom-actions"><button className="detail-cart-action" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null) }}>Add to Cart</button><button className="detail-buy-action" onClick={() => buyNow(selectedProduct.id)}>Buy Now</button></div>}
        <button className="notification-fab" onClick={() => { setNotificationOpen(!notificationOpen); setNotifications((items) => items.map((notification) => ({ ...notification, read: true }))) }} aria-label="Open notifications">🔔<b>{unreadNotifications}</b></button>
        {notificationOpen && 'Notification' in window && Notification.permission !== 'granted' && <button className="enable-notifications" onClick={enableNotifications}>Enable notifications</button>}
        {notificationOpen && <aside className="notification-panel"><div className="notification-head"><div><p className="eyebrow">APNA CART</p><h2>Notifications</h2></div><button onClick={() => setNotificationOpen(false)} aria-label="Close notifications">×</button></div><div className="notification-list">{notifications.length === 0 ? <p className="notification-empty">No notifications yet.</p> : notifications.map((notification) => <article key={notification.id}><strong>{notification.title}</strong><p>{notification.message}</p><small>{notification.time}</small></article>)}</div><form className="notification-compose" onSubmit={sendNotification}><textarea required value={notificationText} onChange={(event) => setNotificationText(event.target.value)} placeholder="Write an update for this app..." rows={2} /><button type="submit">Send notification <span>↗</span></button></form></aside>}
      </main>

      <footer><div><a className="logo-wordmark" href="#top" aria-label="Apna Cart home"><img src="/apna-cart-logo.svg" alt="Apna Cart" /></a><p>Har zaroorat, ek hi cart mein.</p></div><div className="contact-block"><strong>Contact us</strong><a href="tel:+917408590674">Mobile / WhatsApp: 7408590674</a><a href="mailto:aroonmaurya2@gmail.com">aroonmaurya2@gmail.com</a><span>Shop address: Goan Devi Mandir, Dhaniv Baug Talav, Nallasopara, Maharashtra - 401209</span><span>Business hours: 10:00 AM to 6:00 PM</span></div><small>© 2026 Apna Cart</small></footer>

      {loginOpen && <div className="detail-overlay" onClick={() => setLoginOpen(false)}><section className="login-card" onClick={(event) => event.stopPropagation()}><button className="detail-close" onClick={() => setLoginOpen(false)} aria-label="Close login">×</button><p className="eyebrow">WELCOME TO APNA CART</p><h2>{loginStep === 'contact' ? 'Login to continue' : 'Verify your account'}</h2><div id="recaptcha-container" />{loginStep === 'contact' ? <form onSubmit={requestOtp}><input required value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Your name" /><input required value={loginContact} onChange={(event) => setLoginContact(event.target.value)} placeholder="Phone number (+91...)" /><button className="checkout" type="submit">Send OTP <span>↗</span></button></form> : <form onSubmit={verifyOtp}><p className="login-hint">Enter the OTP sent to {loginContact}.</p><input required inputMode="numeric" value={loginOtp} onChange={(event) => setLoginOtp(event.target.value)} placeholder="Enter OTP" maxLength={6} /><button className="checkout" type="submit">Verify and login <span>↗</span></button><button className="login-back" type="button" onClick={resendOtp}>Resend OTP</button><button className="login-back" type="button" onClick={() => setLoginStep('contact')}>Change number</button></form>}<small className="login-note">Login is required before placing an order.</small></section></div>}

      {selectedProduct && <div className="detail-overlay" onClick={() => setSelectedProduct(null)}><section className="product-detail" onClick={(event) => event.stopPropagation()}><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Close product details">×</button><div className="detail-gallery"><img src={selectedImage || selectedProduct.image} alt={`${selectedProduct.name} in ${selectedColor}, size ${selectedSize}`} /><div className="catalog-thumbs">{selectedProduct.images.map((image, index) => <button key={image} className={selectedImage === image ? 'active' : ''} onClick={() => setSelectedImage(image)}><img src={image} alt={`${selectedProduct.name} view ${index + 1}`} /></button>)}</div></div><div className="detail-copy"><p className="eyebrow">{selectedProduct.category}</p><h2>{selectedProduct.name}</h2><div className="detail-rating"><span>★ {selectedProduct.rating}</span> <small>{selectedProduct.reviewCount} ratings</small></div><p className="detail-color">{selectedProduct.color}</p><div className="variant-group"><strong>Color</strong><div className="variant-options">{selectedProduct.colors.map((color) => <button className={selectedColor === color ? 'selected' : ''} key={color} onClick={() => { setSelectedColor(color); setSelectedImage(variantImage(selectedProduct, color, selectedSize)) }}>{color}</button>)}</div></div><div className="variant-group"><strong>Size</strong><div className="variant-options">{selectedProduct.sizes.map((size) => <button className={selectedSize === size ? 'selected' : ''} key={size} onClick={() => { setSelectedSize(size); setSelectedImage(variantImage(selectedProduct, selectedColor, size)) }}>{size}</button>)}</div></div><div className="selected-variant">Selected: {selectedColor} / {selectedSize}</div><strong>{inr(selectedPrice)}</strong><p>{selectedProduct.description}</p><div className="detail-actions"><button className="primary-button" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null) }}>Add to bag <span>↗</span></button><button className="outline-button" onClick={() => toggleWishlist(selectedProduct.id)}>{wishlist.includes(selectedProduct.id) ? '♥ Saved' : '♡ Save for later'}</button></div><div className="related-products"><h3>Related products</h3><div>{relatedProducts.map((product) => <button key={product.id} onClick={() => openProduct(product)}><img src={product.image} alt={product.name} /><strong>{product.name}</strong><span>★ {product.rating} · {inr(product.price)}</span></button>)}</div></div></div></section></div>}

      {cartOpen && <div className="cart-overlay" onClick={() => { setCartOpen(false); setOrdersOpen(false); setWishlistOpen(false) }}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="cart-top"><h2>{ordersOpen ? 'Your orders' : wishlistOpen ? 'Saved pieces' : 'Your bag'} <span>{ordersOpen ? orderHistory.length : wishlistOpen ? wishlist.length : cartCount}</span></h2><button onClick={() => setCartOpen(false)} aria-label="Close drawer">×</button></div>
        {ordersOpen ? orderHistory.length === 0 ? <div className="empty-cart"><span>✦</span><p>No orders yet.<br />Your placed products will appear here.</p></div> : <div className="order-list">{orderHistory.map((order, index) => <div className="cart-item" key={`${order.id}-${index}`}><img src={order.image} alt="" /><div><h3>{order.name}</h3><p>{order.quantity} × {inr(order.price)}</p><small className="order-status">{order.status}</small><span className="order-location">Current location: {order.location}</span>{order.status === 'Processing' ? <button className="ship-button" onClick={() => { setOrderHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'Accepted', location: 'Arun Kids Store' } : item)); setSmsNotice(`Order accepted. SMS ready for ${order.phone}.`) }}>Accept order</button> : order.status === 'Accepted' ? <button className="ship-button" onClick={() => setOrderHistory((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'Shipped', location: 'Nallasopara sorting center' } : item))}>Mark as shipped</button> : <div className="tracking-bar"><span /></div>}</div></div>)}</div> : wishlistOpen ? wishlistItems.length === 0 ? <div className="empty-cart"><span>♡</span><p>Save pieces here<br />for your next visit.</p></div> : <div className="saved-list">{wishlistItems.map((product) => <div className="cart-item" key={product.id}><img src={product.image} alt="" /><div><h3>{product.name}</h3><p>{inr(product.price)}</p><button className="ship-button" onClick={() => addToCart(product.id)}>Add to bag</button></div></div>)}</div> : cartItems.length === 0 ? <div className="empty-cart"><span>✦</span><p>Your bag is waiting.<br />Add something lovely.</p></div> : <><div className="cart-list">{cartItems.map(({ product, quantity }) => <div className="cart-item" key={product.id}><img src={product.image} alt="" /><div><h3>{product.name}</h3><p>{inr(product.price)}</p><div className="quantity-control"><button onClick={() => updateQuantity(product.id, -1)} aria-label={`Decrease ${product.name}`}>−</button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, 1)} aria-label={`Increase ${product.name}`}>+</button></div></div></div>)}</div><div className="cart-total"><span>Subtotal</span><strong>{inr(cartTotal)}</strong></div>{checkoutOpen ? <form className="checkout-form" onSubmit={placeOrder}><h3>Delivery details</h3><input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" /><input required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Mobile number" type="tel" /><input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Email (optional)" type="email" /><textarea required value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} placeholder="Complete delivery address" rows={3} /><button className="checkout" type="submit">Place order <span>↗</span></button></form> : <button className="checkout" onClick={() => setCheckoutOpen(true)}>Continue to checkout <span>↗</span></button>}</>}
      </aside></div>}
      {ordersOpen && orderHistory.length > 0 && <DeliveryTimeline order={orderHistory[0]} />}
      {checkoutOpen && <section className="payment-panel"><div><p className="eyebrow">SECURE PAYMENT</p><h2>Choose payment method</h2><p className="payment-subtitle">Select how you want to pay for your Apna Cart order.</p></div><div className="payment-methods">{(['UPI', 'Card', 'Net banking', 'Wallet', 'Cash on Delivery'] as PaymentMethod[]).map((method) => <button key={method} className={paymentMethod === method ? 'payment-method selected' : 'payment-method'} onClick={() => setPaymentMethod(method)}><span className="payment-radio">{paymentMethod === method ? '●' : '○'}</span><strong>{method}</strong><small>{method === 'UPI' ? 'Google Pay, PhonePe, Paytm' : method === 'Card' ? 'Visa, Mastercard, RuPay' : method === 'Net banking' ? 'All major banks' : method === 'Wallet' ? 'Paytm, Mobikwik and more' : 'Pay when delivery arrives'}</small></button>)}</div><div className="payment-total"><span>Payable amount</span><strong>{inr(cartTotal)}</strong></div></section>}
      {smsNotice && <button className="sms-notice" onClick={() => setSmsNotice('')} role="status">{smsNotice} <span>×</span></button>}
    </div>
  )
}

export default App
