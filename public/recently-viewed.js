(() => {
  const KEY = 'apna-cart-recently-viewed'
  const read = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : [] } catch (_) { return [] } }
  const save = x => localStorage.setItem(KEY, JSON.stringify(x.slice(0, 8)))
  const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const style = () => {
    if (document.getElementById('recent-viewed-styles')) return
    const s = document.createElement('style'); s.id = 'recent-viewed-styles'; s.textContent = `.recently-viewed{margin:18px 0 8px;padding:0 2px}.recently-viewed-title{font-size:18px;font-weight:800;margin:0 0 10px;color:#173d30}.recently-viewed-row{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none}.recently-viewed-row::-webkit-scrollbar{display:none}.recent-card{flex:0 0 138px;background:#fff;border:1px solid #e4eee9;border-radius:14px;padding:8px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.05)}.recent-card img{width:100%;height:118px;object-fit:cover;border-radius:10px;display:block}.recent-card strong{display:block;font-size:13px;margin:7px 2px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#25352f}.recent-card span{display:block;font-size:13px;font-weight:800;color:#078b56;margin:0 2px 2px}`; document.head.appendChild(s)
  }
  const render = () => {
    const grid = document.querySelector('.product-grid'); if (!grid) return
    const items = read(); style(); let section = document.querySelector('.recently-viewed')
    if (!items.length) { section?.remove(); return }
    if (!section) { section = document.createElement('section'); section.className = 'recently-viewed'; grid.parentElement?.insertBefore(section, grid) }
    section.innerHTML = `<h2 class="recently-viewed-title">Recently Viewed</h2><div class="recently-viewed-row">${items.map(p => `<article class="recent-card" data-recent-id="${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"><strong>${esc(p.name)}</strong><span>${money(p.price)}</span></article>`).join('')}</div>`
  }
  const rememberFromCard = card => {
    const id = Number(card?.dataset.backendProduct || card?.dataset.productId || 0); if (!id) return
    const img = card.querySelector('img'); const name = card.querySelector('h3')?.textContent?.trim(); const price = Number((card.querySelector('.price-row strong')?.textContent || '').replace(/[^0-9.]/g, ''))
    if (!name || !img?.src) return
    save([{ id, name, image: img.src, price }, ...read().filter(x => Number(x.id) !== id)]); render()
  }
  const boot = () => {
    document.addEventListener('click', e => {
      const recent = e.target.closest?.('.recent-card'); if (recent) { const id = Number(recent.dataset.recentId); document.querySelector(`[data-backend-product="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
      const card = e.target.closest?.('.product-card'); if (card && !e.target.closest('button,a,input,select')) rememberFromCard(card)
    })
    const observer = new MutationObserver(() => render()); observer.observe(document.body, { childList: true, subtree: true })
    render()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot()
})()
