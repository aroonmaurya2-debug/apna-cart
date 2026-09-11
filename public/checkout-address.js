(() => {
  const KEY = 'apna-cart-saved-addresses'
  const read = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : [] } catch (_) { return [] } }
  const write = x => localStorage.setItem(KEY, JSON.stringify(x.slice(0, 5)))
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  const isCheckout = () => /checkout|delivery|address/i.test(document.body?.innerText || '')
  const findAddressField = () => [...document.querySelectorAll('textarea,input')].find(el => /address|delivery|location/i.test(`${el.getAttribute('name') || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('aria-label') || ''}`))
  function apply(value) {
    const field = findAddressField(); if (!field) return
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set
    setter?.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); field.focus()
  }
  function mount() {
    if (!isCheckout() || document.querySelector('.saved-address-box')) return
    const field = findAddressField(); if (!field) return
    const box = document.createElement('section'); box.className = 'saved-address-box'; box.innerHTML = `<div class="saved-address-head"><strong>📍 Saved Addresses</strong><button type="button" class="saved-address-save">Save current</button></div><div class="saved-address-list"></div>`
    field.parentElement?.insertBefore(box, field)
    const render = () => { const list = box.querySelector('.saved-address-list'); const items = read(); list.innerHTML = items.length ? items.map((a,i) => `<button type="button" class="saved-address-item" data-address-index="${i}">${esc(a)}</button>`).join('') : '<span class="saved-address-empty">No saved address yet</span>' }
    box.querySelector('.saved-address-save')?.addEventListener('click', () => { const value = String(field.value || '').trim(); if (!value) return; const next = [value, ...read().filter(x => x !== value)]; write(next); render() })
    box.addEventListener('click', e => { const btn = e.target.closest?.('[data-address-index]'); if (!btn) return; const value = read()[Number(btn.dataset.addressIndex)]; if (value) apply(value) })
    if (!document.getElementById('saved-address-styles')) { const style = document.createElement('style'); style.id = 'saved-address-styles'; style.textContent = `.saved-address-box{margin:10px 0;padding:12px;border:1px solid #dcebe4;border-radius:14px;background:#f7fbf9}.saved-address-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;color:#183d30}.saved-address-save{border:0;border-radius:9px;padding:7px 10px;background:#078b56;color:#fff;font-weight:700}.saved-address-list{display:flex;flex-direction:column;gap:7px}.saved-address-item{border:1px solid #dcebe4;background:#fff;border-radius:10px;padding:9px;text-align:left;color:#34443d}.saved-address-empty{font-size:13px;color:#728079}`; document.head.appendChild(style) }
    render()
  }
  const observer = new MutationObserver(() => mount())
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { mount(); observer.observe(document.body, { childList:true, subtree:true }) }, { once:true })
  else { mount(); observer.observe(document.body, { childList:true, subtree:true }) }
})()
