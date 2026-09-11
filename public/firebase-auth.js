(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  const FALLBACK_CONFIG = {
    apiKey: 'AIzaSyDCMQD18qjREFokYPS-3QabJGUoVc8pPe8M',
    authDomain: 'apna-cart-c60f4.firebaseapp.com',
    projectId: 'apna-cart-c60f4',
    storageBucket: 'apna-cart-c60f4.firebasestorage.app',
    messagingSenderId: '1032583871110',
    appId: '1:1032583871110:web:b2293cc1592cbd80aeaf07',
    measurementId: 'G-Q1TCGCPHTS'
  }
  let readyResolve
  const firebaseReady = new Promise(resolve => { readyResolve = resolve })
  let auth = null
  let firebaseInitError = ''

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = () => reject(new Error('Firebase SDK load nahi hua.'))
      document.head.appendChild(s)
    })
  }

  async function getFirebaseConfig() {
    try {
      const r = await fetch('https://apna-cart-c60f4.firebaseapp.com/__/firebase/init.json', { cache: 'no-store' })
      if (r.ok) {
        const c = await r.json()
        if (c?.apiKey && c?.projectId && c?.appId) return c
      }
    } catch {}
    return FALLBACK_CONFIG
  }

  async function initFirebase() {
    try {
      if (!window.firebase) await loadScript('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
      if (!window.firebase.auth) await loadScript('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth-compat.js')
      const config = await getFirebaseConfig()
      if (!window.firebase.apps.length) window.firebase.initializeApp(config)
      auth = window.firebase.auth()
      try { auth.languageCode = 'en' } catch {}
    } catch (e) {
      firebaseInitError = e?.message || 'Firebase load nahi hua.'
      console.warn('Firebase auth init:', e)
    } finally {
      readyResolve()
    }
  }

  function addStyles() {
    if (document.getElementById('apna-firebase-auth-style')) return
    const s = document.createElement('style')
    s.id = 'apna-firebase-auth-style'
    s.textContent = `#apna-firebase-login{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}#apna-firebase-login .sheet{width:min(100%,520px);max-height:92vh;overflow:auto;background:#fff;border-radius:26px 26px 0 0;padding:22px 20px 28px;box-shadow:0 -10px 35px rgba(0,0,0,.25)}#apna-firebase-login .head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;color:#075d3e}#apna-firebase-login .head h2{margin:0;font-size:24px}#apna-firebase-login .close{border:0;background:#eef6f2;color:#075d3e;width:38px;height:38px;border-radius:50%;font-size:22px}#apna-firebase-login button{cursor:pointer;touch-action:manipulation}#apna-firebase-login .google{width:100%;min-height:50px;border:1px solid #dadce0;background:#fff;border-radius:12px;color:#202124;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:10px}#apna-firebase-login .google b{color:#4285f4;font-size:20px}#apna-firebase-login .or{display:flex;align-items:center;gap:10px;color:#8a9691;margin:16px 0;font-size:13px}#apna-firebase-login .or:before,#apna-firebase-login .or:after{content:'';height:1px;background:#e2e9e6;flex:1}#apna-firebase-login input{width:100%;box-sizing:border-box;min-height:46px;border:1px solid #ccd8d3;border-radius:11px;padding:0 13px;margin:6px 0;font-size:15px;outline:none}#apna-firebase-login .tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 10px}#apna-firebase-login .tabs button{min-height:42px;border:1px solid #d5e1dc;background:#f7faf9;color:#31564a;border-radius:10px;font-weight:700}#apna-firebase-login .tabs button.active{background:#078a58;color:white;border-color:#078a58}#apna-firebase-login .primary{width:100%;min-height:48px;border:0;border-radius:11px;background:#078a58;color:white;font-size:15px;font-weight:800;margin-top:8px}#apna-firebase-login .secondary{width:100%;min-height:46px;border:1px solid #078a58;border-radius:11px;background:white;color:#08794d;font-weight:800;margin-top:8px}#apna-firebase-login .msg{background:#eff8f4;color:#176b50;border-radius:10px;padding:10px;margin-top:10px;font-size:13px;line-height:1.35}`
    document.head.appendChild(s)
  }

  function showLogin() {
    addStyles()
    document.getElementById('apna-firebase-login')?.remove()
    const root = document.createElement('div')
    root.id = 'apna-firebase-login'
    root.innerHTML = `<div class="sheet"><div class="head"><h2>Login / Register</h2><button class="close" type="button">×</button></div><p style="color:#60736b;margin:0 0 12px">Apna Cart par login karke shopping, orders aur Refer & Earn use karein.</p><button class="google" type="button"><b>G</b> Continue with Google</button><div class="or">OR</div><div class="tabs"><button class="active" data-mode="email" type="button">Email OTP</button><button data-mode="phone" type="button">Mobile OTP</button></div><input class="name" placeholder="Full name"><input class="contact" placeholder="Email address"><button class="primary send" type="button">Send OTP</button><input class="otp" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" style="display:none"><button class="secondary verify" type="button" style="display:none">Verify & Login</button><div class="msg" style="display:none"></div></div>`
    document.body.appendChild(root)

    root.querySelector('.close').onclick = () => root.remove()
    root.querySelector('.sheet').addEventListener('click', e => e.stopPropagation())

    let mode = 'email'
    let otpSent = false
    const name = root.querySelector('.name')
    const contact = root.querySelector('.contact')
    const otp = root.querySelector('.otp')
    const send = root.querySelector('.send')
    const verify = root.querySelector('.verify')
    const msg = root.querySelector('.msg')
    const setMsg = text => { msg.textContent = text; msg.style.display = text ? 'block' : 'none' }

    root.querySelectorAll('.tabs button').forEach(button => {
      button.onclick = e => {
        e.preventDefault(); e.stopPropagation()
        mode = button.dataset.mode
        otpSent = false
        otp.style.display = 'none'
        verify.style.display = 'none'
        send.style.display = 'block'
        send.disabled = false
        send.textContent = 'Send OTP'
        root.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('active', x === button))
        contact.value = ''
        contact.type = mode === 'email' ? 'email' : 'tel'
        contact.placeholder = mode === 'email' ? 'Email address' : 'Mobile number'
        setMsg('')
      }
    })

    root.querySelector('.google').onclick = async e => {
      e.preventDefault(); e.stopPropagation()
      const button = root.querySelector('.google')
      button.disabled = true
      button.textContent = 'Opening Google...'
      try {
        await firebaseReady
        if (!auth) throw new Error(firebaseInitError || 'Google login load nahi hua. Firebase configuration check karein.')
        const provider = new window.firebase.auth.GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const result = await auth.signInWithPopup(provider)
        const fu = result?.user || auth.currentUser
        if (!fu) throw new Error('Google account select nahi hua.')
        await finishFirebaseLogin(fu)
      } catch (e) {
        setMsg(e?.message || 'Google login nahi hua.')
        button.disabled = false
        button.innerHTML = '<b>G</b> Continue with Google'
      }
    }

    send.onclick = async e => {
      e.preventDefault(); e.stopPropagation()
      const n = name.value.trim()
      let c = contact.value.trim()
      if (!n) return setMsg('Full name dijiye.')
      if (mode === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return setMsg('Valid email address dijiye.')
      } else {
        const d = c.replace(/\D/g, '')
        if (d.length !== 10) return setMsg('10-digit mobile number dijiye.')
        c = '+91' + d
        contact.value = c
      }
      send.disabled = true
      send.textContent = 'Sending...'
      setMsg('OTP bhejne ki koshish ho rahi hai...')
      try {
        const r = await fetch(`${API}/auth/request-otp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: n, contact: c }) })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.message || `OTP send nahi hua (${r.status}).`)
        otpSent = true
        otp.style.display = 'block'
        verify.style.display = 'block'
        send.style.display = 'none'
        setMsg(`OTP ${mode === 'email' ? 'email' : 'mobile'} par bhej diya gaya.`)
      } catch (e) {
        setMsg(e?.message || 'OTP send nahi hua. Server check karein.')
        send.disabled = false
        send.textContent = 'Send OTP'
      }
    }

    verify.onclick = async e => {
      e.preventDefault(); e.stopPropagation()
      if (!otpSent) return setMsg('Pehle Send OTP dabayein.')
      const c = contact.value.trim()
      const o = otp.value.trim()
      if (!/^\d{6}$/.test(o)) return setMsg('6-digit OTP enter karein.')
      verify.disabled = true
      verify.textContent = 'Verifying...'
      try {
        const r = await fetch(`${API}/auth/verify-otp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contact: c, otp: o }) })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.message || 'OTP verify nahi hua.')
        completeLocalLogin(d)
      } catch (e) {
        setMsg(e?.message || 'OTP verify nahi hua.')
        verify.disabled = false
        verify.textContent = 'Verify & Login'
      }
    }
  }

  async function finishFirebaseLogin(firebaseUser) {
    const idToken = await firebaseUser.getIdToken(true)
    const r = await fetch(`${API}/auth/firebase-google`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.message || 'Google login verify nahi hua.')
    completeLocalLogin(d)
  }

  function completeLocalLogin(d) {
    if (d.token) localStorage.setItem('apna-cart-token', d.token)
    if (d.user) localStorage.setItem('apna-cart-user', JSON.stringify(d.user))
    localStorage.setItem('apna-cart-open-account', '1')
    localStorage.removeItem('apna-cart-login-in-progress')
    document.getElementById('apna-firebase-login')?.remove()
    window.dispatchEvent(new Event('storage'))
    location.reload()
  }

  function isLogin(el) {
    if (!el) return false
    const t = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.toLowerCase().trim()
    return /^(account|login|login \/ register|sign in)$/.test(t) || /open login|login account/.test(t)
  }

  document.addEventListener('click', e => {
    const c = e.target?.closest?.('button,a,[role="button"]')
    if (!c || !isLogin(c) || localStorage.getItem('apna-cart-token')) return
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); showLogin()
  }, true)

  window.addEventListener('apna-cart-open-login', showLogin)
  addStyles()
  initFirebase()
})()
