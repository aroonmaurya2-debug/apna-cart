(() => {
  const user = () => { try { return JSON.parse(localStorage.getItem('apna-cart-user') || 'null') } catch { return null } }
  const shouldAutoOpen = () => localStorage.getItem('apna-cart-open-account') === '1'
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  function css(){
    if(document.getElementById('apna-account-page-css')) return
    const s=document.createElement('style');s.id='apna-account-page-css';s.textContent=`
      #apna-account-page{position:fixed;inset:0;z-index:19000;background:#fff;color:#303039;font-family:Arial,sans-serif;overflow:auto}
      #apna-account-page .ap-head{height:64px;border-bottom:1px solid #ddd;display:flex;align-items:center;padding:0 18px;gap:18px;box-sizing:border-box;background:#fff;position:sticky;top:0;z-index:2}
      #apna-account-page .ap-head button{border:0;background:transparent;font-size:34px;color:#555;padding:0 4px;line-height:1}.ap-title{font-size:23px;font-weight:800;flex:1}.ap-search{font-size:30px}.ap-cart{font-size:27px;position:relative}.ap-cart b{position:absolute;right:-7px;top:-8px;background:#a52a9a;color:#fff;border-radius:12px;font-size:12px;padding:3px 6px}
      #apna-account-page .ap-body{padding:24px 25px 45px;max-width:720px;margin:auto}
      .ap-supplier{display:flex;align-items:center;justify-content:space-between;font-size:19px;font-weight:800;margin:10px 0 68px}.ap-proceed{border:0;background:#a92a9d;color:#fff;border-radius:5px;padding:11px 15px;font-size:19px;font-weight:800;box-shadow:0 3px 7px #bbb}
      .ap-profile{display:flex;align-items:center;gap:16px;margin-bottom:18px}.ap-avatar{width:88px;height:88px;border-radius:50%;background:#ffe8c0;display:flex;align-items:center;justify-content:center;font-size:52px;position:relative}.ap-camera{position:absolute;right:-3px;bottom:0;background:#fff;border:1px solid #aaa;border-radius:50%;font-size:17px;padding:5px}.ap-name{font-size:28px;font-weight:800;flex:1}.ap-arrow{font-size:42px;color:#666}
      .ap-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}.ap-action{min-height:145px;border:1px solid #d5d2df;border-radius:18px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-size:18px;color:#303039}.ap-icon{font-size:31px}.ap-earn{border:1px solid #d5d2df;border-radius:14px;padding:14px 17px;margin-bottom:27px;display:flex;align-items:center;justify-content:space-between}.ap-earn strong{display:block;font-size:20px}.ap-earn small{color:#777;font-size:15px}.ap-money{font-size:27px;font-weight:900;color:#07915e;border:2px solid #b9e0d1;padding:9px 16px;border-radius:5px}
      .ap-section{font-size:25px;font-weight:800;margin:22px 0 9px}.ap-row{display:flex;align-items:center;gap:18px;min-height:67px;border-bottom:1px solid #bbb;font-size:19px}.ap-row .ri{width:28px;text-align:center;font-size:22px}.ap-new{margin-left:auto;background:#e7edff;color:#5a82dc;border-radius:18px;padding:6px 11px;font-size:13px}.ap-logout{width:100%;margin-top:28px;border:1px solid #078a58;background:#fff;color:#078a58;border-radius:10px;min-height:48px;font-weight:800;font-size:16px}
      @media(max-width:430px){#apna-account-page .ap-body{padding:18px 25px 40px}.ap-supplier{margin-bottom:68px}.ap-name{font-size:25px}.ap-actions{gap:12px}.ap-action{min-height:142px}.ap-section{font-size:24px}}
    `;document.head.appendChild(s)
  }
  function close(){document.getElementById('apna-account-page')?.remove()}
  function open(){
    if(!user() || document.getElementById('apna-account-page')) return
    css();const u=user();const contact=esc(u.contact || 'Apna Cart User');
    const root=document.createElement('div');root.id='apna-account-page';root.innerHTML=`
      <header class="ap-head"><button class="ap-back" aria-label="Back">‹</button><div class="ap-title">ACCOUNT</div><button class="ap-search" aria-label="Search">⌕</button><button class="ap-cart" aria-label="Cart">🛒<b>${Number((JSON.parse(localStorage.getItem('apna-cart-cart')||'[]')).reduce((n,x)=>n+(x.quantity||0),0))}</b></button></header>
      <div class="ap-body">
        <div class="ap-supplier"><span>Go to Supplier Hub</span><button class="ap-proceed">Proceed</button></div>
        <div class="ap-profile"><div class="ap-avatar">👨🏻<span class="ap-camera">📷</span></div><div class="ap-name">${contact}</div><span class="ap-arrow">›</span></div>
        <div class="ap-actions"><button class="ap-action"><span class="ap-icon">📞</span>Help Centre</button><button class="ap-action"><span class="ap-icon">अ<br><small>A</small></span>Change Language</button></div>
        <div class="ap-earn"><div><strong>Invite Friends &amp; Earn</strong><small>Cash in Apna Cart Balance</small></div><div class="ap-money">₹73</div></div>
        <div class="ap-section">My Payments</div>
        <div class="ap-row"><span class="ri">₹</span>Bank &amp; UPI Details</div>
        <div class="ap-row"><span class="ri">▰</span>Payment &amp; Refund</div>
        <div class="ap-section">My Activity</div>
        <div class="ap-row"><span class="ri">अ<br><small>A</small></span>Change Language</div>
        <div class="ap-row"><span class="ri">❤️</span>Wishlisted Products</div>
        <div class="ap-row"><span class="ri">●</span>Shared Products</div>
        <div class="ap-row"><span class="ri">🏪</span>Followed Shops <span class="ap-new">New</span></div>
        <div class="ap-section">Others</div>
        <button class="ap-logout">Logout</button>
      </div>`
    document.body.appendChild(root)
    root.querySelector('.ap-back').onclick=close
    root.querySelector('.ap-logout').onclick=()=>{localStorage.removeItem('apna-cart-token');localStorage.removeItem('apna-cart-user');close();location.reload()}
    root.querySelector('.ap-cart').onclick=()=>{close();document.querySelector('.cart-head')?.click()}
  }
  function init(){
    document.addEventListener('click',e=>{const el=e.target?.closest?.('button,[role="button"]');if(!el)return;const text=((el.textContent||'')+' '+(el.getAttribute('aria-label')||'')).trim();if(/^(account|♙account)$/i.test(text) || /\bAccount\b/i.test(text) && el.closest('.bottom-nav')){if(user()){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()}}},true)
    if(shouldAutoOpen() && user()){localStorage.removeItem('apna-cart-open-account');setTimeout(open,500)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()
})()
