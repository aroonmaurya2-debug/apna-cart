export const registerOrderControlRoutes = (app, options = {}) => {
  const { ordersCollection, getSession, isOwner, readOrders, writeOrders } = options
  const save = async (id, updates) => {
    if (ordersCollection) {
      const ref = ordersCollection.doc(String(id))
      const snap = await ref.get()
      if (!snap.exists) return null
      await ref.set(updates, { merge: true })
      return { ...snap.data(), ...updates, id: ref.id }
    }
    const orders = await readOrders()
    const index = orders.findIndex(o => String(o.id) === String(id))
    if (index < 0) return null
    orders[index] = { ...orders[index], ...updates }
    await writeOrders(orders)
    return orders[index]
  }

  app.post('/api/orders/:id/cancel', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Please login first.' })
    try {
      const orders = await readOrders()
      const order = orders.find(o => String(o.id) === String(request.params.id))
      if (!order) return response.status(404).json({ message: 'Order not found.' })
      if (!isOwner(session) && order.customerContact !== session.contact) return response.status(403).json({ message: 'You cannot cancel this order.' })
      if (!['placed', 'pending', 'confirmed'].includes(String(order.status))) return response.status(400).json({ message: 'This order can no longer be cancelled.' })
      const updated = await save(order.id, {
        status: 'cancelled',
        cancelReason: String(request.body?.reason || 'Customer requested cancellation').trim(),
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return response.json({ order: updated })
    } catch (error) {
      console.error('Order cancel failed:', error)
      return response.status(500).json({ message: 'Order could not be cancelled.' })
    }
  })

  app.post('/api/orders/:id/return', async (request, response) => {
    const session = getSession(request)
    if (!session) return response.status(401).json({ message: 'Please login first.' })
    try {
      const orders = await readOrders()
      const order = orders.find(o => String(o.id) === String(request.params.id))
      if (!order) return response.status(404).json({ message: 'Order not found.' })
      if (order.customerContact !== session.contact && !isOwner(session)) return response.status(403).json({ message: 'You cannot request a return for this order.' })
      if (!['delivered', 'completed'].includes(String(order.status))) return response.status(400).json({ message: 'Return is available after delivery.' })
      if (order.returnStatus === 'requested' || order.returnStatus === 'approved') return response.status(400).json({ message: 'Return request already exists.' })
      const reason = String(request.body?.reason || '').trim()
      if (!reason) return response.status(400).json({ message: 'Return reason is required.' })
      const updated = await save(order.id, {
        returnStatus: 'requested',
        returnReason: reason,
        returnRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return response.json({ order: updated })
    } catch (error) {
      console.error('Return request failed:', error)
      return response.status(500).json({ message: 'Return request could not be submitted.' })
    }
  })

  app.get('/api/admin/returns', async (request, response) => {
    const session = getSession(request)
    if (!isOwner(session)) return response.status(403).json({ message: 'Owner access required.' })
    try {
      const orders = await readOrders()
      return response.json({ returns: orders.filter(o => o.returnStatus) })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Returns could not be loaded.' })
    }
  })

  app.put('/api/admin/orders/:id/return', async (request, response) => {
    const session = getSession(request)
    if (!isOwner(session)) return response.status(403).json({ message: 'Owner access required.' })
    const returnStatus = String(request.body?.returnStatus || '').trim()
    if (!['approved', 'rejected', 'picked_up', 'refunded'].includes(returnStatus)) return response.status(400).json({ message: 'Invalid return status.' })
    try {
      const orders = await readOrders()
      const order = orders.find(o => String(o.id) === String(request.params.id))
      if (!order || !order.returnStatus) return response.status(404).json({ message: 'Return request not found.' })
      const updates = { returnStatus, returnUpdatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      if (returnStatus === 'refunded') updates.refundStatus = 'completed'
      const updated = await save(order.id, updates)
      return response.json({ order: updated })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Return status could not be updated.' })
    }
  })
}
