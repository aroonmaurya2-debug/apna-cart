(() => {
  const ID = 'apna-login-access'
  const STYLE = 'apna-login-access-style'

  function isLoggedIn() {
    try { return !!localStorage.getItem('apna-cart-token') || !!localStorage.getItem('apna-cart-user') } catch { return false }
  }

  function openLogin() {
    const account = [...document.querySelectorAll('button')].find(b => /^(account|login|register)$/i.test((b.textContent || '').trim()))
    if (account) account.click()
    else window.dispatchEvent(new CustomEvent('apna-cart-open-login'))
  }

  function addStyle() {
    if (document.getElementById(STYLE)) return
    const s = document.createElement('style')
    s.id = STYLE
    s.textContent = `
      #${ID}{position:fixed;right:10px;top:76px;z-index:9996;border:1px solid #bfe8d4;border-radius:22px;background:#fff;color:#08794d;font-weight:800;font-size:12px;padding:9px 13px;box-shadow:0 4px 14px rgba(0,80,50,.12);cursor:pointer}
      #${ID}:active{transform:scale(.97)}
      @media(max-width:430px){#${ID}{top:72px;right:9px;font-size:11px;padding:8px 11px}}
    `
    document.head.appendChild(s)
  }

  function render() {
    const old = document.getElementById(ID)
    if (isLoggedIn()) { old?.remove(); return }
    addStyle()
    if (old) return
    const b = document.createElement('button')
    b.id = ID
    b.type = 'button'
    b.textContent = 'Login / Register'
    b.setAttribute('aria-label', 'Login or Register')
    b.addEventListener('click', openLogin)
    document.body.appendChild(b)
  }

  function init() {
    render()
    let timer = 0
    new MutationObserver(() => { clearTimeout(timer); timer = window.setTimeout(render, 200) }).observe(document.body, { childList:true, subtree:true })
    window.addEventListener('storage', render)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
