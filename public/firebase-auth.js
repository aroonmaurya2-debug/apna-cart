(() => {
  const API = 'https://apna-cart-2rcq.onrender.com/api'
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDCMQD18qjREFokYPS-3QabJGUoVc8pPeM',
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

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async function initFirebase() {
    try {
      if (!window.firebase) await loadScript('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js')
      if (!window.firebase.auth) await loadScript('https://www.gstatic.com/firebasejs/12.18.0/firebase-auth-compat.js')
      if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG)
      auth = window.firebase.auth()
      try { auth.languageCode = 'en' } catch {}
      const redirectResult = await auth.getRedirectResult()
      if (redirectResult?.user) await finishFirebaseLogin(redirectResult.user)
    } catch (error) {
      console.warn('Firebase auth init:', error)
    } finally {
      readyResolve()
    }
  }

  function addStyles() {
    if (document.getElementById('apna-firebase-auth-style')) return
    const style = document.createElement('style')
    style.id = 'apna-firebase-auth-style'
    style.textContent = `
      #apna-firebase-login { position:fixed; inset:0; z-index:10050; background:rgba(0,0,0,.5); display:flex; align-items:flex-end; justify-content:center; font-family:Arial,sans-serif; }
      #apna-firebase-login .sheet { width:min(100%,520px); max-height:92vh; overflow:auto; background:#fff; border-radius:26px 26px 0 0; padding:22px 20px 28px; box-shadow:0 -10px 35px rgba(0,0,0,.25); }
      #apna-firebase-login .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; color:#075d3e; }
      #apna-firebase-login .head h2 { margin:0; font-size:24px; }
      #apna-firebase-login .close { border:0; background:#eef6f2; color:#075d3e; width:38px; height:38px; border-radius:50%; font-size:22px; }
      #apna-firebase-login .google { width:100%; min-height:50px; border:1px solid #dadce0; background:#fff; border-radius:12px; color:#202124; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; gap:10px; }
      #apna-firebase-login .google b { color:#4285f4; font-size:20px; }
      #apna-firebase-login .or { display:flex; align-items:center; gap:10px; color:#8a9691; margin:16px 0; font-size:13px; }
      #apna-firebase-login .or:before,#apna-firebase-login .or:after { content:''; height:1px; background:#e2e9e6; flex:1; }
      #apna-firebase-login input { width:100%; box-sizing:border-box; min-height:46px; border:1px solid #ccd8d3; border-radius:11px; padding:0 13px; margin:6px 0; font-size:15px; outline:none; }
      #apna-firebase-login input:focus { border-color:#078a58; box-shadow:0 0 0 2px rgba(8,137,88,.12); }
      #apna-firebase-login .tabs { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0 10px; }
      #apna-firebase-login .tabs button { min-height:42px; border:1px solid #d5e1dc; background:#f7faf9; color:#31564a; border-radius:10px; font-weight:700; }
      #apna-firebase-login .tabs button.active { background:#078a58; color:white; border-color:#078a58; }
      #apna-firebase-login .primary { width:100%; min-height:48px; border:0; border-radius:11px; background:#078a58; color:white; font-size:15px; font-weight:800; margin-top:8px; }
      #apna-firebase-login .secondary { width:100%; min-height:46px; border:1px solid #078a58; border-radius:11px; background:white; color:#08794d; font-weight:800; margin-top:8px; }
      #apna-firebase-login .msg { background:#eff8f4; color:#176b50; border-radius:10px; padding:10px; margin-top:10px; font-size:13px; line-height:1.35; }
      #apna-firebase-login .small { color:#71817b; font-size:12px; line-height:1.4; text-align:center; margin:12px 0 0; }
    `
    document.head.appendChild(style)
  }

  function showLogin() {
    addStyles()
    document.getElementById('apna-firebase-login')?.remove()
    const root = document.createElement('div')
    root.id = 'apna-firebase-login'
    root.innerHTML = `<div class="sheet"><div class="head"><h2>Login / Register</h2><button class="close" type="button">×</button></div><p style="color:#60736b;margin:0 0 12px">Apna Cart par login karke shopping, orders aur Refer & Earn use karein.</p><button class="google" type="button"><b>G</b> Continue with Google</button><div class="or">OR</div><div class="tabs"><button class="active" data-mode="email" type="button">Email OTP</button><button data-mode="phone" type="button">Mobile OTP</button></div><input class="name" placeholder="Full name" autocomplete="name"><input class="contact" placeholder="Email address" autocomplete="email"><button class="primary send" type="button">Send OTP</button><input class="otp" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" style="display:none"><button class="secondary verify" type="button" style="display:none">Verify & Login</button><div class="msg" style="display:none"></div><p class="small">Google sign-in Firebase se secure authentication use karta hai. Email/Mobile OTP aapke existing Apna Cart OTP system se aayega.</p></div>`
    document.body.appendChild(root)

    const close = () => root.remove()
    root.querySelector('.close').addEventListener('click', close)
    root.addEventListener('click', event => { if (event.target === root) close() })

    let mode = 'email'
    let otpSent = false
    const nameInput = root.querySelector('.name')
    const contactInput = root.querySelector('.contact')
    const otpInput = root.querySelector('.otp')
    const sendButton = root.querySelector('.send')
    const verifyButton = root.querySelector('.verify')
    const msg = root.querySelector('.msg')
    const tabs = [...root.querySelectorAll('.tabs button')]

    function setMessage(text) { msg.textContent = text; msg.style.display = text ? 'block' : 'none' }
    function setMode(next) {
      mode = next; otpSent = false; otpInput.style.display = 'none'; verifyButton.style.display = 'none'; sendButton.style.display = 'block';
      tabs.forEach(button => button.classList.toggle('active', button.dataset.mode === mode))
      contactInput.value = ''; contactInput.type = mode === 'email' ? 'email' : 'tel'; contactInput.placeholder = mode === 'email' ? 'Email address' : 'Mobile number'
      setMessage('')
    }
    tabs.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)))

    root.querySelector('.google').addEventListener('click', async () => {
      await firebaseReady
      if (!auth) return setMessage('Google login load nahi hua. Internet connection check karein.')
      try {
        const provider = new window.firebase.auth.GoogleAuthProvider()
        if (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) await auth.signInWithRedirect(provider)
        else await auth.signInWithPopup(provider)
      } catch (error) { setMessage(error?.message || 'Google login nahi hua.') }
    })

    sendButton.addEventListener('click', async () => {
      const fullName = nameInput.value.trim()
      let contact = contactInput.value.trim()
      if (!fullName) return setMessage('Full name dijiye.')
      if (mode === 'email') {
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contact)) return setMessage('Valid email address dijiye.')
      } else {
        const digits = contact.replace(/\\D/g, '')
        if (digits.length !== 10) return setMessage('10-digit mobile number dijiye.')
        contact = `+91${digits}`
        contactInput.value = contact
      }
      sendButton.disabled = true; sendButton.textContent = 'Sending...'; setMessage('')
      try {
        const response = await fetch(`${API}/auth/request-otp`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ name: fullName, contact }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'OTP send nahi hua.')
        otpSent = true; otpInput.style.display = 'block'; verifyButton.style.display = 'block'; sendButton.style.display = 'none'; setMessage(`OTP ${mode === 'email' ? 'email' : 'mobile'} par bhej diya gaya. OTP enter karein.`)
      } catch (error) { setMessage(error.message || 'OTP send nahi hua.'); sendButton.disabled = false; sendButton.textContent = 'Send OTP' }
    })

    verifyButton.addEventListener('click', async () => {
      if (!otpSent) return
      const contact = contactInput.value.trim(); const otp = otpInput.value.trim()
      if (!/^\\d{6}$/.test(otp)) return setMessage('6-digit OTP enter karein.')
      verifyButton.disabled = true; verifyButton.textContent = 'Verifying...'
      try {
        const response = await fetch(`${API}/auth/verify-otp`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ contact, otp }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'OTP verify nahi hua.')
        completeLocalLogin(data)
      } catch (error) { setMessage(error.message || 'OTP verify nahi hua.'); verifyButton.disabled = false; verifyButton.textContent = 'Verify & Login' }
    })
  }

  async function finishFirebaseLogin(firebaseUser) {
    const idToken = await firebaseUser.getIdToken(true)
    const response = await fetch(`${API}/auth/firebase-google`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ idToken }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Google login verify nahi hua.')
    completeLocalLogin(data)
  }

  function completeLocalLogin(data) {
    if (data.token) localStorage.setItem('apna-cart-token', data.token)
    if (data.user) localStorage.setItem('apna-cart-user', JSON.stringify(data.user))
    document.getElementById('apna-firebase-login')?.remove()
    window.dispatchEvent(new Event('storage'))
    location.reload()
  }

  function looksLikeLoginControl(element) {
    if (!element) return false
    const text = `${element.textContent || ''} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`.toLowerCase()
    return /^(account|login|login \/ register|sign in)$/.test(text.trim()) || /open login|login account/.test(text)
  }

  document.addEventListener('click', event => {
    const target = event.target
    const control = target && typeof target.closest === 'function' ? target.closest('button,a,[role="button"]') : null
    if (!control || !looksLikeLoginControl(control)) return
    if (localStorage.getItem('apna-cart-token')) return
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); showLogin()
  }, true)

  window.addEventListener('apna-cart-open-login', showLogin)
  addStyles()
  initFirebase()
})()
