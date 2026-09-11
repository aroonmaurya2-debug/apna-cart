(() => {
  const KEY = 'apna-cart-notifications'
  const MAX = 40
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch (_) { return [] } }
  const save = items => localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
  const add = (title, body, type = 'info') => {
    const items = read()
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, title, body, type, read: false, createdAt: new Date().toISOString() }
    save([item, ...items])
    window.dispatchEvent(new CustomEvent('apna-cart-notifications-changed'))
    return item
  }
  const ensureBell = () => {
    if (document.querySelector('.apna-notification-bell')) return
    const buttons = [...document.querySelectorAll('button')]
    const cart = buttons.find(b => /cart/i.test(b.textContent || ''))
    const bell = document.createElement('button')
    bell.className = 'apna-notification-bell'
    bell.type = 'button'
    bell.setAttribute('aria-label', 'Notifications')
    bell.innerHTML = '🔔<span class="apna-notification-badge" hidden>0</span>'
    if (cart?.parentElement) cart.parentElement.insertBefore(bell, cart)
    else document.body.appendChild(bell)
    bell.addEventListener('click', openPanel)
    updateBadge()
  }
  const updateBadge = () => {
    const badge = document.querySelector('.apna-notification-badge')
    if (!badge) return
    const count = read().filter(x => !x.read).length
    badge.textContent = String(Math.min(count, 99))
    badge.hidden = count === 0
  }
  const openPanel = () => {
    let panel = document.querySelector('.apna-notification-panel')
    if (panel) { panel.remove(); return }
    panel = document.createElement('div'); panel.className = 'apna-notification-panel'
    const items = read()
    panel.innerHTML = `<div class="apna-notification-head"><strong>Notifications</strong><button class="apna-notification-close">×</button></div><div class="apna-notification-list">${items.length ? items.map(x => `<article class="apna-notification ${x.read ? 'is-read' : ''}"><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.body)}</p><small>${new Date(x.createdAt).toLocaleString('en-IN')}</small></article>`).join('') : '<div class="apna-notification-empty">No new notifications</div>'}</div><button class="apna-notification-clear">Mark all as read</button>`
    document.body.appendChild(panel)
    panel.querySelector('.apna-notification-close').onclick = () => panel.remove()
    panel.querySelector('.apna-notification-clear').onclick = () => { save(read().map(x => ({ ...x, read: true }))); updateBadge(); panel.remove(); openPanel() }
    save(read().map(x => ({ ...x, read: true }))); updateBadge()
  }
  const escapeHtml = value => String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))
  const styles = document.createElement('style')
  styles.textContent = `.apna-notification-bell{position:relative;border:0;background:transparent;font-size:21px;cursor:pointer;padding:7px;margin:0 3px}.apna-notification-badge{position:absolute;top:0;right:0;min-width:17px;height:17px;border-radius:9px;background:#e53935;color:#fff;font:700 10px/17px Arial;text-align:center}.apna-notification-panel{position:fixed;z-index:99999;top:62px;right:12px;width:min(360px,calc(100vw - 24px));max-height:70vh;overflow:hidden;background:#fff;border:1px solid #d7e8df;border-radius:16px;box-shadow:0 12px 35px #0003;color:#183d30}.apna-notification-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#edf9f2;border-bottom:1px solid #d7e8df}.apna-notification-head button{border:0;background:transparent;font-size:24px}.apna-notification-list{max-height:52vh;overflow:auto}.apna-notification{padding:13px 16px;border-bottom:1px solid #edf1ee}.apna-notification b{font-size:14px}.apna-notification p{margin:4px 0;font-size:13px;color:#4d5c55}.apna-notification small{color:#84918b;font-size:10px}.apna-notification.is-read{opacity:.72}.apna-notification-clear{width:100%;border:0;padding:12px;background:#fff;color:#07985d;font-weight:700}.apna-notification-empty{padding:35px 15px;text-align:center;color:#84918b}@media(max-width:600px){.apna-notification-panel{top:58px;right:8px;width:calc(100vw - 16px)}}`
  document.head.appendChild(styles)
  window.apnaNotify = { add }
  window.addEventListener('apna-cart-notifications-changed', updateBadge)
  const boot = () => { ensureBell(); if (!read().length) add('Welcome to Apna Cart', 'Your order, return and seller updates will appear here.') }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot()
})()
