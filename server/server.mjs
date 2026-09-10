import 'dotenv/config'
import cors from 'cors'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, 'data')
const ordersFile = path.join(dataDirectory, 'orders.json')
const app = express()
const otpStore = new Map()
const sessions = new Map()
const port = Number(process.env.PORT || 8787)
const ownerEmail = process.env.OWNER_EMAIL || 'aroonmaurya2@gmail.com'
const DEFAULT_COMMISSION_RATE = 10
const REFERRAL_REWARD = 73

const getFirebaseStore = () => {
  try {
    if (getApps().length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : { projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') }
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) return null
      initializeApp({ credential: cert(serviceAccount) })
    }
    return getFirestore()
  } catch (error) { console.error('Firebase is not configured. Using local order storage:', error.message); return null }
}

const firestore = getFirebaseStore()
const ordersCollection = firestore?.collection('orders')
const sellersCollection = firestore?.collection('sellers')
const productsCollection = firestore?.collection('products')
const commissionsCollection = firestore?.collection('commissions')
const referralsCollection = firestore?.collection('referrals')
const referralAttributionsCollection = firestore?.collection('referralAttributions')
void commissionsCollection

const calculateCommission = (amount, rate = DEFAULT_COMMISSION_RATE) => { const commission = (amount * rate) / 100; return { commission: Math.round(commission * 100) / 100, sellerAmount: Math.round((amount - commission) * 100) / 100 } }
app.use(cors({ origin: true }))
app.use(express.json({ limit: '100kb' }))
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const normaliseContact = (value) => value.trim().toLowerCase()
const getSession = (request) => sessions.get(request.headers.authorization?.replace('Bearer ', ''))
const isOwner = (session) => Boolean(session && session.contact === ownerEmail.toLowerCase())
const clean = (value) => String(value ?? '').trim()
const makeReferralCode = (contact) => `APNA${crypto.createHash('sha256').update(contact).digest('hex').slice(0, 8).toUpperCase()}`
const referralDocId = (contact) => clean(contact).replace(/[^a-zA-Z0-9_-]/g, '_')

const readOrders = async () => {
  if (ordersCollection) { const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get(); return snapshot.docs.map((document) => document.data()) }
  try { return JSON.parse(await fs.readFile(ordersFile, 'utf8')) } catch { return [] }
}
const writeOrders = async (orders) => { await fs.mkdir(dataDirectory, { recursive: true }); await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2)) }
const getTransporter = () => { if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null; return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }) }
const sendEmail = async (to, subject, text) => { const transporter = getTransporter(); if (!transporter) { console.log(`[email not configured] ${to}\n${subject}\n${text}`); return false }; await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text }); return true }
const sendSms = async (phone, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) return false
  const body = new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM, Body: message })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error(`Twilio request failed: ${response.status}`)
  return true
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'apna-cart-api' }))
app.post('/api/auth/request-otp', async (request, response) => {
  const { name, contact } = request.body || {}
  if (!name?.trim() || !contact?.trim()) return response.status(400).json({ message: 'Name and mobile number or email are required.' })
  const cleanContact = normaliseContact(contact); const otp = String(crypto.randomInt(100000, 1000000))
  otpStore.set(cleanContact, { name: name.trim(), otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 })
  try { const message = `Your Apna Cart verification code is ${otp}. It expires in 5 minutes.`; const delivered = isEmail(cleanContact) ? await sendEmail(cleanContact, 'Your Apna Cart OTP', message) : await sendSms(cleanContact, message); if (!delivered && process.env.NODE_ENV === 'production') return response.status(503).json({ message: 'OTP provider is not configured. Add SMTP or Twilio credentials.' }); if (!delivered) console.log(`[development OTP] ${cleanContact}: ${otp}`); return response.json({ message: `OTP sent to ${contact}.` }) } catch (error) { console.error(error); return response.status(502).json({ message: 'OTP could not be sent. Check your provider settings.' }) }
})
app.post('/api/auth/verify-otp', (request, response) => {
  const { contact, otp } = request.body || {}; const cleanContact = normaliseContact(contact || ''); const record = otpStore.get(cleanContact)
  if (!record || Date.now() > record.expiresAt || record.attempts >= 5) return response.status(400).json({ message: 'OTP expired. Please request a new one.' })
  record.attempts += 1; if (record.otp !== String(otp || '').trim()) return response.status(400).json({ message: 'Incorrect OTP.' })
  otpStore.delete(cleanContact); const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { name: record.name, contact: cleanContact, createdAt: Date.now() }); return response.json({ token, user: { name: record.name, contact: cleanContact } })
})

app.get('/api/referrals/me', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' })
  const code = makeReferralCode(session.contact)
  if (!referralsCollection) return response.json({ referral: { code, successfulInvites: 0, balance: 0, reward: REFERRAL_REWARD } })
  try {
    const ref = referralsCollection.doc(referralDocId(session.contact)); const snap = await ref.get()
    if (!snap.exists) { const referral = { contact: session.contact, name: session.name, code, successfulInvites: 0, inviteClicks: 0, balance: 0, reward: REFERRAL_REWARD, createdAt: new Date().toISOString() }; await ref.set(referral); return response.json({ referral }) }
    return response.json({ referral: { ...snap.data(), code } })
  } catch (error) { console.error(error); return response.status(500).json({ message: 'Referral data could not be loaded.' }) }
})

app.post('/api/referrals/invite', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' })
  const code = clean(request.body?.code)
  if (!code || code !== makeReferralCode(session.contact)) return response.status(400).json({ message: 'Invalid referral code.' })
  if (!referralsCollection) return response.json({ ok: true })
  try { const ref = referralsCollection.doc(referralDocId(session.contact)); await ref.set({ contact: session.contact, name: session.name, code, inviteClicks: 1, lastInviteAt: new Date().toISOString() }, { merge: true }); return response.json({ ok: true }) }
  catch (error) { console.error(error); return response.status(500).json({ message: 'Invite could not be recorded.' }) }
})

app.post('/api/referrals/claim', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' })
  const code = clean(request.body?.code).toUpperCase()
  if (!code) return response.status(400).json({ message: 'Referral code is required.' })
  if (code === makeReferralCode(session.contact)) return response.status(400).json({ message: 'You cannot use your own referral code.' })
  if (!referralsCollection || !referralAttributionsCollection) return response.json({ ok: true, tracked: false })
  try {
    const existing = await referralAttributionsCollection.doc(referralDocId(session.contact)).get()
    if (existing.exists) return response.json({ ok: true, tracked: false, alreadyClaimed: true })
    const referrerSnapshot = await referralsCollection.where('code', '==', code).limit(1).get()
    if (referrerSnapshot.empty) return response.status(404).json({ message: 'Referral code not found.' })
    const referrer = referrerSnapshot.docs[0].data()
    const attribution = { referredContact: session.contact, referredName: session.name, referrerContact: referrer.contact, referrerCode: code, reward: REFERRAL_REWARD, status: 'pending', claimedAt: new Date().toISOString(), rewardedAt: null }
    await referralAttributionsCollection.doc(referralDocId(session.contact)).set(attribution)
    await referralsCollection.doc(referrerSnapshot.docs[0].id).set({ pendingInvites: Number(referrer.pendingInvites || 0) + 1 }, { merge: true })
    return response.json({ ok: true, tracked: true, status: 'pending' })
  } catch (error) { console.error(error); return response.status(500).json({ message: 'Referral could not be claimed.' }) }
})

const inferGender = (product) => product.gender || (product.category === 'Men' || /\bmen'?s?\b/i.test(product.name) ? 'Men' : product.category === 'Kids' || /\bkids?\b/i.test(product.name) ? 'Kids' : product.category === 'All Categories' && /smartphone|headphones/i.test(product.name) ? 'Unisex' : 'Women')

app.get('/api/products', async (request, response) => {
  if (!productsCollection) return response.json({ products: [] })
  try {
    const snapshot = await productsCollection.where('status', '==', 'active').get()
    const category = clean(request.query.category); const gender = clean(request.query.gender); const sort = clean(request.query.sort)
    let products = snapshot.docs.map((doc) => ({ ...doc.data(), gender: inferGender(doc.data()) }))
    if (category && category !== 'All') products = products.filter((product) => product.category === category)
    if (gender && gender !== 'All') products = products.filter((product) => inferGender(product) === gender)
    if (sort === 'price-low') products.sort((a, b) => Number(a.price) - Number(b.price)); else if (sort === 'price-high') products.sort((a, b) => Number(b.price) - Number(a.price)); else if (sort === 'rating') products.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)); else if (sort === 'discount') products.sort((a, b) => ((Number(b.oldPrice) - Number(b.price)) / Math.max(Number(b.oldPrice), 1)) - ((Number(a.oldPrice) - Number(a.price)) / Math.max(Number(a.oldPrice), 1)))
    return response.json({ products })
  } catch (error) { console.error(error); return response.status(500).json({ message: 'Products could not be loaded.' }) }
})

app.get('/api/sellers/me', async (request, response) => {
  const session = getSession(request); if (!session || !sellersCollection) return response.status(401).json({ message: 'Please login again.' })
  try { const snapshot = await sellersCollection.where('email', '==', session.contact).limit(1).get(); if (snapshot.empty) return response.status(404).json({ message: 'Seller account not found.' }); return response.json({ seller: snapshot.docs[0].data() }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Seller could not be loaded.' }) }
})

app.post('/api/sellers', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Login required to become a seller.' })
  if (!sellersCollection) return response.status(503).json({ message: 'Firebase is not configured.' })
  const body = request.body || {}
  const seller = { name: clean(body.name), shopName: clean(body.shopName), email: clean(body.email).toLowerCase(), phone: clean(body.phone), pickupAddress: clean(body.pickupAddress), city: clean(body.city), state: clean(body.state), pincode: clean(body.pincode), taxIdType: body.taxIdType === 'UIN' ? 'UIN' : 'GSTIN', taxId: clean(body.taxId), pan: clean(body.pan), bankAccountName: clean(body.bankAccountName), bankAccountNumber: clean(body.bankAccountNumber), ifsc: clean(body.ifsc).toUpperCase() }
  if (!seller.name || !seller.shopName || !seller.email || !seller.phone || !seller.pickupAddress || !seller.city || !seller.state || !seller.pincode || !seller.taxId || !seller.pan || !seller.bankAccountName || !seller.bankAccountNumber || !seller.ifsc) return response.status(400).json({ message: 'All seller KYC, pickup address and bank details are mandatory.' })
  if (seller.email !== session.contact && session.contact.includes('@')) return response.status(403).json({ message: 'Seller email must match your logged-in email.' })
  if (!/^\d{10}$/.test(seller.phone.replace(/\D/g, ''))) return response.status(400).json({ message: 'Valid 10-digit mobile number is required.' })
  if (!/^\d{6}$/.test(seller.pincode)) return response.status(400).json({ message: 'Valid 6-digit pincode is required.' })
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(seller.pan.toUpperCase())) return response.status(400).json({ message: 'Valid PAN is required.' })
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(seller.ifsc)) return response.status(400).json({ message: 'Valid IFSC code is required.' })
  if (seller.taxIdType === 'GSTIN' && !/^\d{2}[A-Z0-9]{10}\dZ[A-Z0-9]$/.test(seller.taxId.toUpperCase())) return response.status(400).json({ message: 'Valid GSTIN is required.' })
  const existing = await sellersCollection.where('email', '==', session.contact).limit(1).get(); if (!existing.empty) return response.json({ seller: existing.docs[0].data() })
  const sellerId = `seller-${crypto.randomUUID()}`; const savedSeller = { sellerId, ...seller, email: session.contact, commissionRate: DEFAULT_COMMISSION_RATE, status: 'active', kycStatus: 'Pending Review', createdAt: new Date().toISOString() }; await sellersCollection.doc(sellerId).set(savedSeller); return response.status(201).json({ seller: savedSeller })
})

app.post('/api/products', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Login required.' })
  if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Firebase is not configured.' })
  const sellerSnapshot = await sellersCollection.where('email', '==', session.contact).limit(1).get(); if (sellerSnapshot.empty) return response.status(403).json({ message: 'Register as a seller first.' })
  const { name, category, gender, price, oldPrice, image, sizes, colors, description } = request.body || {}; const numericPrice = Number(price); if (!name?.trim() || !category?.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) return response.status(400).json({ message: 'Product name, category and valid price are required.' })
  const id = `product-${crypto.randomUUID()}`; const product = { id, sellerId: sellerSnapshot.docs[0].id, sellerName: sellerSnapshot.docs[0].data().shopName || sellerSnapshot.docs[0].data().name, name: name.trim(), category: category.trim(), gender: ['Women', 'Men', 'Kids', 'Unisex'].includes(gender) ? gender : 'Women', price: numericPrice, oldPrice: Number(oldPrice) > numericPrice ? Number(oldPrice) : numericPrice, image: String(image || '').trim(), sizes: Array.isArray(sizes) ? sizes.slice(0, 20) : [], colors: Array.isArray(colors) ? colors.slice(0, 20) : [], description: String(description || '').trim(), rating: 0, reviews: 0, status: 'active', createdAt: new Date().toISOString() }; await productsCollection.doc(id).set(product); return response.status(201).json({ product })
})

app.get('/api/orders', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login again.' })
  try { const orders = await readOrders(); return response.json(orders.filter((order) => order.customer?.contact === session.contact)) } catch (error) { console.error(error); return response.status(500).json({ message: 'Orders could not be loaded.' }) }
})
app.post('/api/orders', async (request, response) => {
  const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login again.' })
  const { items, total, address, paymentMethod, phone, email } = request.body || {}; if (!Array.isArray(items) || items.length === 0 || !address?.trim() || !phone?.trim()) return response.status(400).json({ message: 'Order items, phone and address are required.' })
  const productTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0); const { commission, sellerAmount } = calculateCommission(productTotal); const order = { id: Date.now(), createdAt: new Date().toISOString(), customer: { name: session.name, contact: session.contact, phone: phone.trim(), email: email?.trim() || '' }, address: address.trim(), paymentMethod: paymentMethod || 'Cash on Delivery', total: Number(total) || productTotal, productTotal, commission, sellerAmount, platformEarning: commission, earningStatus: 'Pending', items, status: 'Processing', location: 'Order received' }
  try { if (ordersCollection) await ordersCollection.doc(String(order.id)).set(order); else { const orders = await readOrders(); orders.unshift(order); await writeOrders(orders) }; const itemLines = items.map((item) => `${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`).join('\n'); const ownerMessage = `New Apna Cart order #${order.id}\n\nCustomer: ${session.name}\nContact: ${session.contact}\nPhone: ${phone}\nEmail: ${email || 'Not provided'}\nAddress: ${address}\nPayment: ${order.paymentMethod}\nTotal: ₹${order.total}\n\nItems:\n${itemLines}`; try { await sendEmail(ownerEmail, `New order #${order.id} - Apna Cart`, ownerMessage) } catch (error) { console.error('Owner email failed:', error) }; return response.status(201).json({ order }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Order could not be saved.' }) }
})

async function rewardReferralForDeliveredOrder(order) {
  if (!referralsCollection || !referralAttributionsCollection || !order?.customer?.contact) return
  try {
    const attributionRef = referralAttributionsCollection.doc(referralDocId(order.customer.contact))
    const attributionSnap = await attributionRef.get()
    if (!attributionSnap.exists) return
    const attribution = attributionSnap.data()
    if (attribution.status === 'rewarded' || !attribution.referrerContact) return
    const referrerRef = referralsCollection.doc(referralDocId(attribution.referrerContact))
    const referrerSnap = await referrerRef.get()
    if (!referrerSnap.exists) return
    const referrer = referrerSnap.data()
    await referrerRef.set({ successfulInvites: Number(referrer.successfulInvites || 0) + 1, balance: Number(referrer.balance || 0) + REFERRAL_REWARD, pendingInvites: Math.max(0, Number(referrer.pendingInvites || 0) - 1), lastRewardAt: new Date().toISOString() }, { merge: true })
    await attributionRef.set({ status: 'rewarded', rewardedAt: new Date().toISOString(), rewardedOrderId: String(order.id), reward: REFERRAL_REWARD }, { merge: true })
  } catch (error) { console.error('Referral reward failed:', error) }
}

app.patch('/api/orders/:id/status', async (request, response) => {
  const session = getSession(request); if (!session || !isOwner(session)) return response.status(403).json({ message: 'Only the store owner can update order status.' })
  const nextStatus = String(request.body?.status || '').trim(); const nextLocation = String(request.body?.location || '').trim(); const allowedStatuses = new Set(['Processing', 'Accepted', 'Shipped', 'Delivered']); if (!allowedStatuses.has(nextStatus) || !nextLocation) return response.status(400).json({ message: 'Valid status and location are required.' })
  try { if (ordersCollection) { const reference = ordersCollection.doc(request.params.id); const snapshot = await reference.get(); if (!snapshot.exists) return response.status(404).json({ message: 'Order not found.' }); const order = snapshot.data(); await reference.update({ status: nextStatus, location: nextLocation }); if (nextStatus === 'Delivered' && order.status !== 'Delivered') await rewardReferralForDeliveredOrder({ ...order, status: nextStatus }); return response.json({ order: { id: snapshot.id, ...order, status: nextStatus, location: nextLocation } }) } const orders = await readOrders(); const order = orders.find((item) => String(item.id) === request.params.id); if (!order) return response.status(404).json({ message: 'Order not found.' }); const previousStatus = order.status; order.status = nextStatus; order.location = nextLocation; await writeOrders(orders); if (nextStatus === 'Delivered' && previousStatus !== 'Delivered') await rewardReferralForDeliveredOrder(order); return response.json({ order }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Order status could not be updated.' }) }
})

export { app }
if (process.env.NETLIFY !== 'true') app.listen(port, () => console.log(`Apna Cart API running at http://localhost:${port}`))
