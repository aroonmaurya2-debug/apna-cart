(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  let mounted = false
  const token = () => localStorage.getItem('apna-cart-token') || ''
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const isSellerScreen = () => /seller|supplier hub|sell on apna cart/i.test(document.body?.innerText || '')
  const mount = async () => {
    if (mounted || !isSellerScreen() || !token()) return
    const host = document.querySelector('.marketplace-overlay, .marketplace-menu, .account-overlay, body')
    if (!host) return
    mounted = true
    const box = document.createElement('section')
    box.className = 'inventory-panel'
    box.innerHTML = '<div class="inventory-head"><div><strong>📦 Inventory & Stock</strong><small>Manage stock for your products</small></div><button type="button" class="inventory-refresh">↻</button></div><div class="inventory-list"><div class="inventory-loading">Loading stock…</div></div>'
    if (host === document.body) document.body.appendChild(box); else host.appendChild(box)
    if (!document.getElementById('inventory-panel-styles')) {
      const style = document.createElement('style'); style.id = 'inventory-panel-styles'; style.textContent = `.inventory-panel{margin:12px 0;padding:14px;border:1px solid #d7e8df;border-radius:16px;background:#f7fbf9;color:#183d30;box-shadow:0 8px 24px rgba(24,61,48,.06)}.inventory-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.inventory-head strong{display:block;font-size:16px}.inventory-head small{display:block;color:#718078;margin-top:3px}.inventory-refresh{border:0;border-radius:9px;background:#078b56;color:#fff;font-size:18px;width:38px;height:38px}.inventory-list{display:grid;gap:8px;margin-top:12px}.inventory-row{display:grid;grid-template-columns:1fr 84px 62px;align-items:center;gap:8px;padding:10px;background:#fff;border:1px solid #e2ece7;border-radius:12px}.inventory-name{font-weight:700;font-size:14px}.inventory-meta{font-size:12px;color:#738078;margin-top:3px}.inventory-stock{width:100%;box-sizing:border-box;padding:8px;border:1px solid #cfddd6;border-radius:9px}.inventory-save{border:0;border-radius:9px;padding:9px 7px;background:#078b56;color:#fff;font-weight:700}.inventory-low{color:#b35a00}.inventory-out{color:#c62828}.inventory-loading,.inventory-empty{color:#738078;font-size:13px;padding:8px}@media(max-width:520px){.inventory-row{grid-template-columns:1fr 74px 58px}.inventory-name{font-size:13px}.inventory-save{font-size:12px}}`; document.head.appendChild(style)
    }
    const list = box.querySelector('.inventory-list')
    const load = async () => {
      list.innerHTML = '<div class="inventory-loading">Loading stock…</div>'
      try {
        const res = await fetch(`${API}/inventory`, { headers: { Authorization: `Bearer ${token()}` } })
        const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || 'Inventory unavailable')
        const products = Array.isArray(data.products) ? data.products : []
        if (!products.length) { list.innerHTML = '<div class="inventory-empty">No products found. Publish a product first.</div>'; return }
        list.innerHTML = products.map(p => { const stock = Number(p.stock ?? 10); const cls = stock === 0 ? 'inventory-out' : stock <= 5 ? 'inventory-low' : ''; return `<div class="inventory-row"><div><div class="inventory-name">${esc(p.name)}</div><div class="inventory-meta ${cls}">${stock === 0 ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : `${stock} in stock`}</div></div><input class="inventory-stock" type="number" min="0" max="100000" value="${stock}" data-stock-id="${esc(p.id)}"><button class="inventory-save" type="button" data-save-stock="${esc(p.id)}">Save</button></div>` }).join('')
      } catch (error) { list.innerHTML = `<div class="inventory-empty">${esc(error.message || 'Inventory unavailable')}</div>` }
    }
    list.addEventListener('click', async e => {
      const button = e.target.closest?.('[data-save-stock]'); if (!button) return
      const id = button.dataset.saveStock; const input = list.querySelector(`[data-stock-id="${CSS.escape(id)}"]`); const stock = Number(input?.value)
      if (!Number.isInteger(stock) || stock < 0) return
      button.disabled = true; button.textContent = '…'
      try { const res = await fetch(`${API}/inventory/${encodeURIComponent(id)}`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token()}`}, body:JSON.stringify({ stock }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || 'Could not update stock'); button.textContent = 'Saved'; setTimeout(() => { button.textContent = 'Save' }, 900) } catch (error) { button.textContent = 'Retry'; alert(error.message || 'Stock update failed') } finally { button.disabled = false }
    })
    box.querySelector('.inventory-refresh')?.addEventListener('click', load)
    await load()
  }
  const observer = new MutationObserver(() => { if (!document.querySelector('.inventory-panel')) { mounted = false; mount() } })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { mount(); observer.observe(document.body,{childList:true,subtree:true}) }, { once:true })
  else { mount(); observer.observe(document.body,{childList:true,subtree:true}) }
})()
