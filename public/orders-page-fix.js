(() => {
  const readLocal = () => { try { const v = JSON.parse(localStorage.getItem('apna-cart-local-orders') || '[]'); return Array.isArray(v) ? v : [] } catch (_) { return [] } }
  const user = () => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || 'null') } catch (_) { return null } }
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`
  const css = () => {
    if (document.getElementById('ac-orders-style')) return
    const s = document.createElement('style'); s.id = 'ac-orders-style'; s.textContent = `
      .ac-cancel-modal{position:fixed;inset:0;z-index:25010;background:#0008;display:grid;place-items:center;padding:20px}.ac-cancel-dialog{background:#fff;color:#10251e;width:min(100%,420px);border-radius:18px;padding:20px;box-shadow:0 15px 50px #0003}.ac-cancel-dialog h2{margin:0 0 8px;font-size:20px}.ac-cancel-dialog p{color:#62766d;font-size:14px;margin:0 0 15px}.ac-cancel-dialog select{width:100%;padding:13px;border:1px solid #cadbd2;border-radius:10px;background:#fff;font-size:15px;color:#10251e}.ac-cancel-actions{display:flex;gap:10px;margin-top:18px}.ac-cancel-actions button{flex:1;padding:12px;border-radius:10px;font-weight:800;border:0}.ac-cancel-keep{background:#edf4f0;color:#244438}.ac-cancel-confirm{background:#b3261e;color:#fff}.ac-cancel-confirm:disabled{opacity:.5}
      #ac-orders-page{position:fixed;inset:0;z-index:25000;background:#f5fbf8;color:#10251e;font-family:Arial,sans-serif;overflow:auto}
      #ac-orders-page *{box-sizing:border-box}.ac-orders-top{background:linear-gradient(145deg,#075c3f,#078a58);color:#fff;padding:16px 18px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:2;box-shadow:0 4px 14px #064f3830}.ac-orders-back{border:0;background:transparent;color:#fff;font-size:35px;width:40px}.ac-orders-top h1{font-size:23px;margin:0;flex:1}.ac-orders-count{font-size:13px;background:#ffffff22;border:1px solid #ffffff55;padding:7px 10px;border-radius:18px}
      .ac-orders-body{max-width:760px;margin:auto;padding:16px 15px 35px}.ac-order-card{background:#fff;border:1px solid #dcebe4;border-radius:17px;padding:15px;margin-bottom:13px;box-shadow:0 2px 8px #164b3815}.ac-order-head{display:flex;gap:10px;align-items:center}.ac-order-icon{width:45px;height:45px;border-radius:50%;background:#e3f8ed;display:grid;place-items:center;font-size:23px}.ac-order-id{flex:1}.ac-order-id strong{display:block;font-size:16px}.ac-order-id small{color:#6b7f77}.ac-status{background:#e3f8ed;color:#08794d;border-radius:16px;padding:6px 9px;font-size:12px;font-weight:800}.ac-order-items{margin:13px 0;border-top:1px solid #edf2ef;border-bottom:1px solid #edf2ef;padding:10px 0}.ac-item{display:flex;gap:10px;padding:7px 0}.ac-item img{width:52px;height:52px;border-radius:9px;object-fit:cover;background:#eef6f2}.ac-item-main{flex:1}.ac-item-main strong{display:block;font-size:14px}.ac-item-main small{display:block;color:#6c7e77;margin-top:4px}.ac-total{display:flex;justify-content:space-between;font-weight:800;font-size:16px}.ac-cancel-order{margin-top:12px;border:1px solid #e7aaa5;background:#fff5f4;color:#b3261e;border-radius:10px;padding:10px 14px;font-weight:800;width:100%}.ac-cancel-order:disabled{opacity:.6}.ac-order-meta{margin-top:10px;color:#63776f;font-size:13px;line-height:1.55}.ac-empty{background:#fff;border:1px solid #dcebe4;border-radius:18px;text-align:center;padding:50px 20px}.ac-empty-icon{font-size:55px;margin-bottom:12px}.ac-empty h2{margin:0 0 8px}.ac-empty p{color:#6b7f77}.ac-shop{border:0;background:#078a58;color:#fff;border-radius:23px;padding:12px 22px;font-weight:800;margin-top:10px}
    `; document.head.appendChild(s)
  }
  const getOrders = async () => {
    let local = readLocal(); const u = user();
    try {
      if (u?.contact) {
        const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-auth-token') || ''
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const apiBase = location.hostname === 'localhost' ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
        const r = await fetch(apiBase + '/orders?contact=' + encodeURIComponent(u.contact), { headers })
        const d = await r.json().catch(() => ({}))
        if (r.ok && Array.isArray(d.orders)) {
          const seen = new Set(local.map(o => String(o?.id)))
          local = [...d.orders, ...local.filter(o => !seen.has(String(o?.id)))]
        }
      }
    } catch (_) {}
    return local
  }
  const selectCancelReason = (orderId) => new Promise(resolve => {
    const reasons = [
      'Ordered by mistake',
      'I no longer need the product',
      'Delivery is taking too long',
      'The product price is too high',
      'I want to order a different product',
      'Payment issue',
      'Incorrect address or contact details',
      'Other'
    ]
    document.getElementById('ac-cancel-modal')?.remove()
    const modal = document.createElement('div')
    modal.id = 'ac-cancel-modal'; modal.className = 'ac-cancel-modal'
    modal.innerHTML = '<div class="ac-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="ac-cancel-title"><h2 id="ac-cancel-title">Cancel Order #' + esc(orderId) + '</h2><p>Please select a reason for cancellation:</p><select aria-label="Cancellation reason"><option value="">Select a reason</option>' + reasons.map(r => '<option value="' + esc(r) + '">' + esc(r) + '</option>').join('') + '</select><div class="ac-cancel-actions"><button type="button" class="ac-cancel-keep">Go Back</button><button type="button" class="ac-cancel-confirm" disabled>Cancel Order</button></div></div>'
    document.body.appendChild(modal)
    const select = modal.querySelector('select'), confirmButton = modal.querySelector('.ac-cancel-confirm')
    select.onchange = () => { confirmButton.disabled = !select.value }
    const finish = value => { modal.remove(); resolve(value) }
    modal.querySelector('.ac-cancel-keep').onclick = () => finish(null)
    confirmButton.onclick = () => finish(select.value || null)
    modal.onclick = e => { if (e.target === modal) finish(null) }
    select.focus()
  })
  const render = (orders) => {
    const page = document.getElementById('ac-orders-page'); if (!page) return
    page.querySelector('.ac-orders-count').textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`
    const body = page.querySelector('.ac-orders-body')
    if (!orders.length) { body.innerHTML = `<div class="ac-empty"><div class="ac-empty-icon">📦</div><h2>No orders yet</h2><p>Your placed orders will appear here.</p><button class="ac-shop">Continue Shopping</button></div>`; body.querySelector('.ac-shop').onclick = () => page.remove(); return }
    body.innerHTML = orders.map(o => {
      const items = Array.isArray(o.items) ? o.items : []
      return `<article class="ac-order-card"><div class="ac-order-head"><div class="ac-order-icon">📦</div><div class="ac-order-id"><strong>Order #${esc(o.id)}</strong><small>${o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : 'Recently placed'}</small></div><span class="ac-status">${esc(o.status || 'Placed')}</span></div><div class="ac-order-items">${items.length ? items.map(i => `<div class="ac-item">${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div style="width:52px;height:52px;border-radius:9px;background:#eef6f2;display:grid;place-items:center">🛍️</div>'}<div class="ac-item-main"><strong>${esc(i.name || 'Product')}</strong><small>Qty: ${esc(i.quantity || 1)} · ${money(i.price)}</small></div></div>`).join('') : '<div class="ac-item-main">Order items</div>'}</div><div class="ac-total"><span>Total</span><span>${money(o.total)}</span></div><div class="ac-order-meta">📍 ${esc(o.address || o.location || 'Address not available')}<br>📱 ${esc(o.phone || '')}<br>💳 ${esc(o.paymentMethod || 'Cash on Delivery')}</div>${['placed','pending','confirmed'].includes(String(o.status || 'placed').toLowerCase()) ? '<button class="ac-cancel-order" type="button" data-cancel-order="' + esc(o.id) + '">Cancel Order</button>' : ''}</article>`
    }).join('')
    body.querySelectorAll('[data-cancel-order]').forEach(button => {
      button.onclick = async () => {
        const order = orders.find(o => String(o.id) === String(button.dataset.cancelOrder))
        if (!order) return
        const status = String(order.status || 'placed').toLowerCase()
        if (!['placed', 'pending', 'confirmed'].includes(status)) { alert('Yeh order ab cancel nahi ho sakta.'); return }
        const reason = await selectCancelReason(order.id)
        if (!reason) return
        button.disabled = true; button.textContent = 'Cancelling…'
        try {
          const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-auth-token') || ''
          if (!token) {
            button.disabled = false; button.textContent = 'Cancel Order'
            if (typeof window.openAccountLogin === 'function') window.openAccountLogin()
            else alert('Your login session is missing. Please log in again, then retry cancelling this order.')
            return
          }
          const base = location.hostname === 'localhost' ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
          const response = await fetch(base + '/orders/' + encodeURIComponent(order.id) + '/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ reason }) })
          const data = await response.json().catch(() => ({}))
          if (response.status === 401) {
            localStorage.removeItem('apna-cart-token')
            localStorage.removeItem('apna-cart-auth-token')
            button.disabled = false; button.textContent = 'Cancel Order'
            if (typeof window.openAccountLogin === 'function') window.openAccountLogin()
            else alert('Your login session has expired. Please log in again, then retry cancelling this order.')
            return
          }
          if (!response.ok) throw new Error(data.message || 'Order could not be cancelled. Please try again.')
          order.status = data.order?.status || 'cancelled'
          try { const saved = JSON.parse(localStorage.getItem('apna-cart-local-orders') || '[]'); localStorage.setItem('apna-cart-local-orders', JSON.stringify(saved.map(o => String(o.id) === String(order.id) ? { ...o, status: order.status } : o))) } catch (_) {}
          render(orders); alert('Your order has been cancelled successfully.')
        } catch (error) { alert(error.message || 'Order could not be cancelled. Please try again.'); button.disabled = false; button.textContent = 'Cancel Order' }
      }
    })
  }
  const open = async () => {
    css(); document.getElementById('ac-orders-page')?.remove(); document.getElementById('ac-account')?.remove()
    const page = document.createElement('div'); page.id = 'ac-orders-page'; page.innerHTML = `<div class="ac-orders-top"><button class="ac-orders-back">‹</button><h1>My Orders</h1><span class="ac-orders-count">Loading…</span></div><div class="ac-orders-body"><div class="ac-empty"><div class="ac-empty-icon">⏳</div><h2>Loading orders…</h2><p>Please wait.</p></div></div>`
    document.body.appendChild(page); page.querySelector('.ac-orders-back').onclick = () => page.remove(); render(await getOrders())
  }
  const isOrdersTarget = (target) => {
    if (!target) return false
    if (target.closest?.('[data-a="orders"]')) return true
    const nav = target.closest?.('.bottom-nav, nav, [class*="bottom-nav"]')
    if (!nav) return false
    const item = target.closest?.('button, a, [role="button"]')
    if (!item) return false
    const text = `${item.textContent || ''} ${item.getAttribute?.('aria-label') || ''} ${item.getAttribute?.('title') || ''}`.toLowerCase().replace(/\s+/g, ' ').trim()
    return /\bmy orders\b|\border(?:s)?\b/.test(text)
  }
  document.addEventListener('click', (e) => {
    const target = e.target?.closest?.('button, a, [role="button"], [data-a="orders"]') || e.target
    if (!isOrdersTarget(target)) return
    e.preventDefault(); e.stopImmediatePropagation(); open()
  }, true)
  window.apnaCartOpenOrders = open
})()
