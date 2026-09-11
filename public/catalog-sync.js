(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  let timer
  let syncing = false
  let catalogById = new Map()
  const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const readCart = () => { try { const x = JSON.parse(localStorage.getItem('apna-cart-cart') || '[]'); return Array.isArray(x) ? x : [] } catch (_) { return [] } }
  const writeCart = cart => { localStorage.setItem('apna-cart-cart', JSON.stringify(cart)); window.dispatchEvent(new CustomEvent('apna-cart-cart-changed', { detail: cart })) }
  const cartCount = () => readCart().reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0)
  function refreshCartUI() {
    const count = cartCount()
    document.querySelectorAll('.cart-head, [aria-label*="Cart"], [title*="Cart"]').forEach(el => {
      const existing = el.querySelector?.('.cart-count-badge'); if (existing) existing.remove()
      if (count > 0 && el instanceof HTMLElement) { const badge = document.createElement('span'); badge.className = 'cart-count-badge'; badge.textContent = count > 99 ? '99+' : String(count); badge.setAttribute('aria-label', `${count} items in cart`); el.appendChild(badge) }
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
  function ensureDetailStyles() {
    if (document.getElementById('catalog-detail-styles')) return
    const style = document.createElement('style'); style.id = 'catalog-detail-styles'; style.textContent = `.catalog-detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:flex-end;justify-content:center}.catalog-detail{background:#fff;width:100%;max-width:620px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px 24px;box-sizing:border-box}.catalog-detail-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.catalog-detail-close{border:0;background:#f1f5f3;border-radius:50%;width:40px;height:40px;font-size:22px}.catalog-detail-img{width:100%;height:min(52vh,430px);object-fit:cover;border-radius:16px}.catalog-detail h2{font-size:22px;margin:14px 0 7px;color:#17211d}.catalog-detail-desc{color:#64736d;line-height:1.5;margin:0 0 12px}.catalog-detail-price{display:flex;gap:10px;align-items:center;margin:8px 0}.catalog-detail-price strong{font-size:24px;color:#078b56}.catalog-detail-price del{color:#8a9690}.catalog-detail-rating{color:#16754f;font-weight:700;margin-bottom:14px}.catalog-detail-actions{display:flex;gap:10px}.catalog-detail-actions button{flex:1;min-height:46px;border-radius:12px;border:0;font-weight:700;font-size:15px}.catalog-detail-add{background:#078b56;color:#fff}.catalog-detail-wish{background:#edf7f2;color:#087b50}.catalog-detail-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.catalog-detail-meta div{background:#f7faf8;padding:10px;border-radius:10px;font-size:13px;color:#52615b}@media(min-width:700px){.catalog-detail-overlay{align-items:center}.catalog-detail{border-radius:22px}}`; document.head.appendChild(style)
  }
  function closeDetail() { document.querySelector('.catalog-detail-overlay')?.remove() }
  function openDetail(id) {
    const p = catalogById.get(Number(id)); if (!p) return
    ensureDetailStyles(); closeDetail()
    const overlay = document.createElement('div'); overlay.className = 'catalog-detail-overlay'; overlay.innerHTML = `<section class="catalog-detail" role="dialog" aria-modal="true"><div class="catalog-detail-top"><strong>Product Details</strong><button class="catalog-detail-close" type="button" aria-label="Close">×</button></div><img class="catalog-detail-img" src="${esc(p.image)}" alt="${esc(p.name)}"><h2>${esc(p.name)}</h2><p class="catalog-detail-desc">${esc(p.description || 'Quality product from Apna Cart.')}</p><div class="catalog-detail-price"><strong>${money(p.price)}</strong><del>${money(p.oldPrice)}</del><span>${esc(p.discount || '')}</span></div><div class="catalog-detail-rating">★ ${Number(p.rating || 0).toFixed(1)} · ${Number(p.reviews || 0).toLocaleString('en-IN')} reviews</div><div class="catalog-detail-meta"><div>Category<br><b>${esc(p.category || 'All Categories')}</b></div><div>Gender<br><b>${esc(p.gender || 'Unisex')}</b></div></div><div class="catalog-detail-actions"><button class="catalog-detail-wish" type="button">♡ Wishlist</button><button class="catalog-detail-add" type="button">🛒 Add to Cart</button></div></section>`
    document.body.appendChild(overlay)
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('.catalog-detail-close')) closeDetail() })
    overlay.querySelector('.catalog-detail-add')?.addEventListener('click', e => addToCart(Number(p.id), e.currentTarget))
    overlay.querySelector('.catalog-detail-wish')?.addEventListener('click', e => { const btn = e.currentTarget; const ids = wishlist(); saveWishlist(ids.includes(Number(p.id)) ? ids.filter(x => x !== Number(p.id)) : [...ids, Number(p.id)]); btn.textContent = wishlist().includes(Number(p.id)) ? '♥ Wishlisted' : '♡ Wishlist' })
  }
  async function sync() {
    if (syncing) return
    const grid = document.querySelector('.product-grid'); if (!grid) return
    const selects = [...document.querySelectorAll('.filter-row select')]; const category = selects[1]?.value || 'All'; const gender = selects[2]?.value || 'All'; const sort = selects[0]?.value || 'relevance'; const q = document.querySelector('.search-box input')?.value?.trim().toLowerCase() || ''
    try {
      const params = new URLSearchParams(); if (category !== 'All') params.set('category', category); if (gender !== 'All') params.set('gender', gender); if (sort !== 'relevance') params.set('sort', sort)
      const res = await fetch(`${API}/products?${params}`); if (!res.ok) throw new Error('catalog'); const data = await res.json(); let items = Array.isArray(data.products) ? data.products : []; if (!items.length) return
      if (q) items = items.filter(p => `${p.name} ${p.category} ${p.gender || ''} ${p.description} ${p.id}`.toLowerCase().includes(q))
      catalogById = new Map(items.map(p => [Number(p.id), p]))
      const html = items.map((p, i) => `<article class="product-card" data-backend-product="${esc(p.id)}"><div class="product-image-wrap"><span class="product-tag">${i % 3 === 0 ? 'Best Seller' : i % 3 === 1 ? 'Top Rated' : 'Trending'}</span><button class="heart" type="button" aria-label="Wishlist">♡</button><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" /></div><div class="product-info"><h3>${esc(p.name)}</h3><p class="product-description">${esc(p.description || 'Quality product from Apna Cart.')}</p><div class="price-row"><strong>${money(p.price)}</strong><del>${money(p.oldPrice)}</del><span class="discount">${esc(p.discount || '')}</span></div><div class="cod">${money(Math.round(Number(p.price || 0) * 1.1))} with COD</div><div class="rating"><b>★ ${Number(p.rating || 0).toFixed(1)}</b> <span>(${Number(p.reviews || 0).toLocaleString('en-IN')})</span></div><button class="add-button" type="button" data-add-backend="${esc(p.id)}">🛒 Add to Cart</button></div></article>`).join('') || '<p class="muted">Is category mein abhi products nahi mile.</p>'
      syncing = true; grid.innerHTML = html; syncing = false; refreshWishlistButtons(); refreshCartUI()
    } catch (_) { syncing = false }
  }
  const boot = () => {
    const observer = new MutationObserver(records => { if (syncing || records.every(r => r.target?.closest?.('.product-grid'))) return; clearTimeout(timer); timer = setTimeout(sync, 180); refreshCartUI() })
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('change', e => { if (e.target.closest?.('.filter-row')) { clearTimeout(timer); timer = setTimeout(sync, 80) } })
    document.addEventListener('input', e => { if (e.target.closest?.('.search-box')) { clearTimeout(timer); timer = setTimeout(sync, 350) } })
    document.addEventListener('click', e => { const heart = e.target.closest?.('.heart'); if (heart) { e.preventDefault(); e.stopPropagation(); toggleWishlist(heart); return }; const add = e.target.closest?.('[data-add-backend]'); if (add) { e.preventDefault(); e.stopPropagation(); addToCart(Number(add.dataset.addBackend), add); return }; const card = e.target.closest?.('.product-card'); if (card && !e.target.closest('button,a,input,select')) { e.preventDefault(); openDetail(Number(card.dataset.backendProduct || card.dataset.productId)) } })
    window.addEventListener('apna-cart-cart-changed', refreshCartUI); sync(); refreshWishlistButtons(); refreshCartUI()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot()
})()
