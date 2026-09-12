(() => {
  'use strict'
  const API = '/api/sellers/orders'
  const token = () => localStorage.getItem('apna-cart-auth-token') || localStorage.getItem('apna-cart-token') || ''
  const api = (url, options = {}) => fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) } }).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw Error(d.message || `Request failed (${r.status})`); return d })
  const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]))
  const style = () => {
    if (document.getElementById('seller-orders-css')) return
    const s = document.createElement('style'); s.id = 'seller-orders-css'; s.textContent = `.som-empty{padding:20px;text-align:center;color:#6b7d75;border:1px dashed #cfe1d8;border-radius:14px}.som-card{border:1px solid #dcebe4;border-radius:14px;padding:12px;margin:9px 0;background:#fff}.som-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.som-id{font-weight:900;color:#17352a}.som-total{font-weight:900;color:#087a49}.som-meta{font-size:12px;color:#718078;margin-top:3px}.som-items{margin:10px 0;padding:8px;background:#f6fbf8;border-radius:10px}.som-item{font-size:13px;padding:4px 0;border-bottom:1px solid #e7f0eb}.som-item:last-child{border-bottom:0}.som-actions{display:flex;gap:7px;margin-top:10px}.som-actions button{flex:1;border:1px solid #087a49;background:#fff;color:#087a49;border-radius:9px;padding:9px;font-weight:800}.som-actions .active{background:#087a49;color:#fff}.som-location{margin-top:8px;width:100%;box-sizing:border-box;padding:9px;border:1px solid #d0e2d8;border-radius:9px}.som-sync{font-size:12px;color:#087a49;margin:6px 0 10px}`; document.head.appendChild(s)
  }
  const render = async () => {
    style()
    try {
      const d = await api(API)
      const orders = Array.isArray(d.orders) ? d.orders : []
      const list = orders.length ? orders.map((o) => `<div class="som-card"><div class="som-head"><div class="som-id">Order #${esc(o.id)}</div><div class="som-total">${money(o.total)}</div></div><div class="som-meta">${esc(o.customer?.name || 'Customer')} · ${esc(o.customer?.phone || o.customer?.contact || '')}</div><div class="som-meta">${esc(o.address || 'Address not available')}</div><div class="som-items">${(o.items || []).map(i => `<div class="som-item">${esc(i.name)} × ${esc(i.quantity || 1)} — ${money(Number(i.price || 0) * Number(i.quantity || 1))}</div>`).join('')}</div><div class="som-meta">Current: <b>${esc(o.status || 'Processing')}</b> · ${esc(o.location || 'Order received')}</div><input class="som-location" data-location="${esc(o.id)}" placeholder="Delivery location" value="${esc(o.location || 'Order received')}"><div class="som-actions">${['Processing','Accepted','Shipped','Delivered'].map(st => `<button data-status="${esc(st)}" data-order="${esc(o.id)}" class="${o.status===st?'active':''}">${st}</button>`).join('')}</div></div>`).join('') : '<div class="som-empty">Abhi seller ke liye koi order nahi hai.</div>'
      return modal('Seller Orders', `<div class="som-sync">✓ Seller order management connected</div>${list}`, (m) => {
        m.querySelectorAll('[data-status]').forEach((b) => b.onclick = async () => {
          const id = b.dataset.order, location = m.querySelector(`[data-location="${CSS.escape(id)}"]`)?.value.trim() || 'Order received'
          try { await api(`${API}/${encodeURIComponent(id)}/status`, { method:'PATCH', body:JSON.stringify({ status:b.dataset.status, location }) }); await renderInto(m) } catch (e) { alert(e.message) }
        })
      })
    } catch (e) {
      return modal('Seller Orders', `<div class="som-empty">${esc(e.message || 'Seller orders load nahi hue.')}</div>`)
    }
  }
  const renderInto = async (m) => { const replacement = await render(); m.remove(); return replacement }
  const modal = (title, body, done) => { style(); const m=document.createElement('div'); m.className='ac-modal'; m.innerHTML=`<section class="ac-sheet"><h3>${title}</h3>${body}<button class="ac-secondary som-close">Close</button></section>`; document.body.appendChild(m); m.querySelector('.som-close').onclick=()=>m.remove(); done?.(m); return m }
  document.addEventListener('click', (e) => { const b=e.target?.closest?.('.seller-tile[data-s="orders"]'); if(!b)return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); render() }, true)
})()
