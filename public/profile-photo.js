(() => {
  const KEY = 'apna-cart-profile-photo'
  const STYLE_ID = 'apna-cart-profile-photo-style'
  const PANEL_ID = 'apna-cart-profile-photo-panel'

  function loggedIn() {
    try { return !!localStorage.getItem(KEY) || !!localStorage.getItem('apna-cart-token') || !!localStorage.getItem('apna-cart-user') } catch { return false }
  }
  function getPhoto() { try { return localStorage.getItem(KEY) || '' } catch { return '' } }
  function savePhoto(data) { try { localStorage.setItem(KEY, data) } catch { alert('Photo save nahi ho payi. Thodi chhoti photo select karein.') } }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
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
    `
    document.head.appendChild(style)
  }

  function openPanel() {
    if (!loggedIn()) { alert('Pehle login karein, phir profile photo laga sakte hain.'); return }
    document.getElementById(PANEL_ID)?.remove()
    const panel = document.createElement('div')
    panel.id = PANEL_ID
    const photo = getPhoto()
    panel.innerHTML = `<div class="profile-photo-sheet"><div class="profile-photo-preview">${photo ? `<img src="${photo}" alt="Profile photo">` : '<span>👤</span>'}</div><h3>Profile Photo</h3><p>Apne account par profile photo lagayein.</p><div class="profile-photo-actions"><button class="choose" type="button">📷 Choose Photo</button><button class="remove" type="button">Remove Photo</button></div><button class="close" type="button">Close</button><input class="profile-photo-input" type="file" accept="image/*" hidden></div>`
    document.body.appendChild(panel)
    const input = panel.querySelector('.profile-photo-input')
    panel.querySelector('.choose').addEventListener('click', () => input.click())
    panel.querySelector('.remove').addEventListener('click', () => { try { localStorage.removeItem(KEY) } catch {} panel.remove(); window.dispatchEvent(new Event('apna-cart-profile-photo-updated')) })
    panel.querySelector('.close').addEventListener('click', () => panel.remove())
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove() })
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) return alert('Sirf image select karein.')
      if (file.size > 5 * 1024 * 1024) return alert('Photo 5 MB se chhoti honi chahiye.')
      const reader = new FileReader()
      reader.onload = () => { savePhoto(String(reader.result)); panel.remove(); window.dispatchEvent(new Event('apna-cart-profile-photo-updated')) }
      reader.readAsDataURL(file)
    })
  }
  window.openProfilePhotoPanel = openPanel

  function addReferralStyles() {
    if (document.getElementById('ac-referral-style')) return
    const s = document.createElement('style')
    s.id = 'ac-referral-style'
    s.textContent = `
      #ac-referral-page{position:fixed;inset:0;z-index:25000;background:#f5fbf8;color:#10251e;font-family:Arial,sans-serif;overflow:auto}
      #ac-referral-page *{box-sizing:border-box}
      #ac-referral-page .rp-top{background:linear-gradient(145deg,#075c3f,#078a58);color:#fff;padding:16px 18px 30px;border-radius:0 0 30px 30px}
      #ac-referral-page .rp-nav{display:flex;align-items:center;gap:12px;height:52px}.rp-back{border:0;background:transparent;color:#fff;font-size:34px;width:38px}.rp-title{font-size:22px;font-weight:900;flex:1}.rp-share{border:0;background:#ffffff22;color:#fff;border-radius:20px;padding:9px 13px;font-weight:800}
      #ac-referral-page .rp-hero{text-align:center;padding:18px 5px 4px}.rp-gift{font-size:58px}.rp-hero h1{font-size:28px;margin:8px 0}.rp-hero p{margin:0;color:#d9f3e7;font-size:14px}
      #ac-referral-page .rp-body{max-width:700px;margin:auto;padding:16px 16px 40px}.rp-code{background:#fff;border:1px solid #dfece6;border-radius:18px;padding:18px;box-shadow:0 2px 8px #164b3820;text-align:center;margin-bottom:14px}.rp-code small{display:block;color:#6a7b75;margin-bottom:8px}.rp-code strong{display:inline-block;border:2px dashed #0b8a59;color:#075d3e;background:#effaf5;border-radius:10px;padding:11px 20px;font-size:21px;letter-spacing:2px}.rp-code button{display:block;width:100%;margin-top:12px;padding:12px;border:0;border-radius:11px;background:#078a58;color:#fff;font-weight:800;font-size:15px}
      #ac-referral-page .rp-card{background:#fff;border:1px solid #dfece6;border-radius:18px;padding:16px;margin-bottom:14px}.rp-card h2{font-size:19px;margin:0 0 13px}.rp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.rp-step{text-align:center;background:#f4faf7;border-radius:13px;padding:13px 6px}.rp-step b{display:block;font-size:25px;margin-bottom:7px}.rp-step span{font-size:12px;font-weight:700}.rp-benefit{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #e5eee9}.rp-benefit:last-child{border:0}.rp-benefit i{font-style:normal;font-size:25px;width:38px;text-align:center}.rp-benefit strong{display:block;font-size:14px}.rp-benefit small{display:block;color:#71827c;margin-top:3px}.rp-invite{width:100%;padding:14px;border:0;border-radius:13px;background:#078a58;color:#fff;font-size:16px;font-weight:900;margin-top:4px}.rp-note{font-size:12px;color:#75847f;text-align:center;line-height:1.5}
      @media(max-width:520px){.rp-steps{grid-template-columns:1fr}.rp-step{display:flex;align-items:center;gap:10px;text-align:left}.rp-step b{margin:0;width:35px}}
    `
    document.head.appendChild(s)
  }

  function openReferral() {
    if (!loggedIn()) { alert('Pehle login karein.'); return }
    addReferralStyles()
    document.querySelectorAll('.sheet-bg,.sheet').forEach(el => el.closest('.sheet-bg')?.remove())
    document.querySelectorAll('[id="ac-referral-page"]').forEach(el => el.remove())
    const user = (() => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || '{}') || {} } catch { return {} } })()
    const code = String(user.referralCode || user.contact || user.name || 'APNACART').replace(/\s+/g,'').toUpperCase().slice(0,12)
    const page = document.createElement('div'); page.id='ac-referral-page'
    page.innerHTML=`<div class="rp-top"><div class="rp-nav"><button class="rp-back" type="button">‹</button><div class="rp-title">Refer &amp; Earn</div><button class="rp-share" type="button">Share</button></div><div class="rp-hero"><div class="rp-gift">🎁</div><h1>Invite friends &amp; earn rewards</h1><p>Share Apna Cart with your friends and earn when they join.</p></div></div><div class="rp-body"><div class="rp-code"><small>Your referral code</small><strong>${esc(code)}</strong><button class="rp-copy" type="button">Copy Referral Code</button></div><div class="rp-card"><h2>How it works</h2><div class="rp-steps"><div class="rp-step"><b>📤</b><span>Share your code with friends</span></div><div class="rp-step"><b>👥</b><span>Friend joins Apna Cart</span></div><div class="rp-step"><b>🎉</b><span>Get eligible rewards</span></div></div></div><div class="rp-card"><h2>Why refer friends?</h2><div class="rp-benefit"><i>💰</i><div><strong>Earn rewards</strong><small>Rewards can be credited for eligible referrals.</small></div></div><div class="rp-benefit"><i>🛍️</i><div><strong>Help friends shop</strong><small>Send them your Apna Cart invite in seconds.</small></div></div><div class="rp-benefit"><i>📱</i><div><strong>Easy sharing</strong><small>Share through WhatsApp, messages or other apps.</small></div></div><button class="rp-invite" type="button">Invite Friends</button></div><p class="rp-note">Referral rewards are subject to Apna Cart's current referral eligibility and reward rules.</p></div>`
    document.body.appendChild(page)
    const share = () => { const text=`Join me on Apna Cart! Use my referral code ${code}.`; if(navigator.share) navigator.share({title:'Join Apna Cart',text}).catch(()=>{}); else if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>alert('Invite message copied.')).catch(()=>alert(text)); else alert(text) }
    page.querySelector('.rp-back').onclick=()=>page.remove()
    page.querySelector('.rp-copy').onclick=()=>{ if(navigator.clipboard) navigator.clipboard.writeText(code).then(()=>alert('Referral code copied!')).catch(()=>alert(code)); else alert(code) }
    page.querySelector('.rp-share').onclick=share
    page.querySelector('.rp-invite').onclick=share
  }
  window.openReferralPage = openReferral

  function ensureReferralTrigger() {
    if (document.querySelector('.referral-fab')) return
    const trigger=document.createElement('button'); trigger.type='button'; trigger.className='referral-fab'; trigger.setAttribute('aria-hidden','true'); trigger.style.display='none'; trigger.addEventListener('click',openReferral); document.body.appendChild(trigger)
  }

  function watch() {
    addStyles()
    ensureReferralTrigger()
    document.addEventListener('click', e => {
      const referral = e.target?.closest?.('[data-a="referral"]')
      if (!referral) return
      e.preventDefault()
      e.stopImmediatePropagation()
      openReferral()
    }, true)
    window.addEventListener('apna-cart-profile-photo-updated', () => window.dispatchEvent(new Event('apna-cart-profile-updated')))
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch)
  else watch()
})()
