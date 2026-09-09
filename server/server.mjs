import 'dotenv/config'
import cors from 'cors'
import crypto from 'node:crypto'
import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

const getFirebaseStore = () => {
  try {
    if (getApps().length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) return null
      initializeApp({ credential: cert(serviceAccount) })
    }
    return getFirestore()
  } catch (error) {
    console.error('Firebase is not configured. Using local order storage:', error.message)
    return null
  }
}
const firestore = getFirebaseStore()
const ordersCollection = firestore?.collection('orders')
const sellersCollection = firestore?.collection('sellers')
const commissionsCollection = firestore?.collection('commissions')

const DEFAULT_COMMISSION_RATE = 10

const calculateCommission = (amount, rate = DEFAULT_COMMISSION_RATE) => {
  const commission = (amount * rate) / 100

  return {
    commission: Math.round(commission * 100) / 100,
    sellerAmount: Math.round((amount - commission) * 100) / 100,
  }
}
app.use(cors({ origin: true }))
app.use(express.json({ limit: '100kb' }))

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const normaliseContact = (value) => value.trim().toLowerCase()
const readOrders = async () => {
  if (ordersCollection) {
    const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((document) => document.data())
  }
  try { return JSON.parse(await fs.readFile(ordersFile, 'utf8')) } catch { return [] }
}
const writeOrders = async (orders) => {
  await fs.mkdir(dataDirectory, { recursive: true })
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2))
}
const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
}
const sendEmail = async (to, subject, text) => {
  const transporter = getTransporter()
  if (!transporter) { console.log(`[email not configured] ${to}\n${subject}\n${text}`); return false }
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text })
  return true
}
const sendSms = async (phone, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM) return false
  const body = new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM, Body: message })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error(`Twilio request failed: ${response.status}`)
  return true
}

app.get('/api/health', (_request, response) => response.json({ ok: true }))

app.post('/api/auth/request-otp', async (request, response) => {
  const { name, contact } = request.body || {}
  if (!name?.trim() || !contact?.trim()) return response.status(400).json({ message: 'Name and mobile number or email are required.' })
  const cleanContact = normaliseContact(contact)
  const otp = String(crypto.randomInt(100000, 1000000))
  otpStore.set(cleanContact, { name: name.trim(), otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 })
  try {
    const message = `Your Apna Cart verification code is ${otp}. It expires in 5 minutes.`
    const delivered = isEmail(cleanContact) ? await sendEmail(cleanContact, 'Your Apna Cart OTP', message) : await sendSms(cleanContact, message)
    if (!delivered && process.env.NODE_ENV === 'production') return response.status(503).json({ message: 'OTP provider is not configured. Add SMTP or Twilio credentials.' })
    if (!delivered) console.log(`[development OTP] ${cleanContact}: ${otp}`)
    return response.json({ message: `OTP sent to ${contact}.` })
  } catch (error) {
    console.error(error)
    return response.status(502).json({ message: 'OTP could not be sent. Check your provider settings.' })
  }
})

app.post('/api/auth/verify-otp', (request, response) => {
  const { contact, otp } = request.body || {}
  const cleanContact = normaliseContact(contact || '')
  const record = otpStore.get(cleanContact)
  if (!record || Date.now() > record.expiresAt || record.attempts >= 5) return response.status(400).json({ message: 'OTP expired. Please request a new one.' })
  record.attempts += 1
  if (record.otp !== String(otp || '').trim()) return response.status(400).json({ message: 'Incorrect OTP.' })
  otpStore.delete(cleanContact)
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { name: record.name, contact: cleanContact })
  return response.json({ token, user: { name: record.name, contact: cleanContact } })
})

app.get('/api/orders', async (request, response) => {
  const session = sessions.get(request.headers.authorization?.replace('Bearer ', ''))
  if (!session) return response.status(401).json({ message: 'Please login again.' })
  const orders = await readOrders()
  return response.json(orders.filter((order) => order.customer.contact === session.contact))
})

app.post('/api/orders', async (request, response) => {
  const session = sessions.get(request.headers.authorization?.replace('Bearer ', ''))
  if (!session) return response.status(401).json({ message: 'Please login again.' })
  const { items, total, address, paymentMethod, phone, email } = request.body || {}
  if (!Array.isArray(items) || items.length === 0 || !address?.trim() || !phone?.trim()) return response.status(400).json({ message: 'Order items, phone and address are required.' })
  const order = { id: Date.now(), createdAt: new Date().toISOString(), customer: { name: session.name, contact: session.contact, phone: phone.trim(), email: email?.trim() || '' }, address: address.trim(), paymentMethod, total, items, status: 'Processing', location: 'Order received' }
  if (ordersCollection) await ordersCollection.doc(String(order.id)).set(order)
  else {
    const orders = await readOrders()
    orders.unshift(order)
    await writeOrders(orders)
  }
  const itemLines = items.map((item) => `${item.name} x ${item.quantity} - ₹${item.price * item.quantity}`).join('\n')
  const ownerMessage = `New Apna Cart order #${order.id}\n\nCustomer: ${session.name}\nContact: ${session.contact}\nPhone: ${phone}\nEmail: ${email || 'Not provided'}\nAddress: ${address}\nPayment: ${paymentMethod}\nTotal: ₹${total}\n\nItems:\n${itemLines}`
  try { await sendEmail(ownerEmail, `New order #${order.id} - Apna Cart`, ownerMessage) } catch (error) { console.error('Owner email failed:', error) }
  return response.status(201).json({ order })
})

app.patch('/api/orders/:id/status', async (request, response) => {
  if (ordersCollection) {
    const reference = ordersCollection.doc(request.params.id)
    const snapshot = await reference.get()
    if (!snapshot.exists) return response.status(404).json({ message: 'Order not found.' })
    await reference.update({ status: request.body?.status, location: request.body?.location })
    return response.json({ order: { id: snapshot.id, ...snapshot.data(), status: request.body?.status, location: request.body?.location } })
  }
  const orders = await readOrders()
  const order = orders.find((item) => String(item.id) === request.params.id)
  if (!order) return response.status(404).json({ message: 'Order not found.' })
  order.status = request.body?.status || order.status
  order.location = request.body?.location || order.location
  await writeOrders(orders)
  return response.json({ order })
})

app.listen(port, () => console.log(`Apna Cart API running at http://localhost:${port}`))
