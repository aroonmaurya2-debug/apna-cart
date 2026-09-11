(() => {
  const STYLE_ID = 'apna-order-tracking-styles'
  const API = location.hostname === 'localhost' ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `.apna-order-progress{margin:12px 0;padding:12px;border:1px solid #d9ebe2;border-radius:14px;background:#f8fcfa}.apna-order-progress-title{font-weight:800;color:#183d30;margin-bottom:10px;font-size:14px}.apna-order-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.apna-order-step{text-align:center;font-size:11px;color:#81908a}.apna-order-dot{width:12px;height:12px;border-radius:50%;background:#c9d8d1;margin:0 auto 5px}.apna-order-step.done{color:#087b50;font-weight:700}.apna-order-step.done .apna-order-dot{background:#07985d;box-shadow:0 0 0 3px #d8f2e6}.apna-order-step.current{color:#087b50;font-weight:800}.apna-order-step.current .apna-order-dot{background:#07985d}.apna-order-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.apna-order-actions button{border:1px solid #b9d9cb;background:#fff;border-radius:9px;padding:7px 10px;font-weight:700;color:#087b50}.apna-order-actions .danger{color:#b3261e;border-color:#f0c5c1}.apna-order-message{margin-top:8px;font-size:12px;color:#52635b}@media(max-width:520px){.apna-order-steps{gap:2px}.apna-order-step{font-size:10px}}`
    document.head.appendChild(style)
  }
  const token = () => localStorage.getItem('apna-cart-token') || ''
  const statusIndex = text => { const s = String(text || '').toLowerCase(); if (/cancel/.test(s)) return 0; if (/deliver|complete/.test(s)) return 3; if (/out for/.test(s)) return 2; if (/ship|dispatch/.test(s)) return 1; return 0 }
  const orderId = text => { const match = String(text || '').match(/order\s*#?\s*(\d{5,})/i); return match?.[1] || '' }
  const api = async (id, action, reason) => { const response = await fetch(`${API}/orders/${encodeURIComponent(id)}/${action}`, { method:'POST', headers:{'Content-Type':'application/json', ...(token() ? { Authorization:`Bearer ${token()}` } : {})}, body: JSON.stringify({ reason }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Request failed'); return data }
  const enhance = () => {
    ensureStyles()
    const candidates = [...document.querySelectorAll('[class*="order"], article, section, .card')].filter(el => /order|delivery|status|₹/.test(el.innerText || '') && !el.querySelector('.apna-order-progress'))
    candidates.slice(0, 12).forEach(card => {
      const text = card.innerText || ''; if (!/order/i.test(text)) return
      const id = orderId(text); const current = statusIndex(text)
      const box = document.createElement('div'); box.className = 'apna-order-progress'
      const labels = ['Placed','Shipped','Out for delivery','Delivered']
      box.innerHTML = `<div class="apna-order-progress-title">📦 Order tracking</div><div class="apna-order-steps">${labels.map((label,i) => `<div class="apna-order-step ${i < current ? 'done' : ''} ${i === current ? 'current' : ''}"><div class="apna-order-dot"></div><span>${label}</span></div>`).join('')}</div>`
      const actions = document.createElement('div'); actions.className = 'apna-order-actions'
      if (current < 3 && id) actions.insertAdjacentHTML('beforeend', '<button type="button" class="danger" data-order-action="cancel">Cancel order</button>')
      if (current === 3 && id) actions.insertAdjacentHTML('beforeend', '<button type="button" class="danger" data-order-action="return">Return order</button><button type="button" data-order-action="refund">Request refund</button>')
      if (!id) actions.insertAdjacentHTML('beforeend', '<button type="button" data-order-action="help">Need help?</button>')
      if (actions.children.length) box.appendChild(actions)
      const message = document.createElement('div'); message.className = 'apna-order-message'; box.appendChild(message)
      actions.addEventListener('click', async e => {
        const action = e.target.closest?.('[data-order-action]')?.dataset.orderAction; if (!action) return
        if (action === 'help') return alert('Help Centre: please open Account → Help Centre for support.')
        if (!confirm(action === 'cancel' ? 'Cancel this order?' : action === 'return' ? 'Request a return for this order?' : 'Request a refund for this order?')) return
        const button = e.target.closest('[data-order-action]'); button.disabled = true
        try {
          const reason = action === 'cancel' ? 'Customer requested cancellation' : action === 'return' ? 'Customer requested return' : 'Customer requested refund'
          const data = await api(id, action, reason)
          message.textContent = action === 'cancel' ? 'Cancellation requested successfully.' : action === 'return' ? 'Return request submitted. We will review it.' : `Refund request submitted for ₹${Number(data.order?.total || 0).toLocaleString('en-IN')}.`
          if (action === 'cancel') { box.querySelector('.apna-order-progress-title').textContent = '❌ Order cancelled'; button.parentElement.remove() }
          else button.textContent = action === 'return' ? 'Return requested' : 'Refund requested'
        } catch (error) { message.textContent = error?.message || 'Request failed. Please try again.'; button.disabled = false }
      })
      card.appendChild(box)
    })
  }
  const start = () => { enhance(); const observer = new MutationObserver(records => { if (records.some(r => ![...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.apna-order-progress') || n.closest?.('.apna-order-progress'))))) enhance() }); observer.observe(document.body, { childList:true, subtree:true }) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start()
})()
