export const registerSellerProductRoutes = (appOrOptions, maybeOptions) => {
  const app = maybeOptions?.app || appOrOptions?.app || appOrOptions
  const options = maybeOptions ? { ...maybeOptions, app } : { ...(appOrOptions || {}), app }
  const getSession = options.getSession
  const clean = options.clean || ((value) => String(value ?? '').trim())
  const productsCollection = options.productsCollection
  const sellersCollection = options.sellersCollection

  // Seller routes are optional when Firebase is not configured. Never let them
  // prevent the main API (including email OTP) from starting.
  if (!app || typeof app.get !== 'function') return

  const sellerForSession = async (session) => {
    if (!session || !productsCollection || !sellersCollection) return null
    const snapshot = await sellersCollection.where('email', '==', session.contact).limit(1).get()
    return snapshot.empty ? null : { id: snapshot.docs[0].id, data: snapshot.docs[0].data() }
  }

  const ownedProduct = async (session, productId) => {
    const seller = await sellerForSession(session)
    if (!seller) return null
    const ref = productsCollection.doc(productId)
    const snap = await ref.get()
    if (!snap.exists || snap.data().sellerId !== seller.id) return null
    return { ref, product: snap.data(), sellerId: seller.id }
  }

  // Add a new seller product directly to Firestore. The logged-in seller is
  // always taken from the session, so a seller cannot create a product for
  // another seller account.
  app.post('/api/sellers/products', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    try {
      const seller = await sellerForSession(session)
      if (!seller) return response.status(403).json({ message: 'Register as a seller first.' })
      const body = request.body || {}
      const name = clean(body.name)
      const category = clean(body.category)
      const gender = ['Women', 'Men', 'Kids', 'Unisex'].includes(body.gender) ? body.gender : 'Unisex'
      const price = Number(body.price)
      const oldPrice = Number(body.oldPrice || price)
      const stock = Number(body.stock ?? 1)
      const image = clean(body.image)
      const description = clean(body.description)
      const sizes = Array.isArray(body.sizes) ? body.sizes.map(clean).filter(Boolean).slice(0, 20) : []
      const colors = Array.isArray(body.colors) ? body.colors.map(clean).filter(Boolean).slice(0, 20) : []

      if (!name || !category) return response.status(400).json({ message: 'Product name and category are required.' })
      if (!Number.isFinite(price) || price <= 0) return response.status(400).json({ message: 'Valid selling price is required.' })
      if (!Number.isFinite(oldPrice) || oldPrice < price) return response.status(400).json({ message: 'MRP must be greater than or equal to selling price.' })
      if (!Number.isInteger(stock) || stock < 0) return response.status(400).json({ message: 'Valid stock quantity is required.' })
      if (!image) return response.status(400).json({ message: 'Product image URL is required.' })

      const productId = `product_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
      const discount = `${Math.max(0, Math.round((1 - price / Math.max(oldPrice, 1)) * 100))}% OFF`
      const product = {
        id: productId,
        sellerId: seller.id,
        sellerName: clean(seller.data.shopName || seller.data.name),
        name,
        category,
        gender,
        price,
        oldPrice,
        image,
        rating: 0,
        reviews: 0,
        discount,
        description,
        sizes,
        colors,
        stock,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await productsCollection.doc(productId).set(product)
      return response.status(201).json({ product })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Product could not be added.' })
    }
  })

  app.get('/api/sellers/products', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    try {
      const seller = await sellerForSession(session)
      if (!seller) return response.status(403).json({ message: 'Register as a seller first.' })
      const snapshot = await productsCollection.where('sellerId', '==', seller.id).where('status', '==', 'active').get()
      return response.json({ products: snapshot.docs.map(doc => doc.data()) })
    } catch (error) { console.error(error); return response.status(500).json({ message: 'Seller products could not be loaded.' }) }
  })

  app.patch('/api/products/:id', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    try {
      const owned = await ownedProduct(session, request.params.id)
      if (!owned) return response.status(404).json({ message: 'Seller product not found.' })
      const body = request.body || {}, updates = {}
      if (body.name !== undefined) { const v = clean(body.name); if (!v) return response.status(400).json({ message: 'Product name is required.' }); updates.name = v }
      if (body.category !== undefined) { const v = clean(body.category); if (!v) return response.status(400).json({ message: 'Category is required.' }); updates.category = v }
      if (body.gender !== undefined) updates.gender = ['Women', 'Men', 'Kids', 'Unisex'].includes(body.gender) ? body.gender : owned.product.gender
      if (body.price !== undefined) { const v = Number(body.price); if (!Number.isFinite(v) || v <= 0) return response.status(400).json({ message: 'Valid price is required.' }); updates.price = v; const old = Number(body.oldPrice ?? owned.product.oldPrice); updates.oldPrice = old > v ? old : v } else if (body.oldPrice !== undefined) { const old = Number(body.oldPrice); if (Number.isFinite(old)) updates.oldPrice = old > Number(owned.product.price) ? old : Number(owned.product.price) }
      for (const key of ['image', 'description']) if (body[key] !== undefined) updates[key] = String(body[key] || '').trim()
      if (Array.isArray(body.sizes)) updates.sizes = body.sizes.slice(0, 20)
      if (Array.isArray(body.colors)) updates.colors = body.colors.slice(0, 20)
      if (body.stock !== undefined) { const stock = Number(body.stock); if (!Number.isInteger(stock) || stock < 0) return response.status(400).json({ message: 'Valid stock quantity is required.' }); updates.stock = stock }
      if (updates.price !== undefined || updates.oldPrice !== undefined) { const price = Number(updates.price ?? owned.product.price); const old = Number(updates.oldPrice ?? owned.product.oldPrice); updates.discount = `${Math.max(0, Math.round((1 - price / Math.max(old, 1)) * 100))}% OFF` }
      updates.updatedAt = new Date().toISOString()
      await owned.ref.update(updates)
      return response.json({ product: { ...owned.product, ...updates } })
    } catch (error) { console.error(error); return response.status(500).json({ message: 'Product could not be updated.' }) }
  })

  app.delete('/api/products/:id', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    try {
      const owned = await ownedProduct(session, request.params.id)
      if (!owned) return response.status(404).json({ message: 'Seller product not found.' })
      await owned.ref.update({ status: 'deleted', deletedAt: new Date().toISOString() })
      return response.json({ ok: true, id: request.params.id })
    } catch (error) { console.error(error); return response.status(500).json({ message: 'Product could not be deleted.' }) }
  })

  const sellerOrderRows = async (session) => {
    const seller = await sellerForSession(session)
    if (!seller) return null
    const ordersCollection = productsCollection.firestore.collection('orders')
    const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get()
    return {
      seller,
      orders: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(order => Array.isArray(order.items) && order.items.some(item => String(item.sellerId || '') === String(seller.id)))
        .map(order => ({ ...order, items: order.items.filter(item => String(item.sellerId || '') === String(seller.id)) }))
    }
  }

  app.get('/api/sellers/orders', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Seller login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    try { const result = await sellerOrderRows(session); if (!result) return response.status(403).json({ message: 'Register as a seller first.' }); return response.json({ orders: result.orders }) }
    catch (error) { console.error(error); return response.status(500).json({ message: 'Seller orders could not be loaded.' }) }
  })

  app.patch('/api/sellers/orders/:id/status', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Seller login required.' })
    if (!productsCollection || !sellersCollection) return response.status(503).json({ message: 'Seller catalog is not configured yet.' })
    const status = clean(request.body?.status), location = clean(request.body?.location)
    const allowed = new Set(['Processing', 'Accepted', 'Shipped', 'Delivered'])
    if (!allowed.has(status) || !location) return response.status(400).json({ message: 'Valid status and location are required.' })
    try {
      const result = await sellerOrderRows(session)
      if (!result) return response.status(403).json({ message: 'Register as a seller first.' })
      const target = result.orders.find(order => String(order.id) === String(request.params.id))
      if (!target) return response.status(404).json({ message: 'Seller order not found.' })
      const ref = productsCollection.firestore.collection('orders').doc(String(request.params.id))
      const updatedAt = new Date().toISOString()
      await ref.update({ status, location, updatedAt })
      return response.json({ order: { ...target, status, location, updatedAt } })
    } catch (error) { console.error(error); return response.status(500).json({ message: 'Order status could not be updated.' }) }
  })
}
