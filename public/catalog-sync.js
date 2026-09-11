(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  let timer
  let syncing = false
  const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const readCart = () => { try { const x = JSON.parse(localStorage.getItem('apna-cart-cart') || '[]'); return Array.isArray(x) ? x : [] } catch (_) { return [] } }
  const writeCart = cart => { localStorage.setItem('apna-cart-cart', JSON.stringify(cart)); window.dispatchEvent(new CustomEvent('apna-cart-cart-changed', { detail: cart })) }
  const cartCount = () => readCart().reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0)
  function refreshCartUI() {
    const count = cartCount()
    document.querySelectorAll('.cart-head, [aria-label*="Cart"], [title*="Cart"]').forEach(el => {
      const existing = el.querySelector?.('.cart-count-badge')
      if (existing) existing.remove()
      if (count > 0 && el instanceof HTMLElement) {
        const badge = document.createElement('span'); badge.className = 'cart-count-badge'; badge.textContent = count > 99 ? '99+' : String(count); badge.setAttribute('aria-label', `${count} items in cart`); el.appendChild(badge)
      }
    })
  }
  function addToCart(id, button) {
    const cart = readCart(); const found = cart.find(x => Number(x.productId) === id)
    if (found) found.quantity = Number(found.quantity || 0) + 1; else cart.push({ productId: id, quantity: 1 })
    writeCart(cart); refreshCartUI()
    if (button) { button.textContent = '✓ Added to Cart'; button.classList.add('added'); setTimeout(() => { button.textContent = '🛒 Add to Cart'; button.classList.remove('added') }, 900) }
  }
  function wishlist() { try { return JSON.parse(localStorage.getItem('apna-cart-wishlist') || '[]').map(Number) } catch (_) { return [] } }
  function saveWishlist(ids) { const next = [...new Set(ids.map(Number))]; localStorage.setItem('apna-cart-wishlist', JSON.stringify(next)); window.dispatchEvent(new CustomEvent('apna-cart-wishlist-changed', { detail: next })) }
  function refreshWishlistButtons() { const ids = wishlist(); document.querySelectorAll('.heart').forEach(btn => { const card = btn.closest('.product-card'); const id = Number(card?.dataset.backendProduct || card?.dataset.productId || 0); if (!id) return; const active = ids.includes(id); btn.classList.toggle('wishlisted', active); btn.textContent = active ? '♥' : '♡'; btn.setAttribute('aria-pressed', String(active)) }) }
  function toggleWishlist(btn) { const card = btn.closest('.product-card'); const id = Number(card?.dataset.backendProduct || card?.dataset.productId || 0); if (!id) return; const ids = wishlist(); saveWishlist(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); refreshWishlistButtons() }
  async function sync() {
    if (syncing) return
    const grid = document.querySelector('.product-grid'); if (!grid) return
    const selects = [...document.querySelectorAll('.filter-row select')]; const category = selects[1]?.value || 'All'; const gender = selects[2]?.value || 'All'; const sort = selects[0]?.value || 'relevance'; const q = document.querySelector('.search-box input')?.value?.trim().toLowerCase() || ''
    try {
      const params = new URLSearchParams(); if (category !== 'All') params.set('category', category); if (gender !== 'All') params.set('gender', gender); if (sort !== 'relevance') params.set('sort', sort)
      const res = await fetch(`${API}/products?${params}`); if (!res.ok) throw new Error('catalog'); const data = await res.json(); let items = Array.isArray(data.products) ? data.products : []; if (!items.length) return
      if (q) items = items.filter(p => `${p.name} ${p.category} ${p.gender || ''} ${p.description} ${p.id}`.toLowerCase().includes(q))
      const html = items.map((p, i) => `<article class="product-card" data-backend-product="${esc(p.id)}"><div class="product-image-wrap"><span class="product-tag">${i % 3 === 0 ? 'Best Seller' : i % 3 === 1 ? 'Top Rated' : 'Trending'}</span><button class="heart" type="button" aria-label="Wishlist">♡</button><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" /></div><div class="product-info"><h3>${esc(p.name)}</h3><p class="product-description">${esc(p.description || 'Quality product from Apna Cart.')}</p><div class="price-row"><strong>${money(p.price)}</strong><del>${money(p.oldPrice)}</del><span class="discount">${esc(p.discount || '')}</span></div><div class="cod">${money(Math.round(Number(p.price || 0) * 1.1))} with COD</div><div class="rating"><b>★ ${Number(p.rating || 0).toFixed(1)}</b> <span>(${Number(p.reviews || 0).toLocaleString('en-IN')})</span></div><button class="add-button" type="button" data-add-backend="${esc(p.id)}">🛒 Add to Cart</button></div></article>`).join('') || '<p class="muted">Is category mein abhi products nahi mile.</p>'
      syncing = true; grid.innerHTML = html; syncing = false; refreshWishlistButtons(); refreshCartUI()
    } catch (_) { syncing = false }
  }
  const boot = () => {
    const observer = new MutationObserver(records => { if (syncing || records.every(r => r.target?.closest?.('.product-grid'))) return; clearTimeout(timer); timer = setTimeout(sync, 180); refreshCartUI() })
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('change', e => { if (e.target.closest?.('.filter-row')) { clearTimeout(timer); timer = setTimeout(sync, 80) } })
    document.addEventListener('input', e => { if (e.target.closest?.('.search-box')) { clearTimeout(timer); timer = setTimeout(sync, 350) } })
    document.addEventListener('click', e => { const heart = e.target.closest?.('.heart'); if (heart) { e.preventDefault(); e.stopPropagation(); toggleWishlist(heart); return }; const add = e.target.closest?.('[data-add-backend]'); if (add) { e.preventDefault(); e.stopPropagation(); addToCart(Number(add.dataset.addBackend), add) } })
    window.addEventListener('apna-cart-cart-changed', refreshCartUI); sync(); refreshWishlistButtons(); refreshCartUI()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot()
})()
