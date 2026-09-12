export function registerSellerOrderRoutes({ app, getSession, sellersCollection, ordersCollection, readOrders, writeOrders }) {
  const clean = (value) => String(value ?? '').trim()

  async function getSeller(request) {
    const session = getSession(request)
    if (!session || !sellersCollection) return null
    const snapshot = await sellersCollection.where('email', '==', session.contact).limit(1).get()
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  }

  const belongsToSeller = (order, sellerId) => Array.isArray(order?.items) && order.items.some((item) => String(item.sellerId || '') === String(sellerId))

  app.get('/api/sellers/orders', async (request, response) => {
    try {
      const seller = await getSeller(request)
      if (!seller) return response.status(401).json({ message: 'Seller login required.' })
      const orders = ordersCollection
        ? (await ordersCollection.orderBy('createdAt', 'desc').get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        : await readOrders()
      return response.json({ orders: orders.filter((order) => belongsToSeller(order, seller.id)).map((order) => ({
        ...order,
        items: order.items.filter((item) => String(item.sellerId || '') === String(seller.id)),
      })) })
    } catch (error) {
      console.error('Seller orders load failed:', error)
      return response.status(500).json({ message: 'Seller orders could not be loaded.' })
    }
  })

  app.patch('/api/sellers/orders/:id/status', async (request, response) => {
    try {
      const seller = await getSeller(request)
      if (!seller) return response.status(401).json({ message: 'Seller login required.' })
      const status = clean(request.body?.status)
      const location = clean(request.body?.location)
      const allowed = new Set(['Processing', 'Accepted', 'Shipped', 'Delivered'])
      if (!allowed.has(status) || !location) return response.status(400).json({ message: 'Valid status and location are required.' })

      if (ordersCollection) {
        const ref = ordersCollection.doc(String(request.params.id))
        const snapshot = await ref.get()
        if (!snapshot.exists) return response.status(404).json({ message: 'Order not found.' })
        const order = snapshot.data()
        if (!belongsToSeller(order, seller.id)) return response.status(403).json({ message: 'This order does not belong to your shop.' })
        await ref.update({ status, location, updatedAt: new Date().toISOString() })
        return response.json({ order: { id: snapshot.id, ...order, status, location, updatedAt: new Date().toISOString() } })
      }

      const orders = await readOrders()
      const order = orders.find((item) => String(item.id) === String(request.params.id))
      if (!order) return response.status(404).json({ message: 'Order not found.' })
      if (!belongsToSeller(order, seller.id)) return response.status(403).json({ message: 'This order does not belong to your shop.' })
      order.status = status
      order.location = location
      order.updatedAt = new Date().toISOString()
      await writeOrders(orders)
      return response.json({ order })
    } catch (error) {
      console.error('Seller order status update failed:', error)
      return response.status(500).json({ message: 'Order status could not be updated.' })
    }
  })
}
