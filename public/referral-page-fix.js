(() => {
  const PAGE_ID = 'ac-referral-page-v2'
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
  const user = () => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || '{}') || {} } catch { return {} } }
  const open = () => {
    if (!localStorage.getItem('apna-cart-token') && !localStorage.getItem('apna-cart-user')) return
    document.querySelectorAll('.sheet-bg,.sheet').forEach(el => el.closest('.sheet-bg')?.remove())
    document.getElementById(PAGE_ID)?.remove()
    const u = user()
    const code = String(u.referralCode || u.contact || u.name || 'APNACART').replace(/\s+/g,'').toUpperCase().slice(0,12)
    const page = document.createElement('div')
    page.id = PAGE_ID
    page.innerHTML = `<style>
      #${PAGE_ID}{position:fixed;inset:0;z-index:50000;background:#f5fbf8;color:#10251e;font-family:Arial,sans-serif;overflow:auto}#${PAGE_ID} *{box-sizing:border-box}
      #${PAGE_ID} .top{background:linear-gradient(145deg,#075c3f,#078a58);color:#fff;padding:12px 16px 30px;border-radius:0 0 30px 30px}.nav{height:52px;display:flex;align-items:center;gap:10px}.back,.share{border:0;background:#ffffff20;color:#fff;border-radius:20px;padding:8px 13px;font-weight:800}.back{font-size:28px;padding:3px 13px}.title{font-size:22px;font-weight:900;flex:1}.hero{text-align:center;padding:12px 0}.gift{font-size:58px}.hero h1{font-size:27px;margin:7px 0}.hero p{font-size:14px;color:#d9f3e7;margin:0}.body{max-width:700px;margin:auto;padding:16px}.card{background:#fff;border:1px solid #dfece6;border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px #164b3820}.code{text-align:center}.code small{display:block;color:#687a74;margin-bottom:8px}.code strong{display:inline-block;border:2px dashed #0b8a59;background:#effaf5;color:#075d3e;border-radius:10px;padding:10px 20px;font-size:21px;letter-spacing:2px}.primary{width:100%;border:0;border-radius:12px;background:#078a58;color:#fff;padding:13px;font-weight:900;font-size:15px;margin-top:12px}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.step{background:#f3faf7;border-radius:13px;padding:14px 8px;text-align:center;font-size:12px;font-weight:800}.step b{display:block;font-size:27px;margin-bottom:7px}.benefit{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #e5eee9}.benefit:last-child{border:0}.benefit i{font-style:normal;font-size:25px}.benefit strong{display:block}.benefit small{color:#71827c}.note{text-align:center;color:#75847f;font-size:12px;line-height:1.5;margin:4px 8px 25px}@media(max-width:520px){.steps{grid-template-columns:1fr}.step{display:flex;align-items:center;text-align:left;gap:10px}.step b{width:35px;margin:0}}
    </style><div class="top"><div class="nav"><button class="back" type="button">‹</button><div class="title">Refer &amp; Earn</div><button class="share" type="button">Share</button></div><div class="hero"><div class="gift">🎁</div><h1>Invite friends &amp; earn rewards</h1><p>Share Apna Cart with your friends and earn on eligible referrals.</p></div></div><div class="body"><div class="card code"><small>Your referral code</small><strong>${esc(code)}</strong><button class="primary copy" type="button">Copy Referral Code</button></div><div class="card"><h2>How it works</h2><div class="steps"><div class="step"><b>📤</b>Share your code</div><div class="step"><b>👥</b>Friend joins</div><div class="step"><b>🎉</b>Get eligible rewards</div></div></div><div class="card"><h2>Why refer friends?</h2><div class="benefit"><i>💰</i><div><strong>Earn rewards</strong><small>Eligible referrals can earn rewards.</small></div></div><div class="benefit"><i>🛍️</i><div><strong>Help friends shop</strong><small>Invite friends to Apna Cart.</small></div></div><div class="benefit"><i>📱</i><div><strong>Easy sharing</strong><small>Share through WhatsApp or other apps.</small></div></div><button class="primary invite" type="button">Invite Friends</button></div><p class="note">Referral rewards are subject to Apna Cart's current eligibility and reward rules.</p></div>`
    document.body.appendChild(page)
    const text = `Join me on Apna Cart! Use my referral code ${code}.`
    const share = () => { if (navigator.share) navigator.share({ title:'Join Apna Cart', text }).catch(()=>{}); else if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=>alert('Invite message copied.')).catch(()=>alert(text)); else alert(text) }
    page.querySelector('.back').onclick = () => page.remove()
    page.querySelector('.share').onclick = share
    page.querySelector('.invite').onclick = share
    page.querySelector('.copy').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(code).then(()=>alert('Referral code copied!')).catch(()=>alert(code)); else alert(code) }
  }
  window.openReferralPage = open
  const intercept = (e) => {
    const el = e.target?.closest?.('[data-a="referral"]')
    if (!el) return
    e.preventDefault(); e.stopImmediatePropagation(); open()
  }
  document.addEventListener('click', intercept, true)
})()
