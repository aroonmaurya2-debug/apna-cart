(() => {
  const KEY = 'apna-cart-profile-photo'
  const STYLE_ID = 'apna-cart-profile-photo-style'
  const PANEL_ID = 'apna-cart-profile-photo-panel'

  function loggedIn() {
    try { return !!localStorage.getItem('apna-cart-token') || !!localStorage.getItem('apna-cart-user') } catch { return false }
  }

  function getPhoto() {
    try { return localStorage.getItem(KEY) || '' } catch { return '' }
  }

  function savePhoto(data) {
    try { localStorage.setItem(KEY, data) } catch { alert('Photo save nahi ho payi. Thodi chhoti photo select karein.') }
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #apna-profile-avatar { position:fixed; top:72px; left:12px; z-index:9998; width:42px; height:42px; border-radius:50%; border:2px solid #08794d; background:#e9f7f1; overflow:hidden; padding:0; box-shadow:0 3px 12px rgba(0,0,0,.16); display:flex; align-items:center; justify-content:center; cursor:pointer; }
      #apna-profile-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
      #apna-profile-avatar span { font-size:20px; color:#08794d; font-weight:800; }
      #${PANEL_ID} { position:fixed; inset:0; z-index:10001; background:rgba(0,0,0,.45); display:flex; align-items:flex-end; justify-content:center; }
      #${PANEL_ID} .profile-photo-sheet { width:min(100%,520px); background:#fff; border-radius:24px 24px 0 0; padding:24px 20px 30px; box-shadow:0 -8px 30px rgba(0,0,0,.2); text-align:center; font-family:Arial,sans-serif; }
      #${PANEL_ID} .profile-photo-preview { width:104px; height:104px; margin:4px auto 14px; border-radius:50%; overflow:hidden; border:3px solid #0b8a59; background:#e9f7f1; display:flex; align-items:center; justify-content:center; }
      #${PANEL_ID} .profile-photo-preview img { width:100%; height:100%; object-fit:cover; }
      #${PANEL_ID} .profile-photo-preview span { font-size:44px; color:#08794d; font-weight:800; }
      #${PANEL_ID} h3 { margin:4px 0 6px; color:#075d3e; font-size:22px; }
      #${PANEL_ID} p { margin:0 0 18px; color:#66746f; font-size:14px; }
      #${PANEL_ID} .profile-photo-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      #${PANEL_ID} button { min-height:46px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; }
      #${PANEL_ID} .choose { border:0; background:#078a58; color:white; }
      #${PANEL_ID} .remove { border:1px solid #0b8a59; background:white; color:#08794d; }
      #${PANEL_ID} .close { width:100%; margin-top:10px; border:0; background:#f1f4f3; color:#35534a; }
      @media(max-width:430px){ #apna-profile-avatar{top:67px;left:9px;width:38px;height:38px} #${PANEL_ID} .profile-photo-sheet{padding-bottom:24px} }
    `
    document.head.appendChild(style)
  }

  function openPanel() {
    if (!loggedIn()) {
      const candidates = [...document.querySelectorAll('button, a')]
      const login = candidates.find(el => /login|sign in|account/i.test((el.textContent || '').trim()))
      if (login) { login.click(); return }
      alert('Pehle login karein, phir profile photo laga sakte hain.')
      return
    }
    document.getElementById(PANEL_ID)?.remove()
    const panel = document.createElement('div')
    panel.id = PANEL_ID
    const photo = getPhoto()
    panel.innerHTML = `<div class="profile-photo-sheet"><div class="profile-photo-preview">${photo ? `<img src="${photo}" alt="Profile photo">` : '<span>👤</span>'}</div><h3>Profile Photo</h3><p>Apne account par profile photo lagayein.</p><div class="profile-photo-actions"><button class="choose" type="button">📷 Choose Photo</button><button class="remove" type="button">Remove Photo</button></div><button class="close" type="button">Close</button><input class="profile-photo-input" type="file" accept="image/*" hidden></div>`
    document.body.appendChild(panel)
    const input = panel.querySelector('.profile-photo-input')
    panel.querySelector('.choose').addEventListener('click', () => input.click())
    panel.querySelector('.remove').addEventListener('click', () => { try { localStorage.removeItem(KEY) } catch {} panel.remove(); renderAvatar() })
    panel.querySelector('.close').addEventListener('click', () => panel.remove())
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove() })
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) return alert('Sirf image select karein.')
      if (file.size > 5 * 1024 * 1024) return alert('Photo 5 MB se chhoti honi chahiye.')
      const reader = new FileReader()
      reader.onload = () => { savePhoto(String(reader.result)); panel.remove(); renderAvatar() }
      reader.readAsDataURL(file)
    })
  }

  function renderAvatar() {
    if (!loggedIn()) { document.getElementById('apna-profile-avatar')?.remove(); return }
    addStyles()
    let avatar = document.getElementById('apna-profile-avatar')
    if (!avatar) {
      avatar = document.createElement('button')
      avatar.id = 'apna-profile-avatar'
      avatar.type = 'button'
      avatar.title = 'Profile Photo'
      avatar.setAttribute('aria-label', 'Set profile photo')
      avatar.addEventListener('click', openPanel)
      document.body.appendChild(avatar)
    }
    const photo = getPhoto()
    avatar.innerHTML = photo ? `<img src="${photo}" alt="Profile">` : '<span>👤</span>'
  }

  function watch() {
    renderAvatar()
    let timer = 0
    new MutationObserver(() => { clearTimeout(timer); timer = window.setTimeout(renderAvatar, 250) }).observe(document.body, { childList:true, subtree:true })
    window.addEventListener('storage', renderAvatar)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch)
  else watch()
})()
