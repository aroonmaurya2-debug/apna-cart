import 'dotenv/config'
import cors from 'cors'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { sendResendEmail } from './resend-email.mjs'
import { registerSellerProductRoutes } from './seller-products.mjs'
import { registerAdminControlRoutes } from './admin-controls.mjs'

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
const sendEmail = async (to, subject, text) => sendResendEmail({ to, subject, text })

const sendSmsVerify = async (phone) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) return false
  const body = new URLSearchParams({ To: phone, Channel: 'sms' })
  const response = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload?.message || `Twilio Verify request failed: ${response.status}`); return payload?.status === 'pending'
}
const verifySmsOtp = async (phone, code) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) return false
  const body = new URLSearchParams({ To: phone, Code: code })
  const response = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload?.message || `Twilio Verify check failed: ${response.status}`); return payload?.status === 'approved' && payload?.valid === true
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'apna-cart-api' }))
app.post('/api/auth/request-otp', async (request, response) => {
  const { name, contact } = request.body || {}; if (!name?.trim() || !contact?.trim()) return response.status(400).json({ message: 'Name and mobile number or email are required.' })
  const cleanContact = normaliseContact(contact); const isPhone = !isEmail(cleanContact)
  try {
    if (isPhone) { const delivered = await sendSmsVerify(cleanContact); if (!delivered) return response.status(503).json({ message: 'Mobile OTP provider is not configured. Add TWILIO_VERIFY_SERVICE_SID in Render.' }); otpStore.set(cleanContact, { name: name.trim(), expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0, provider: 'twilio-verify' }) }
    else { const otp = String(crypto.randomInt(100000, 1000000)); otpStore.set(cleanContact, { name: name.trim(), otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0, provider: 'email' }); const delivered = await sendEmail(cleanContact, 'Your Apna Cart OTP', `Your Apna Cart verification code is ${otp}. It expires in 5 minutes.`); if (!delivered) return response.status(503).json({ message: 'Email OTP provider is not configured. Add SMTP_PASS with your Resend API key in Render.' }) }
    return response.json({ message: `OTP sent to ${contact}.` })
  } catch (error) { console.error('OTP request failed:', error); return response.status(502).json({ message: error?.message || 'OTP could not be sent. Check your Resend settings.' }) }
})
app.post('/api/auth/verify-otp', async (request, response) => {
  const { contact, otp } = request.body || {}; const cleanContact = normaliseContact(contact || ''); const record = otpStore.get(cleanContact)
  if (!record || Date.now() > record.expiresAt || record.attempts >= 5) return response.status(400).json({ message: 'OTP expired. Please request a new one.' }); record.attempts += 1
  try { const valid = record.provider === 'twilio-verify' ? await verifySmsOtp(cleanContact, String(otp || '').trim()) : record.otp === String(otp || '').trim(); if (!valid) return response.status(400).json({ message: 'Incorrect OTP.' }); otpStore.delete(cleanContact); const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { name: record.name, contact: cleanContact, createdAt: Date.now() }); return response.json({ token, user: { name: record.name, contact: cleanContact } }) }
  catch (error) { console.error('OTP verification failed:', error); return response.status(502).json({ message: error?.message || 'OTP verification failed. Please try again.' }) }
})

app.get('/api/referrals/me', async (request, response) => { const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' }); const code = makeReferralCode(session.contact); if (!referralsCollection) return response.json({ referral: { code, successfulInvites: 0, balance: 0, reward: REFERRAL_REWARD } })
  try { const ref = referralsCollection.doc(referralDocId(session.contact)); const snap = await ref.get(); if (!snap.exists) { const referral = { contact: session.contact, name: session.name, code, successfulInvites: 0, inviteClicks: 0, balance: 0, reward: REFERRAL_REWARD, createdAt: new Date().toISOString() }; await ref.set(referral); return response.json({ referral }) }; return response.json({ referral: { ...snap.data(), code } }) }
  catch (error) { console.error(error); return response.status(500).json({ message: 'Referral data could not be loaded.' }) }
})
app.post('/api/referrals/invite', async (request, response) => { const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' }); const code = clean(request.body?.code); if (!code || code !== makeReferralCode(session.contact)) return response.status(400).json({ message: 'Invalid referral code.' }); if (!referralsCollection) return response.json({ ok: true }); try { const ref = referralsCollection.doc(referralDocId(session.contact)); await ref.set({ contact: session.contact, name: session.name, code, inviteClicks: 1, lastInviteAt: new Date().toISOString() }, { merge: true }); return response.json({ ok: true }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Invite could not be recorded.' }) } })
app.post('/api/referrals/claim', async (request, response) => { const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' }); const code = clean(request.body?.code).toUpperCase(); if (!code) return response.status(400).json({ message: 'Referral code is required.' }); if (code === makeReferralCode(session.contact)) return response.status(400).json({ message: 'You cannot use your own referral code.' }); if (!referralsCollection || !referralAttributionsCollection) return response.json({ ok: true, tracked: false }); try { const existing = await referralAttributionsCollection.doc(referralDocId(session.contact)).get(); if (existing.exists) return response.json({ ok: true, tracked: false, alreadyClaimed: true }); const referrerSnapshot = await referralsCollection.where('code', '==', code).limit(1).get(); if (referrerSnapshot.empty) return response.status(404).json({ message: 'Referral code not found.' }); const referrer = referrerSnapshot.docs[0].data(); const attribution = { referredContact: session.contact, referredName: session.name, referrerContact: referrer.contact, referrerCode: code, reward: REFERRAL_REWARD, status: 'pending', claimedAt: new Date().toISOString(), rewardedAt: null }; await referralAttributionsCollection.doc(referralDocId(session.contact)).set(attribution); await referralsCollection.doc(referrerSnapshot.docs[0].id).set({ pendingInvites: Number(referrer.pendingInvites || 0) + 1 }, { merge: true }); return response.json({ ok: true, tracked: true, status: 'pending' }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Referral could not be claimed.' }) } })

const inferGender = (product) => product.gender || (product.category === 'Men' || /\bmen'?s?\b/i.test(product.name) ? 'Men' : product.category === 'Kids' || /\bkids?\b/i.test(product.name) ? 'Kids' : product.category === 'All Categories' && /smartphone|headphones/i.test(product.name) ? 'Unisex' : 'Women')
app.get('/api/products', async (request, response) => { if (!productsCollection) return response.json({ products: [] }); try { const snapshot = await productsCollection.where('status', '==', 'active').get(); const category = clean(request.query.category); const gender = clean(request.query.gender); const sort = clean(request.query.sort); let products = snapshot.docs.map((doc) => ({ ...doc.data(), gender: inferGender(doc.data()) })); if (category && category !== 'All') products = products.filter((product) => product.category === category); if (gender && gender !== 'All') products = products.filter((product) => inferGender(product) === gender); if (sort === 'price-low') products.sort((a,b)=>Number(a.price)-Number(b.price)); else if (sort === 'price-high') products.sort((a,b)=>Number(b.price)-Number(a.price)); else if (sort === 'rating') products.sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)); else if (sort === 'discount') products.sort((a,b)=>((Number(b.oldPrice)-Number(b.price))/Math.max(Number(b.oldPrice),1))-((Number(a.oldPrice)-Number(a.price))/Math.max(Number(a.oldPrice),1))); return response.json({ products }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Products could not be loaded.' }) } })
app.get('/api/sellers/me', async (request, response) => { const session = getSession(request); if (!session || !sellersCollection) return response.status(401).json({ message: 'Please login again.' }); try { const snapshot = await sellersCollection.where('email','==',session.contact).limit(1).get(); if(snapshot.empty)return response.status(404).json({message:'Seller account not found.'}); return response.json({seller:snapshot.docs[0].data()}) } catch(error){console.error(error);return response.status(500).json({message:'Seller could not be loaded.'})} })
app.post('/api/sellers', async (request,response)=>{ const session=getSession(request); if(!session)return response.status(401).json({message:'Login required to become a seller.'}); if(!sellersCollection)return response.status(503).json({message:'Firebase is not configured.'}); const body=request.body||{}; const seller={name:clean(body.name),shopName:clean(body.shopName),email:clean(body.email).toLowerCase(),phone:clean(body.phone),pickupAddress:clean(body.pickupAddress),city:clean(body.city),state:clean(body.state),pincode:clean(body.pincode),taxIdType:body.taxIdType==='UIN'?'UIN':'GSTIN',taxId:clean(body.taxId),pan:clean(body.pan),bankAccountName:clean(body.bankAccountName),bankAccountNumber:clean(body.bankAccountNumber),ifsc:clean(body.ifsc).toUpperCase()}; if(!seller.name||!seller.shopName||!seller.email||!seller.phone||!seller.pickupAddress||!seller.city||!seller.state||!seller.pincode||!seller.taxId||!seller.pan||!seller.bankAccountName||!seller.bankAccountNumber||!seller.ifsc)return response.status(400).json({message:'All seller KYC, pickup address and bank details are mandatory.'}); if(seller.email!==session.contact&&session.contact.includes('@'))return response.status(403).json({message:'Seller email must match your logged-in email.'}); if(!/^\d{10}$/.test(seller.phone.replace(/\D/g,'')))return response.status(400).json({message:'Valid 10-digit mobile number is required.'}); if(!/^\d{6}$/.test(seller.pincode))return response.status(400).json({message:'Valid 6-digit pincode is required.'}); if(!/^[A-Z]{5}\d{4}[A-Z]$/.test(seller.pan.toUpperCase()))return response.status(400).json({message:'Valid PAN is required.'}); if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(seller.ifsc))return response.status(400).json({message:'Valid IFSC code is required.'}); const existing=await sellersCollection.where('email','==',seller.email).limit(1).get(); if(!existing.empty)return response.status(409).json({message:'Seller account already exists.'}); const sellerId=`seller_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`; await sellersCollection.doc(sellerId).set({...seller,id:sellerId,status:'pending',createdAt:new Date().toISOString()}); return response.status(201).json({seller:{...seller,id:sellerId,status:'pending'}}) })

registerAdminControlRoutes(app, { productsCollection, sellersCollection, getSession, isOwner, readOrders, calculateCommission })
registerSellerProductRoutes(app, { productsCollection, sellersCollection, getSession, isOwner })

app.post('/api/orders', async (request, response) => { const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' }); const body = request.body || {}; const order = { id: `order_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`, customerName: session.name, customerContact: session.contact, items: Array.isArray(body.items) ? body.items : [], total: Number(body.total || 0), address: clean(body.address), city: clean(body.city), pincode: clean(body.pincode), status: 'placed', createdAt: new Date().toISOString() }; if (!order.items.length || !order.total || !order.address) return response.status(400).json({ message: 'Order items, total and address are required.' }); try { if (ordersCollection) await ordersCollection.doc(order.id).set(order); else { const orders = await readOrders(); orders.unshift(order); await writeOrders(orders) } if (ownerEmail) await sendEmail(ownerEmail, `New Apna Cart Order ${order.id}`, `New order placed by ${order.customerName} (${order.customerContact}). Total: ₹${order.total}. Delivery: ${order.address}, ${order.city} - ${order.pincode}.`); return response.status(201).json({ order }) } catch (error) { console.error('Order create failed:', error); return response.status(500).json({ message: 'Order could not be placed.' }) } })
app.get('/api/orders', async (request, response) => { const session = getSession(request); if (!session) return response.status(401).json({ message: 'Please login first.' }); try { const orders = await readOrders(); const visible = isOwner(session) ? orders : orders.filter((order) => order.customerContact === session.contact); return response.json({ orders: visible }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Orders could not be loaded.' }) } })
app.put('/api/orders/:id', async (request,response)=>{const session=getSession(request);if(!isOwner(session))return response.status(403).json({message:'Owner access required.'});const status=clean(request.body?.status);if(!['placed','pending','confirmed','shipped','delivered','completed','cancelled'].includes(status))return response.status(400).json({message:'Invalid order status.'});try{if(ordersCollection){const ref=ordersCollection.doc(request.params.id);const snap=await ref.get();if(!snap.exists)return response.status(404).json({message:'Order not found.'});await ref.set({status,updatedAt:new Date().toISOString()},{merge:true});return response.json({order:{...snap.data(),id:ref.id,status}})}const orders=await readOrders();const index=orders.findIndex(o=>String(o.id)===String(request.params.id));if(index<0)return response.status(404).json({message:'Order not found.'});orders[index]={...orders[index],status,updatedAt:new Date().toISOString()};await writeOrders(orders);return response.json({order:orders[index]})}catch(error){console.error('Order status update failed:',error);return response.status(500).json({message:'Order status could not be updated.'})}})

app.get('/api/admin/overview', async (request,response)=>{const session=getSession(request);if(!isOwner(session))return response.status(403).json({message:'Owner access required.'});try{const orders=await readOrders();const totalRevenue=orders.reduce((sum,o)=>sum+Number(o.total||0),0);const commissions=orders.map(o=>calculateCommission(Number(o.total||0)));const commissionTotal=commissions.reduce((sum,c)=>sum+c.commission,0);return response.json({summary:{orders:orders.length,totalRevenue,commissionTotal,netRevenue:Math.round((totalRevenue-commissionTotal)*100)/100}})}catch(error){console.error(error);return response.status(500).json({message:'Admin overview could not be loaded.'})}})
app.get('/api/admin/sellers', async (request,response)=>{const session=getSession(request);if(!isOwner(session))return response.status(403).json({message:'Owner access required.'});if(!sellersCollection)return response.json({sellers:[]});try{const snapshot=await sellersCollection.get();return response.json({sellers:snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))})}catch(error){console.error(error);return response.status(500).json({message:'Sellers could not be loaded.'})}})
app.put('/api/admin/sellers/:id/status', async (request,response)=>{const session=getSession(request);if(!isOwner(session))return response.status(403).json({message:'Owner access required.'});if(!sellersCollection)return response.status(503).json({message:'Firebase is not configured.'});const status=clean(request.body?.status);if(!['pending','approved','rejected','suspended'].includes(status))return response.status(400).json({message:'Invalid seller status.'});try{const ref=sellersCollection.doc(request.params.id);const snap=await ref.get();if(!snap.exists)return response.status(404).json({message:'Seller not found.'});await ref.set({status,updatedAt:new Date().toISOString()},{merge:true});return response.json({seller:{...snap.data(),id:ref.id,status}})}catch(error){console.error(error);return response.status(500).json({message:'Seller status could not be updated.'})}})

app.use(express.static(path.join(__dirname, '..', 'dist')))
app.listen(port, () => console.log(`Apna Cart API listening on ${port}`))
