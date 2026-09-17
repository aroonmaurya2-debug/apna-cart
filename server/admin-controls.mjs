import crypto from 'node:crypto'
import { getAuth } from 'firebase-admin/auth'

const cleanVariants = (value) => Array.isArray(value) ? value.slice(0, 50).map((v, i) => ({ id: String(v?.id || `variant_${i + 1}`), color: String(v?.color || '').trim(), size: String(v?.size || '').trim(), price: Number(v?.price || 0), stock: Number(v?.stock || 0), sku: String(v?.sku || '').trim() })).filter(v => v.color || v.size || v.price || v.stock || v.sku) : []
const productDetails = (body, current = {}) => ({
  images: Array.isArray(body.images) ? body.images.slice(0, 5).map(String) : (current.images || []),
  color: String(body.color ?? current.color ?? '').trim(),
  size: String(body.size ?? current.size ?? '').trim(),
  sku: String(body.sku ?? current.sku ?? '').trim(),
  weight: Number(body.weight ?? current.weight ?? 0) || 0,
  returnDays: Number(body.returnDays ?? current.returnDays ?? 7) || 7,
  variants: cleanVariants(body.variants ?? current.variants)
})

export const registerAdminControlRoutes = (app, options = {}) => {
  const { productsCollection, sellersCollection, getSession, isOwner, readOrders, calculateCommission } = options
  const resolveSession = async (request) => {
    const session = getSession(request)
    if (session) return session
    const token = request.headers.authorization?.replace('Bearer ', '').trim()
    if (!token) return null
    try {
      const decoded = await getAuth().verifyIdToken(token)
      return { name: String(decoded.name || decoded.email || ''), contact: String(decoded.email || '').toLowerCase(), createdAt: Date.now(), firebaseUid: decoded.uid }
    } catch {
      return null
    }
  }
  const ownerOnly = async (request, response) => { const session = await resolveSession(request); if (!isOwner(session)) { response.status(403).json({ message: 'Owner access required.' }); return null } return session }

  app.post('/api/products', async (request, response) => {
    if (!await ownerOnly(request, response)) return
    if (!productsCollection) return response.status(503).json({ message: 'Product database is not configured.' })
    try {
      const body = request.body || {}, name = String(body.name || '').trim(), category = String(body.category || 'All Categories').trim(), gender = ['Women','Men','Kids','Unisex'].includes(body.gender) ? body.gender : 'Unisex', price = Number(body.price), oldPrice = Number(body.oldPrice || price), stock = Number(body.stock ?? 0)
      if (!name || !Number.isFinite(price) || price <= 0) return response.status(400).json({ error: 'Product name and valid price are required.' })
      if (!Number.isFinite(oldPrice) || oldPrice < price) return response.status(400).json({ error: 'Old price must be greater than or equal to price.' })
      if (!Number.isInteger(stock) || stock < 0) return response.status(400).json({ error: 'Valid stock is required.' })
      const id = `product_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`, details = productDetails(body)
      const product = { id, name, category, gender, price, oldPrice, stock, image: String(body.image || details.images[0] || '').trim(), ...details, description: String(body.description || '').trim(), rating: 0, reviews: 0, discount: `${Math.max(0, Math.round((1 - price / Math.max(oldPrice, 1)) * 100))}% OFF`, status: 'active', sellerId: 'owner', sellerName: 'Apna Cart', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      await productsCollection.doc(id).set(product)
      return response.status(201).json({ product })
    } catch (error) { console.error('Owner product create failed:', error); return response.status(500).json({ error: 'Product could not be created.' }) }
  })

  app.put('/api/products/:id', async (request, response) => {
    if (!await ownerOnly(request, response)) return
    if (!productsCollection) return response.status(503).json({ error: 'Product database is not configured.' })
    try {
      const ref = productsCollection.doc(String(request.params.id)), snap = await ref.get()
      if (!snap.exists) return response.status(404).json({ error: 'Product not found.' })
      const current = snap.data() || {}, body = request.body || {}, price = Number(body.price ?? current.price), oldPrice = Number(body.oldPrice ?? current.oldPrice ?? price), stock = Number(body.stock ?? current.stock ?? 0)
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(oldPrice) || oldPrice < price || !Number.isInteger(stock) || stock < 0) return response.status(400).json({ error: 'Invalid price, MRP or stock.' })
      const updates = { name: String(body.name ?? current.name ?? '').trim(), category: String(body.category ?? current.category ?? 'All Categories').trim(), gender: ['Women','Men','Kids','Unisex'].includes(body.gender) ? body.gender : (current.gender || 'Unisex'), price, oldPrice, stock, image: String(body.image ?? current.image ?? '').trim(), description: String(body.description ?? current.description ?? '').trim(), ...productDetails(body, current), discount: `${Math.max(0, Math.round((1 - price / Math.max(oldPrice, 1)) * 100))}% OFF`, updatedAt: new Date().toISOString() }
      if (!updates.name) return response.status(400).json({ error: 'Product name is required.' })
      await ref.set(updates, { merge: true }); return response.json({ product: { ...current, id: ref.id, ...updates } })
    } catch (error) { console.error('Owner product update failed:', error); return response.status(500).json({ error: 'Product could not be updated.' }) }
  })

  app.delete('/api/products/:id', async (request, response) => { if (!await ownerOnly(request, response)) return; if (!productsCollection) return response.status(503).json({ error: 'Product database is not configured.' }); try { const ref = productsCollection.doc(String(request.params.id)), snap = await ref.get(); if (!snap.exists) return response.status(404).json({ error: 'Product not found.' }); await ref.set({ status: 'deleted', deletedAt: new Date().toISOString() }, { merge: true }); return response.json({ ok: true, id: request.params.id }) } catch (error) { console.error('Owner product delete failed:', error); return response.status(500).json({ error: 'Product could not be deleted.' }) } })

  app.get('/api/admin/customers', async (request, response) => { if (!await ownerOnly(request, response)) return; try { const orders = await readOrders(), map = new Map(); for (const order of orders) { const contact = String(order.customerContact || order.contact || order.phone || 'Unknown'), old = map.get(contact) || { contact, name: order.customerName || '', orders: 0, spent: 0, lastOrder: null }; old.orders += 1; old.spent += Number(order.total || 0); old.name = old.name || order.customerName || ''; if (!old.lastOrder || String(order.createdAt || '') > String(old.lastOrder)) old.lastOrder = order.createdAt || null; map.set(contact, old) } return response.json({ customers: [...map.values()].sort((a,b) => b.spent - a.spent) }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Customers could not be loaded.' }) } })

  app.get('/api/admin/controls', async (request, response) => { if (!await ownerOnly(request, response)) return; try { const orders = await readOrders(), products = productsCollection ? (await productsCollection.get()).docs.map(doc => doc.data()) : [], sellers = sellersCollection ? (await sellersCollection.get()).docs.map(doc => doc.data()) : [], revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0), commissionRate = 10, commission = calculateCommission ? orders.reduce((sum, o) => sum + calculateCommission(Number(o.total || 0), commissionRate).commission, 0) : revenue * commissionRate / 100; return response.json({ controls: { products: products.length, activeProducts: products.filter(p => p.status === 'active').length, orders: orders.length, sellers: sellers.length, customers: new Set(orders.map(o => o.customerContact || o.contact || o.phone)).size, revenue, commission, commissionRate } }) } catch (error) { console.error(error); return response.status(500).json({ message: 'Control data could not be loaded.' }) } })
}
