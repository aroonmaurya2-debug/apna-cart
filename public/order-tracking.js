(() => {
  const STYLE_ID = 'apna-order-tracking-styles'
  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `.apna-order-progress{margin:12px 0;padding:12px;border:1px solid #d9ebe2;border-radius:14px;background:#f8fcfa}.apna-order-progress-title{font-weight:800;color:#183d30;margin-bottom:10px;font-size:14px}.apna-order-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.apna-order-step{text-align:center;font-size:11px;color:#81908a}.apna-order-dot{width:12px;height:12px;border-radius:50%;background:#c9d8d1;margin:0 auto 5px}.apna-order-step.done{color:#087b50;font-weight:700}.apna-order-step.done .apna-order-dot{background:#07985d;box-shadow:0 0 0 3px #d8f2e6}.apna-order-step.current{color:#087b50;font-weight:800}.apna-order-step.current .apna-order-dot{background:#07985d}.apna-order-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.apna-order-actions button{border:1px solid #b9d9cb;background:#fff;border-radius:9px;padding:7px 10px;font-weight:700;color:#087b50}.apna-order-actions .danger{color:#b3261e;border-color:#f0c5c1}@media(max-width:520px){.apna-order-steps{gap:2px}.apna-order-step{font-size:10px}}`
    document.head.appendChild(style)
  }
  const statusIndex = (text) => {
    const s = String(text || '').toLowerCase()
    if (/cancel|refund|return/.test(s)) return 0
    if (/deliver|complete/.test(s)) return 3
    if (/out for/.test(s)) return 2
    if (/ship|dispatch/.test(s)) return 1
    return 0
  }
  const enhance = () => {
    ensureStyles()
    const candidates = [...document.querySelectorAll('[class*="order"], article, section, .card')]
      .filter(el => /order|delivery|status|₹/.test(el.innerText || '') && !el.querySelector('.apna-order-progress'))
    candidates.slice(0, 12).forEach(card => {
      const text = card.innerText || ''
      if (!/order/i.test(text)) return
      const current = statusIndex(text)
      const box = document.createElement('div')
      box.className = 'apna-order-progress'
      const labels = ['Placed','Shipped','Out for delivery','Delivered']
      box.innerHTML = `<div class="apna-order-progress-title">📦 Order tracking</div><div class="apna-order-steps">${labels.map((label,i) => `<div class="apna-order-step ${i < current ? 'done' : ''} ${i === current ? 'current' : ''}"><div class="apna-order-dot"></div><span>${label}</span></div>`).join('')}</div>`
      if (current < 3) {
        const actions = document.createElement('div')
        actions.className = 'apna-order-actions'
        actions.innerHTML = `<button type="button" data-order-action="help">Need help?</button><button type="button" class="danger" data-order-action="cancel">Cancel order</button>`
        actions.addEventListener('click', e => {
          const action = e.target.closest?.('[data-order-action]')?.dataset.orderAction
          if (!action) return
          if (action === 'cancel') {
            if (confirm('Cancel this order?')) {
              box.querySelector('.apna-order-progress-title').textContent = '❌ Cancellation requested'
              e.target.closest('.apna-order-actions').remove()
            }
          } else {
            alert('Help Centre: please open Account → Help Centre for support.')
          }
        })
        box.appendChild(actions)
      }
      card.appendChild(box)
    })
  }
  const start = () => { enhance(); const observer = new MutationObserver(records => { if (records.some(r => ![...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.apna-order-progress') || n.closest?.('.apna-order-progress'))))) enhance() }); observer.observe(document.body, {childList:true, subtree:true}) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start()
})()
