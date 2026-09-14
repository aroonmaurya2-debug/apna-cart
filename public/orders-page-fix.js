(() => {
  const readLocal = () => { try { const v = JSON.parse(localStorage.getItem('apna-cart-local-orders') || '[]'); return Array.isArray(v) ? v : [] } catch (_) { return [] } }
  const user = () => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || 'null') } catch (_) { return null } }
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`
  const css = () => {
    if (document.getElementById('ac-orders-style')) return
    const s = document.createElement('style'); s.id = 'ac-orders-style'; s.textContent = `
      #ac-orders-page{position:fixed;inset:0;z-index:25000;background:#f5fbf8;color:#10251e;font-family:Arial,sans-serif;overflow:auto}
      #ac-orders-page *{box-sizing:border-box}.ac-orders-top{background:linear-gradient(145deg,#075c3f,#078a58);color:#fff;padding:16px 18px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:2;box-shadow:0 4px 14px #064f3830}.ac-orders-back{border:0;background:transparent;color:#fff;font-size:35px;width:40px}.ac-orders-top h1{font-size:23px;margin:0;flex:1}.ac-orders-count{font-size:13px;background:#ffffff22;border:1px solid #ffffff55;padding:7px 10px;border-radius:18px}
      .ac-orders-body{max-width:760px;margin:auto;padding:16px 15px 35px}.ac-order-card{background:#fff;border:1px solid #dcebe4;border-radius:17px;padding:15px;margin-bottom:13px;box-shadow:0 2px 8px #164b3815}.ac-order-head{display:flex;gap:10px;align-items:center}.ac-order-icon{width:45px;height:45px;border-radius:50%;background:#e3f8ed;display:grid;place-items:center;font-size:23px}.ac-order-id{flex:1}.ac-order-id strong{display:block;font-size:16px}.ac-order-id small{color:#6b7f77}.ac-status{background:#e3f8ed;color:#08794d;border-radius:16px;padding:6px 9px;font-size:12px;font-weight:800}.ac-order-items{margin:13px 0;border-top:1px solid #edf2ef;border-bottom:1px solid #edf2ef;padding:10px 0}.ac-item{display:flex;gap:10px;padding:7px 0}.ac-item img{width:52px;height:52px;border-radius:9px;object-fit:cover;background:#eef6f2}.ac-item-main{flex:1}.ac-item-main strong{display:block;font-size:14px}.ac-item-main small{display:block;color:#6c7e77;margin-top:4px}.ac-total{display:flex;justify-content:space-between;font-weight:800;font-size:16px}.ac-order-meta{margin-top:10px;color:#63776f;font-size:13px;line-height:1.55}.ac-empty{background:#fff;border:1px solid #dcebe4;border-radius:18px;text-align:center;padding:50px 20px}.ac-empty-icon{font-size:55px;margin-bottom:12px}.ac-empty h2{margin:0 0 8px}.ac-empty p{color:#6b7f77}.ac-shop{border:0;background:#078a58;color:#fff;border-radius:23px;padding:12px 22px;font-weight:800;margin-top:10px}
    `; document.head.appendChild(s)
  }
  const getOrders = async () => {
    let local = readLocal(); const u = user();
    try {
      if (u?.contact) {
        const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-auth-token') || ''
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const r = await fetch(`/api/orders?contact=${encodeURIComponent(u.contact)}`, { headers })
        const d = await r.json().catch(() => ({}))
        if (r.ok && Array.isArray(d.orders)) {
          const seen = new Set(local.map(o => String(o?.id)))
          local = [...d.orders, ...local.filter(o => !seen.has(String(o?.id)))]
        }
      }
    } catch (_) {}
    return local
  }
  const render = (orders) => {
    const page = document.getElementById('ac-orders-page'); if (!page) return
    page.querySelector('.ac-orders-count').textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`
    const body = page.querySelector('.ac-orders-body')
    if (!orders.length) { body.innerHTML = `<div class="ac-empty"><div class="ac-empty-icon">📦</div><h2>No orders yet</h2><p>Your placed orders will appear here.</p><button class="ac-shop">Continue Shopping</button></div>`; body.querySelector('.ac-shop').onclick = () => page.remove(); return }
    body.innerHTML = orders.map(o => {
      const items = Array.isArray(o.items) ? o.items : []
      return `<article class="ac-order-card"><div class="ac-order-head"><div class="ac-order-icon">📦</div><div class="ac-order-id"><strong>Order #${esc(o.id)}</strong><small>${o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : 'Recently placed'}</small></div><span class="ac-status">${esc(o.status || 'Placed')}</span></div><div class="ac-order-items">${items.length ? items.map(i => `<div class="ac-item">${i.image ? `<img src="${esc(i.image)}" alt="">` : '<div style="width:52px;height:52px;border-radius:9px;background:#eef6f2;display:grid;place-items:center">🛍️</div>'}<div class="ac-item-main"><strong>${esc(i.name || 'Product')}</strong><small>Qty: ${esc(i.quantity || 1)} · ${money(i.price)}</small></div></div>`).join('') : '<div class="ac-item-main">Order items</div>'}</div><div class="ac-total"><span>Total</span><span>${money(o.total)}</span></div><div class="ac-order-meta">📍 ${esc(o.address || o.location || 'Address not available')}<br>📱 ${esc(o.phone || '')}<br>💳 ${esc(o.paymentMethod || 'Cash on Delivery')}</div></article>`
    }).join('')
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
