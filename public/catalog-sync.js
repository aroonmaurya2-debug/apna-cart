(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  let timer
  let syncing = false
  const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const genderOf = p => p.gender || (p.category === 'Men' || /\bmen'?s?\b/i.test(p.name) ? 'Men' : p.category === 'Kids' || /\bkids?\b/i.test(p.name) ? 'Kids' : 'Unisex')

  async function sync() {
    if (syncing) return
    const grid = document.querySelector('.product-grid')
    if (!grid) return
    const selects = [...document.querySelectorAll('.filter-row select')]
    const category = selects[1]?.value || 'All'
    const gender = selects[2]?.value || 'All'
    const sort = selects[0]?.value || 'relevance'
    const q = document.querySelector('.search-box input')?.value?.trim().toLowerCase() || ''
    try {
      const params = new URLSearchParams()
      if (category !== 'All') params.set('category', category)
      if (gender !== 'All') params.set('gender', gender)
      if (sort !== 'relevance') params.set('sort', sort)
      const res = await fetch(`${API}/products?${params}`)
      if (!res.ok) throw new Error('catalog')
      const data = await res.json()
      let items = Array.isArray(data.products) ? data.products : []
      if (!items.length) return
      if (q) items = items.filter(p => `${p.name} ${p.category} ${p.gender || ''} ${p.description} ${p.id}`.toLowerCase().includes(q))
      const html = items.map((p, i) => `<article class="product-card" data-backend-product="${esc(p.id)}"><div class="product-image-wrap"><span class="product-tag">${i % 3 === 0 ? 'Best Seller' : i % 3 === 1 ? 'Top Rated' : 'Trending'}</span><button class="heart" type="button" aria-label="Wishlist">♡</button><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" /></div><div class="product-info"><h3>${esc(p.name)}</h3><p class="product-description">${esc(p.description || 'Quality product from Apna Cart.')}</p><div class="price-row"><strong>${money(p.price)}</strong><del>${money(p.oldPrice)}</del><span class="discount">${esc(p.discount || '')}</span></div><div class="cod">${money(Math.round(Number(p.price || 0) * 1.1))} with COD</div><div class="rating"><b>★ ${Number(p.rating || 0).toFixed(1)}</b> <span>(${Number(p.reviews || 0).toLocaleString('en-IN')})</span></div><button class="add-button" type="button" data-add-backend="${esc(p.id)}">🛒 Add to Cart</button></div></article>`).join('') || '<p class="muted">Is category mein abhi products nahi mile.</p>'
      syncing = true
      grid.innerHTML = html
      syncing = false
      grid.querySelectorAll('[data-add-backend]').forEach(btn => btn.addEventListener('click', () => {
        const id = Number(btn.dataset.addBackend)
        const cart = JSON.parse(localStorage.getItem('apna-cart-cart') || '[]')
        const found = cart.find(x => Number(x.productId) === id)
        if (found) found.quantity += 1; else cart.push({ productId: id, quantity: 1 })
        localStorage.setItem('apna-cart-cart', JSON.stringify(cart))
        btn.textContent = '✓ Added to Cart'
        setTimeout(() => { btn.textContent = '🛒 Add to Cart' }, 900)
      }))
    } catch (_) {
      syncing = false
      /* Keep the existing frontend catalog if backend is unavailable. */
    }
  }

  const boot = () => {
    const observer = new MutationObserver(records => {
      // Ignore mutations created by replacing the product grid itself.
      if (syncing || records.every(r => r.target?.closest?.('.product-grid'))) return
      clearTimeout(timer)
      timer = setTimeout(sync, 180)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('change', e => { if (e.target.closest?.('.filter-row')) { clearTimeout(timer); timer = setTimeout(sync, 80) } })
    document.addEventListener('input', e => { if (e.target.closest?.('.search-box')) { clearTimeout(timer); timer = setTimeout(sync, 350) } })
    sync()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot()
})()
