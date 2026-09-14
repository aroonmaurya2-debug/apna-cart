(() => {
  const PAGE_ID = 'ac-referral-page-v3';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getUser = () => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || '{}') || {}; } catch { return {}; } };
  const referralCode = () => {
    const u = getUser();
    const raw = String(u.referralCode || u.contact || u.name || 'APNACART').replace(/[^a-z0-9]/gi, '').toUpperCase();
    return (raw || 'APNACART').slice(-10);
  };

  function share() {
    const text = `Join me on Apna Cart! Use my referral code ${referralCode()}.`;
    if (navigator.share) navigator.share({ title: 'Apna Cart - Refer & Earn', text, url: location.origin }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => alert('Invite message copied.')).catch(() => alert(text));
    else alert(text);
  }

  function open() {
    document.querySelectorAll('.sheet-bg').forEach(el => el.remove());
    document.getElementById(PAGE_ID)?.remove();
    const page = document.createElement('div');
    page.id = PAGE_ID;
    const c = referralCode();
    page.innerHTML = `<style>
      #${PAGE_ID}{position:fixed;inset:0;z-index:999999;background:#f5fbf8;color:#173d31;font-family:Arial,sans-serif;overflow:auto}
      #${PAGE_ID} *{box-sizing:border-box}#${PAGE_ID} .head{background:linear-gradient(145deg,#075b3e,#07915c);color:#fff;padding:14px 16px 28px;border-radius:0 0 28px 28px}
      #${PAGE_ID} .nav{height:48px;display:flex;align-items:center;gap:10px}.btn{border:0;background:#ffffff22;color:#fff;border-radius:22px;padding:9px 14px;font-weight:800}.back{font-size:28px;padding:4px 14px}.title{flex:1;font-size:21px;font-weight:900}
      #${PAGE_ID} .hero{text-align:center;padding:22px 8px 4px}.gift{font-size:68px}.hero h1{font-size:29px;margin:12px 0 7px}.hero p{margin:0;color:#d9f5e8;font-size:15px;line-height:1.45}
      #${PAGE_ID} .body{max-width:720px;margin:auto;padding:16px 16px 40px}.card{background:#fff;border:1px solid #dcece5;border-radius:18px;padding:18px;margin-bottom:14px;box-shadow:0 2px 10px #164b3818}.code{text-align:center}.label{color:#71827c;font-size:14px}.code strong{display:block;color:#078a58;font-size:30px;letter-spacing:2px;margin:6px 0 14px}.copy,.primary{border-radius:13px;padding:13px 16px;font-weight:900;font-size:15px}.copy{border:1px solid #078a58;background:#effaf5;color:#078a58}.primary{width:100%;border:0;background:#078f5b;color:#fff;margin-top:12px}.card h2{font-size:20px;margin:0 0 15px}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.step{background:#f3faf7;border-radius:14px;padding:15px 8px;text-align:center;font-size:13px;font-weight:800}.step b{display:block;font-size:27px;margin-bottom:7px}.benefit{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #e5eee9}.benefit:last-child{border-bottom:0}.bi{font-size:25px}.benefit strong{display:block}.benefit span{display:block;color:#71827c;font-size:13px;margin-top:3px}.note{text-align:center;color:#71827c;font-size:12px;line-height:1.5;margin:12px 8px}
      @media(max-width:520px){.steps{grid-template-columns:1fr}.step{display:flex;align-items:center;text-align:left;gap:12px}.step b{width:35px;margin:0}}
    </style><div class="head"><div class="nav"><button class="btn back" type="button">‹</button><div class="title">Refer &amp; Earn</div><button class="btn shareTop" type="button">Share</button></div><div class="hero"><div class="gift">🎁</div><h1>Refer &amp; Earn</h1><p>Apne friends ko Apna Cart par invite karein aur rewards earn karein.</p></div></div><div class="body"><div class="card code"><div class="label">Your Referral Code</div><strong>${esc(c)}</strong><button class="copy" type="button">Copy Referral Code</button><button class="primary shareMain" type="button">🎁 Share Referral</button></div><div class="card"><h2>How it works</h2><div class="steps"><div class="step"><b>📤</b>Share your code</div><div class="step"><b>👥</b>Friend joins</div><div class="step"><b>🎉</b>Earn eligible rewards</div></div></div><div class="card"><h2>Why refer friends?</h2><div class="benefit"><div class="bi">💰</div><div><strong>Earn rewards</strong><span>Successful eligible referrals par rewards paayein.</span></div></div><div class="benefit"><div class="bi">🛍️</div><div><strong>Share great deals</strong><span>Friends ko Apna Cart ke products aur offers share karein.</span></div></div><div class="benefit"><div class="bi">📱</div><div><strong>Easy sharing</strong><span>WhatsApp ya kisi bhi supported app par share karein.</span></div></div><button class="primary shareBottom" type="button">🎁 Invite Friends</button></div><div class="note">Referral rewards ke rules aur amount current campaign ke hisaab se change ho sakte hain.</div></div>`;
    document.body.appendChild(page);
    page.querySelector('.back').onclick = () => page.remove();
    page.querySelector('.shareTop').onclick = share;
    page.querySelector('.shareMain').onclick = share;
    page.querySelector('.shareBottom').onclick = share;
    page.querySelector('.copy').onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(c).then(() => alert('Referral code copied!')).catch(() => alert(c)); else alert(c);
    };
  }

  function isReferralClick(target) {
    const el = target?.closest?.('[data-a="referral"], .ref, .referral-fab, button');
    if (!el) return false;
    if (el.matches('[data-a="referral"], .ref, .referral-fab')) return true;
    return /refer\s*&\s*earn|refer\s*and\s*earn/i.test(el.textContent || '');
  }

  // Capture phase runs before the older account-page popup handler, so its sheet cannot open.
  document.addEventListener('click', e => {
    if (!isReferralClick(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open();
  }, true);

  window.apnaCartOpenReferral = open;
})();
